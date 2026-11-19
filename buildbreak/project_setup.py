"""Local self-service project intake, approval and full-battle monitoring."""
import hashlib
import json
from pathlib import Path
import shutil
import sqlite3
import threading
import time
import uuid
import zipfile

from . import kane_live
from .project_import import import_zip, load_project, inspect_project, MAX_ZIP

ROOT = Path(__file__).resolve().parents[1]


def prerequisites():
    from .battle_runner import executable
    from .live_browser import chrome_executable
    from .gemini_breaker import configuration, GeminiError
    result = {}
    for name, resolve in [('kane', lambda: executable('kane-cli')),
                          ('codex', lambda: executable('codex')), ('chrome', chrome_executable)]:
        try:
            resolve()
            result[name] = True
        except RuntimeError:
            result[name] = False
    try:
        configuration()
        result['gemini'] = True
    except GeminiError:
        result['gemini'] = False
    # Presence/configuration is not a live authentication or credit check.
    return result


def prepare_source(folder, record, destination):
    from .battle_runner import snapshot
    source = folder / 'source'
    if not record['compatible'] or not inspect_project(source, ROOT)['compatible']:
        raise ValueError('This source does not have a supported battle adapter.')
    if record.get('adapter') == 'seatpilot':
        from .seatpilot_adapter import prepare_runtime
        prepare_runtime(destination)
        return
    snapshot(ROOT, destination)
    # Only app/templates/static are imported; acceptance tests and runner come
    # from our canonical supported adapter, never from uploaded tests/scripts.
    shutil.copyfile(source / 'app.py', destination / 'app.py')
    for name in ('shop.html', 'confirmation.html'):
        shutil.copyfile(source / 'templates' / name, destination / 'templates' / name)
    if (source / 'static').is_dir():
        shutil.copytree(source / 'static', destination / 'static', dirs_exist_ok=True)


class BattleSession(kane_live.LiveKaneSession):
    def __init__(self, source, database, artifacts, breaker, show_browser, adapter_name='breakshop'):
        super().__init__('http://127.0.0.1:5000', show_browser=show_browser)
        self.source, self.database, self.artifacts = source, database, artifacts
        self.breaker, self.phase = breaker, None
        self.adapter_name = adapter_name
        if adapter_name == 'seatpilot':
            self.test_path = '.testmuai/tests/SeatPilotBooking_test.md'

    def bind(self, battle):
        self.id = battle
        self.battle_id = battle
        self.broadcast(dict(type='battle', battle_id=battle))

    def progress(self, kind, message, state):
        self.broadcast(dict(type='progress', kind=kind, message=message, state=state))

    def verify(self, workspace, artifacts, url, name, kane, **options):
        from .battle_runner import run_kane
        from .live_browser import LiveBrowser
        from .evidence_images import screenshot_for
        self.phase, attempt = artifacts.name.rsplit('-', 1)
        self.target_url = url
        self.current_step, self.steps = 0, []
        self.latest_screenshot, self.screenshot = None, None
        self.broadcast(dict(type='phase', phase=self.phase, attempt=int(attempt), test_path=self.test_path))
        directory = artifacts.parent / ('browser-' + artifacts.name)
        directory.mkdir()
        self.browser = LiveBrowser(directory, url, self.show_browser, self.browser_state)
        try:
            self.browser.start()
            result = run_kane(workspace, artifacts, url, name, kane,
                              show_browser=self.show_browser, on_line=self.handle_line,
                              cdp_endpoint=self.browser.endpoint,
                              **({'test_path': Path('.testmuai/tests/SeatPilotBooking_test.md')} if self.adapter_name == 'seatpilot' else {}))
        finally:
            self.browser.close()
        self.screenshot = screenshot_for(self.artifacts, self.id,
            dict(result, phase=self.phase, attempt=int(attempt)))
        if self.screenshot:
            self.latest_screenshot = '/api/kane/screenshot?session=' + self.id
            self.broadcast(dict(type='screenshot', url=self.latest_screenshot))
        return result

    def run(self):
        from .battle_runner import run_battle
        if self.adapter_name == 'seatpilot':
            from .seatpilot_runner import run_battle
        self.started_at = time.time()
        self.broadcast(dict(type='status', status='running', message='Full battle started. Source stays isolated; do not interact with Kane Chrome.'))
        try:
            battle = run_battle(root=self.source, breaker=self.breaker, builder='codex', max_attempts=3,
                database=self.database, artifacts_root=self.artifacts,
                on_battle=self.bind, on_event=self.progress, verification_runner=self.verify)
            with sqlite3.connect(self.database) as connection:
                state = connection.execute('SELECT state FROM arena_sessions WHERE id=?', (battle,)).fetchone()[0]
            self.result = state
            self.status = 'passed' if state == 'completed' else 'error' if state == 'infrastructure_error' else 'failed'
            self.error_message = {'completed': 'Caught and repaired. Kane verified the repair.',
                'not_detected': 'Validated fault escaped the selected Kane checks; no repair attempted.',
                'needs_human': 'Repair limit reached. Human review is needed.',
                'baseline_blocked': 'Healthy baseline did not pass. No fault introduced.'}.get(state, 'Verification interrupted; inspect local run records.')
        except Exception:
            self.status, self.result = 'error', 'infrastructure_error'
            self.error_message = 'Battle could not complete. Check setup and private local logs; no passing result is inferred.'
        finally:
            if self.browser:
                self.browser.close()
            self.finished_at = time.time()
            self.broadcast(dict(type='status', status=self.status, result=self.result, message=self.error_message))


def start_battle(source, database, artifacts, breaker, show_browser, adapter_name='breakshop'):
    with kane_live._SESSION_LOCK:
        if kane_live._ACTIVE_SESSION and kane_live._ACTIVE_SESSION.status == 'running':
            raise ValueError('A run is active. Wait for it to finish.')
        session = BattleSession(source, database, artifacts, breaker, show_browser, adapter_name)
        kane_live._ACTIVE_SESSION = session
        session.thread = threading.Thread(target=session.run, daemon=True)
        session.thread.start()
        return session


def register_project_routes(app, require_local_viewer):
    from flask import request
    storage = Path(app.instance_path) / 'projects'
    app.config.setdefault('ARENA_PROJECTS', str(storage))
    if app.config.get('MAX_CONTENT_LENGTH') is None:
        app.config['MAX_CONTENT_LENGTH'] = MAX_ZIP + 1024 * 1024

    def local_write():
        require_local_viewer()
        if request.headers.get('X-Arena-Request') != '1':
            from flask import abort
            abort(403)

    def preflight(project_id):
        if project_id == 'builtin':
            record = dict(id='builtin', framework='Flask', adapter='breakshop', compatible=True,
                          reason='Built-in BreakShop demo with a validated adapter.')
        elif project_id == 'seatpilot':
            record = dict(id='seatpilot', framework='SeatPilot', adapter='seatpilot', compatible=True,
                          reason='Book two concert tickets, apply EARLY15 and reload the saved confirmation.')
        else:
            _, record = load_project(app.config['ARENA_PROJECTS'], project_id)
        test_path = (Path('.testmuai/tests/SeatPilotBooking_test.md') if record.get('adapter')=='seatpilot'
                     else Path(kane_live.TEST_PATH))
        test = (ROOT / test_path).read_bytes()
        requirements = prerequisites()
        if record.get('adapter')=='seatpilot':
            requirements['node'] = bool(shutil.which('node')) and bool(shutil.which('npm.cmd') or shutil.which('npm'))
        return dict(project=record, prerequisites=requirements, enabled=bool(app.config['ARENA_ENABLE_LIVE_KANE']),
                    test_text=test.decode('utf-8'), test_sha256=hashlib.sha256(test).hexdigest(),
                    authentication='CLI presence only; authentication and account allowances are checked by the real run.',
                    supported='BreakShop and the recognized SeatPilot export have explicit adapters. Other React apps still require an adapter.')

    @app.post('/api/projects/import')
    def api_project_import():
        local_write()
        upload = request.files.get('project')
        if not upload:
            return app.json.response(error='Choose a source ZIP first.'), 400
        try:
            record = import_zip(upload.stream, app.config['ARENA_PROJECTS'], ROOT)
            return app.json.response(project=record)
        except (ValueError, OSError, zipfile.BadZipFile):
            return app.json.response(error='Import rejected: invalid, unsafe or oversized ZIP. No imported code was executed.'), 400

    @app.get('/api/projects/<project_id>/preflight')
    def api_project_preflight(project_id):
        require_local_viewer()
        try:
            return app.json.response(preflight(project_id))
        except (ValueError, OSError):
            return app.json.response(error='Project unavailable or changed; import it again.'), 400

    @app.post('/api/projects/<project_id>/battle')
    def api_project_battle(project_id):
        local_write()
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return app.json.response(error='Expected a JSON object.'), 400
        try:
            info = preflight(project_id)
            if not info['enabled']:
                raise ValueError('Local execution is disabled. Set ARENA_ENABLE_LIVE_KANE=1 and restart Arena.')
            if not info['project']['compatible']:
                raise ValueError(info['project']['reason'])
            if data.get('approved') is not True or data.get('test_sha256') != info['test_sha256']:
                raise ValueError('Review and explicitly approve the current acceptance test before launching.')
            breaker = data.get('breaker', 'gemini')
            if breaker not in {'gemini', 'scripted'} or type(data.get('show_browser', True)) is not bool:
                raise ValueError('Select Gemini or scripted mode and a browser boolean.')
            needed = ['chrome', 'kane', 'codex'] + (['gemini'] if breaker == 'gemini' else [])
            if info['project'].get('adapter')=='seatpilot':
                needed += ['node']
            if not all(info['prerequisites'][name] for name in needed):
                raise ValueError('Setup incomplete. Install/sign in to Kane and Codex. For Gemini, restart Arena from a shell with GEMINI_API_KEY, GEMINI_MODEL and free-tier confirmation configured. Keys are never accepted or stored by this form.')
            if kane_live.get_active_session() and kane_live.get_active_session().status == 'running':
                raise ValueError('A run is already active.')
            source = ROOT
            if project_id == 'seatpilot':
                # The runner populates a fresh directory from the bundled, reviewed source.
                source = Path(app.config['ARENA_PROJECTS']) / 'seatpilot' / uuid.uuid4().hex
            elif project_id != 'builtin':
                folder, record = load_project(app.config['ARENA_PROJECTS'], project_id)
                # Make a separate canonical runner snapshot for each launch.
                source = folder / ('prepared-' + uuid.uuid4().hex)
                prepare_source(folder, record, source)
            session = start_battle(source, Path(app.config['ARENA_DATABASE']),
                Path(app.config['ARENA_ARTIFACTS']), breaker, data.get('show_browser', True),
                **({'adapter_name':'seatpilot'} if info['project'].get('adapter')=='seatpilot' else {}))
            return app.json.response(status=session.status)
        except (ValueError, OSError) as error:
            # Validation messages are local fixed strings, never raw subprocess logs.
            message = str(error) if isinstance(error, ValueError) else 'Project preparation failed; no run launched.'
            return app.json.response(error=message), 400
