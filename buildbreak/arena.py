"""Read-only views and private local evidence configuration."""
import json
import os
import queue
import sqlite3
from contextlib import closing
from pathlib import Path
from flask import render_template, request, abort, url_for
from datetime import datetime, timedelta, timezone
from .battle_history import decorate, summarize
from .evidence_images import screenshot_for
from .generated_suite import dashboard_suites, qualified_tests
from .console_payload import console_payload
from .kane_live import start_live_session, get_active_session

STATE_LABELS = {
    'prepared': 'Battle prepared', 'verifying': 'Kane is checking',
    'fault_seeded': 'Challenge ready', 'repairing': 'Builder is repairing',
    'completed': 'Repair verified', 'awaiting_builder': 'Waiting for the Builder',
    'needs_human': 'Human review needed', 'baseline_blocked': 'Baseline blocked',
    'not_detected': 'Fault was not detected', 'infrastructure_error': 'Verification interrupted',
    'passed': 'Passed', 'verification_failed': 'Defect detected', 'failed': 'Failed',
}

def display_time(value):
    try:
        local = datetime.fromisoformat(value).astimezone(timezone(timedelta(hours=5, minutes=30)))
        return local.strftime('%d %b, %I:%M %p') + ' IST'
    except (ValueError, TypeError):
        return 'Time unavailable'


def dashboard_generated_hashes(root):
    suite = Path(root) / 'seatpilot-attempt-02'
    try:
        return set(qualified_tests(suite).values())
    except (OSError, ValueError, KeyError, TypeError):
        return set()


def generated_suite_cards(root, sessions):
    summaries = dashboard_suites(Path(root))
    for suite in summaries:
        counts = suite['counts']
        suite['healthy_state'] = (
            'Passed twice on healthy app' if counts and counts['kept']
            else 'Healthy verification pending' if counts and counts['kept'] + counts['dropped'] < counts['approved']
            else 'No test passed twice on a healthy app' if counts
            else 'Not recorded'
        )
        suite['fault_state'] = 'Not recorded'
        if not counts:
            continue
        try:
            approved_hashes = set(qualified_tests(Path(root) / suite['target']).values())
        except (OSError, ValueError, KeyError, TypeError):
            continue
        for session in sessions:
            if not session.get('mode', '').startswith('SeatPilot generated suite /'):
                continue
            if not any(dict(run).get('test_hash') in approved_hashes for run in session['verifications']):
                continue
            detail = session.get('drill') or {}
            if detail.get('independently_validated'):
                if detail.get('outcome') in {'caught_and_repaired', 'caught_needs_human'}:
                    suite['fault_state'] = 'Caught a confirmed fault'
                elif detail.get('outcome') == 'escaped':
                    suite['fault_state'] = 'A confirmed fault escaped the selected checks'
            break
    return summaries


SCHEMA = """CREATE TABLE IF NOT EXISTS battles (
 id TEXT PRIMARY KEY, baseline TEXT, fault TEXT, repair TEXT);
CREATE TABLE IF NOT EXISTS battle_runs (
 battle_id TEXT, phase TEXT, execution_id TEXT, result TEXT,
 subtotal INTEGER, expected INTEGER, actual INTEGER,
 PRIMARY KEY (battle_id, phase));"""

def local_sources(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError, TypeError):
        return {}

def availability(source):
    if not source:
        return "Not configured"
    try:
        return "Available locally" if Path(source).is_file() else "Unavailable"
    except (OSError, ValueError, TypeError):
        return "Unable to check"

def register_arena(app):
    app.jinja_env.filters['arena_state'] = lambda value: STATE_LABELS.get(value, 'Unknown state')
    app.jinja_env.filters['arena_time'] = display_time
    app.config.setdefault("ARENA_DATABASE", str(Path(app.instance_path) / "arena.sqlite3"))
    app.config.setdefault("ARENA_GENERATED_SUITES", Path(app.root_path) / ".testmuai/tests/generated")
    app.config.setdefault("ARENA_SOURCES", str(Path(app.instance_path) / "arena-sources.json"))
    app.config.setdefault('ARENA_ARTIFACTS', str(Path(app.instance_path) / 'battles'))
    with closing(sqlite3.connect(app.config["ARENA_DATABASE"])) as connection:
        connection.executescript(SCHEMA)
        if not app.config.get('ARENA_ISOLATED_COPY'):
            from .judge_history import ensure_schema as ensure_judge_schema
            ensure_judge_schema(connection)

    if app.config.get('ARENA_ISOLATED_COPY'):
        def judge_history():
            return []
    else:
        from .judge_history import load_judge_records

        def judge_history():
            return load_judge_records(app.config['ARENA_DATABASE'])

    def live_battles():
        with closing(sqlite3.connect(app.config["ARENA_DATABASE"])) as connection:
            connection.row_factory = sqlite3.Row
            if not connection.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='arena_sessions'").fetchone():
                return []
            sessions = []
            has_details = connection.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='arena_drill_details'").fetchone()
            for row in connection.execute("SELECT * FROM arena_sessions ORDER BY created DESC LIMIT 10"):
                item = dict(row)
                item["events"] = connection.execute("SELECT at,kind,message FROM arena_events WHERE battle_id=? ORDER BY seq", (row["id"],)).fetchall()
                item["verifications"] = connection.execute("SELECT phase,attempt,result,evidence_id,pack_hash,test_hash,duration FROM arena_verifications WHERE battle_id=? ORDER BY rowid", (row["id"],)).fetchall()
                detail = connection.execute('SELECT * FROM arena_drill_details WHERE battle_id=?', (row['id'],)).fetchone() if has_details else None
                sessions.append(decorate(item, dict(detail) if detail else None))
            return sessions

    def attach_screenshots(sessions, selected):
        for session in sessions:
            session['screenshots'] = []
            if session['id'] != selected:
                continue
            for phase, title in [('before', 'After fault injection'), ('after', 'After repair')]:
                runs = [dict(run) for run in session['verifications'] if run['phase'] == phase]
                run = runs[-1] if runs else None
                image = screenshot_for(app.config['ARENA_ARTIFACTS'], session['id'], run) if run else None
                session['screenshots'].append(dict(
                    title=title, result=run['result'] if run else None,
                    evidence_id=run['evidence_id'] if run else None,
                    checkpoint=image.checkpoint if image else None,
                    ordinal=image.ordinal if image else None,
                    observations=image.observations if image else (),
                    url=url_for('arena_screenshot', battle=session['id'], phase=phase, attempt=run['attempt']) if image else None,
                    unavailable='Screenshot unavailable' if run else 'Waiting for verification'))

    @app.get('/arena/evidence/<battle>/<phase>/<int:attempt>/screenshot')
    def arena_screenshot(battle, phase, attempt):
        with closing(sqlite3.connect(app.config['ARENA_DATABASE'])) as connection:
            connection.row_factory = sqlite3.Row
            if not connection.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='arena_verifications'").fetchone():
                abort(404)
            run = connection.execute('''SELECT phase,attempt,result,evidence_id,pack_hash,test_hash
                FROM arena_verifications WHERE battle_id=? AND phase=? AND attempt=?''',
                (battle, phase, attempt)).fetchone()
        image = screenshot_for(app.config['ARENA_ARTIFACTS'], battle, dict(run)) if run else None
        if image is None:
            abort(404)
        response = app.response_class(image.content, mimetype=image.mimetype)
        response.headers.update({'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
                                 'Referrer-Policy': 'no-referrer',
                                 'Content-Disposition': 'inline; filename="screenshot.' + ('jpg' if image.mimetype == 'image/jpeg' else 'png') + '"'})
        return response

    @app.get("/arena/live")
    def arena_live():
        sessions = live_battles()
        selected = request.args.get('battle') or (sessions[0]['id'] if sessions else None)
        attach_screenshots(sessions, selected)
        response = app.make_response(render_template("live_battles.html", sessions=sessions, selected_id=selected,
                                                     scores=summarize(sessions)))
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get('/arena/data')
    def arena_data():
        sessions = live_battles()
        selected = request.args.get('battle') or (sessions[0]['id'] if sessions else None)
        hashes = dashboard_generated_hashes(app.config['ARENA_GENERATED_SUITES'])
        payload = console_payload(sessions, app.config['ARENA_ARTIFACTS'],
                                  selected, display_time, hashes)
        payload['judgeWorkflows'] = judge_history()
        response = app.json.response(payload)
        response.headers.update({'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'})
        return response

    # Remote/public instances remain read-only unless a local operator opts in.
    app.config.setdefault('ARENA_ENABLE_LIVE_KANE', os.environ.get('ARENA_ENABLE_LIVE_KANE') == '1')

    def require_local_viewer():
        if request.remote_addr not in {'127.0.0.1', '::1'} or request.host.split(':')[0] not in {'localhost', '127.0.0.1'}:
            abort(403)
        origin = request.headers.get('Origin')
        if origin and origin != request.host_url.rstrip('/'):
            abort(403)

    from .project_setup import register_project_routes
    register_project_routes(app, require_local_viewer)

    @app.post('/api/kane/run')
    def api_kane_run():
        require_local_viewer()
        if request.headers.get('X-Arena-Request') != '1':
            abort(403)
        if not app.config['ARENA_ENABLE_LIVE_KANE']:
            return app.json.response(error='Live launch is disabled. Set ARENA_ENABLE_LIVE_KANE=1 locally and restart the app to enable it.'), 403
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return app.json.response(error='Expected a JSON object.'), 400
        try:
            session = start_live_session(
                data.get('target_url', 'http://127.0.0.1:5000'),
                data.get('test_path', '.testmuai/tests/CheckoutConsistency_test.md'),
                data.get('show_browser', True))
        except ValueError as error:
            return app.json.response(error=str(error)), 400
        return app.json.response(status=session.status, session_id=session.id)

    @app.get('/api/kane/stream')
    def api_kane_stream():
        require_local_viewer()
        session = get_active_session()
        if not session:
            return app.response_class('data: {"type":"snapshot","status":"idle"}\n\n',
                mimetype='text/event-stream', headers={'Cache-Control': 'no-store'})
        try:
            listener = session.add_listener()
        except ValueError:
            abort(429)

        def event_stream():
            try:
                while True:
                    try:
                        event = listener.get(timeout=15)
                        yield f'data: {json.dumps(event)}\n\n'
                        if event.get('type') in {'status', 'snapshot'} and event.get('status') != 'running':
                            return
                    except queue.Empty:
                        yield ': ping\n\n'
            finally:
                session.remove_listener(listener)

        response = app.response_class(event_stream(), mimetype='text/event-stream',
            headers={'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no',
                     'X-Content-Type-Options': 'nosniff'})
        response.call_on_close(lambda: session.remove_listener(listener))
        return response

    @app.get('/api/kane/live-view')
    def api_kane_live_view():
        require_local_viewer()
        session = get_active_session()
        if (not session or session.status != 'running' or not session.browser
                or request.args.get('session') != session.id):
            abort(404)
        # Frames come from this session's owned Chrome, never a client URL/file.
        def active():
            return session is get_active_session() and session.status == 'running'
        return app.response_class(session.browser.frames(active),
            mimetype='multipart/x-mixed-replace; boundary=arena-frame',
            headers={'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
                     'Referrer-Policy': 'no-referrer', 'X-Accel-Buffering': 'no'})

    @app.get('/api/kane/screenshot')
    def api_kane_screenshot():
        require_local_viewer()
        session = get_active_session()
        if (request.args.get('file') is not None or not session or not session.screenshot
                or request.args.get('session') != session.id):
            abort(404)
        # Only bytes from the hash-checked sealed pack; no client-supplied paths.
        return app.response_class(session.screenshot.content, mimetype=session.screenshot.mimetype,
            headers={'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
                     'Referrer-Policy': 'no-referrer'})

    @app.get("/arena")
    def arena():
        with closing(sqlite3.connect(app.config["ARENA_DATABASE"])) as connection:
            connection.row_factory = sqlite3.Row
            battle = connection.execute("SELECT * FROM battles WHERE id = ?", ("discount-regression",)).fetchone()
            runs = connection.execute("SELECT * FROM battle_runs WHERE battle_id = ? ORDER BY CASE phase WHEN 'before' THEN 0 ELSE 1 END", ("discount-regression",)).fetchall()
        sources = local_sources(app.config["ARENA_SOURCES"])
        evidence = {}
        for run in runs:
            source = sources.get(run["phase"], {})
            if not isinstance(source, dict):
                source = {}
            evidence[run["phase"]] = {key: availability(source.get(key)) for key in ("report", "pack")}
        sessions = live_battles()
        selected = request.args.get('battle') or (sessions[0]['id'] if sessions else None)
        generated_suites = generated_suite_cards(app.config['ARENA_GENERATED_SUITES'], sessions)
        hashes = dashboard_generated_hashes(app.config['ARENA_GENERATED_SUITES'])
        attach_screenshots(sessions, selected)
        payload = console_payload(sessions, app.config['ARENA_ARTIFACTS'],
                                  selected, display_time, hashes)
        payload['judgeWorkflows'] = judge_history()
        return render_template("arena.html", battle=battle, runs=runs, evidence=evidence, sessions=sessions,
                               generated_suites=generated_suites,
                               selected_id=selected, scores=summarize(sessions),
                               console_payload=payload)
