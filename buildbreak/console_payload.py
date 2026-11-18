"""Allowlisted data adapter for the user's original console UI, never raw logs."""
from .evidence_images import screenshot_for
from .evidence_images import pack_path
from flask import url_for
import json


def recorded_exit(artifacts, battle, run):
    if not run:
        return 'Not recorded'
    try:
        path = pack_path(artifacts, battle, run['phase'], run['attempt']).parent / 'artifact-provenance.json'
        if path.is_symlink() or not path.is_file() or path.stat().st_size > 10000:
            return 'Not recorded'
        value = json.loads(path.read_text(encoding='utf-8')).get('process_exit_code')
        return value if type(value) is int and -1 <= value <= 255 else 'Not recorded'
    except (OSError, ValueError, TypeError, KeyError):
        return 'Not recorded'


def console_payload(sessions, artifacts, selected, format_time):
    battles = []
    for session in sessions:
        detail = session.get('drill') or {}
        runs = {run['phase']: dict(run) for run in session['verifications']}
        images = {phase: screenshot_for(artifacts, session['id'], run)
                  for phase, run in runs.items()}
        shots = {}
        for phase, slot in [('before', 'failure'), ('after', 'repair')]:
            run, image = runs.get(phase), images.get(phase)
            reference = run['evidence_id'] if run else None
            shots[slot] = {
                'isSample': False, 'status': 'available' if image else 'missing',
                'url': url_for('arena_screenshot', battle=session['id'], phase=phase,
                               attempt=run['attempt']) if image else None,
                'caption': (image.checkpoint if image else 'No verified capture available') + ' · Recorded, not live',
                'artifactPath': reference or 'Not recorded',
                'alt': 'Recorded Kane ' + slot + ' viewport',
                'missingReason': 'No supported screenshot matches the archived execution and hash.'
            }
        observations = {}
        for phase, image in images.items():
            observations[phase] = {label.rsplit(' ', 1)[-1]: amount
                                   for label, amount in image.observations} if image else {}
        comparisons = []
        for field in ('subtotal', 'discount', 'total'):
            expected = observations.get('baseline', {}).get(field)
            before = observations.get('before', {}).get(field)
            after = observations.get('after', {}).get(field)
            if any((expected, before, after)):
                comparisons.append(dict(check='Kane recorded ' + field + ' (healthy baseline reference)',
                                         expected=expected or 'Not recorded',
                                         actualPreRepair=before or 'Not recorded',
                                         actualPostRepair=after or 'Not recorded',
                                         matched=bool(expected and after == expected)))
        state = session['state']
        outcome = (detail.get('outcome_label') if detail.get('outcome') else None) or {
            'completed': 'Repair verified', 'baseline_blocked': 'Baseline blocked',
            'infrastructure_error': 'Infrastructure interrupted', 'needs_human': 'Human review',
            'not_detected': 'Not detected', 'awaiting_builder': 'Waiting for Builder'
        }.get(state, 'Pending inspection')
        tone = ('success' if state == 'completed' else 'danger' if state in
                {'needs_human', 'infrastructure_error', 'baseline_blocked'} else 'warning')
        def trace(kinds):
            return '\n'.join(event['message'] for event in session['events']
                             if event['kind'] in kinds) or 'Not recorded'
        stages = [
            dict(key='propose', actor=detail.get('producer_label', 'Breaker'), label='Proposes fault',
                 state='Completed' if detail.get('producer') else 'Not recorded',
                 note='Source: ' + (detail.get('source') or 'Not recorded'),
                 traceSnippet=trace({'fault_rejected', 'fault_accepted', 'fault_seeded'})),
            dict(key='validate', actor='Arena', label='Validates fault',
                 state='Completed' if detail.get('independently_validated') else 'Not recorded',
                 note='Independent invariant: ' + (detail.get('invariant') or 'Not recorded'),
                 traceSnippet=trace({'direct_baseline_passed', 'fault_seeded'})),
            dict(key='kane_break', actor='Kane CLI', label='Checks broken app',
                 state='Completed' if runs.get('before') else 'Not recorded',
                 note=runs.get('before', {}).get('result', 'Not recorded'),
                 traceSnippet=runs.get('before', {}).get('evidence_id') or 'Not recorded'),
            dict(key='codex_repair', actor='Codex' if 'codex Builder' in session['mode'] else 'Builder',
                 label='Repairs fault', state='Completed' if state == 'completed' else 'Pending',
                 note=str(session['attempts']) + ' recorded repair attempts',
                 traceSnippet=trace({'builder_started', 'builder_rejected', 'unit_tests_passed', 'unit_tests_failed'})),
            dict(key='kane_verify', actor='Kane CLI', label='Verifies again',
                 state='Completed' if runs.get('after', {}).get('result') == 'passed' else 'Not recorded',
                 note=runs.get('after', {}).get('result', 'Not recorded'),
                 traceSnippet=runs.get('after', {}).get('evidence_id') or 'Not recorded'),
        ]
        seatpilot = session['mode'].startswith('SeatPilot / ')
        target_app = 'SeatPilot' if seatpilot else 'BreakShop'
        test_name = 'SeatPilotBooking_test.md' if seatpilot else 'CheckoutConsistency_test.md'
        checks = [dict(id=phase, command='kane-cli testmd run .testmuai/tests/' + test_name,
                       result=run['result'], detail='Execution: ' + (run['evidence_id'] or 'Not recorded') +
                       '; protected test SHA-256: ' + run['test_hash']) for phase, run in runs.items()]
        battles.append(dict(
            id=session['id'], isSample=False, title=outcome + ' · ' + target_app, targetApp=target_app,
            recordedLabel=format_time(session['created']), breaker=detail.get('producer_label') or session['mode'],
            faultFamily=detail.get('family') or 'Not recorded', outcome=outcome, outcomeTone=tone,
            repairAttempts=session['attempts'], maxAttempts=detail.get('max_attempts') or 3,
            summary=session['mode'] + ' · ' + (detail.get('source') or 'Source not recorded') +
                    ('. Results cover the frozen booking flow only; screenshots are viewports, not assertions. ' if seatpilot
                     else '. Results cover the frozen checkout flow only; screenshots are viewports, not assertions. ') +
                    'Missing values are not inferred. Repeated faults are not new discoveries.' +
                    (' Requirements-only experiment; excluded from normal drill scores.' if detail.get('experiment') else ''),
            stages=stages, comparisons=comparisons, screenshots=shots,
            verification=dict(
                kaneExitCodeBefore=recorded_exit(artifacts, session['id'], runs.get('before')),
                kaneExitCodeAfter=recorded_exit(artifacts, session['id'], runs.get('after')),
                checksSummary='Recorded phase verdicts and protected-test references; no raw logs are exported.',
                checks=checks, stdoutExcerpt='\n'.join(event['message'] for event in session['events']),
                identifiers=dict(battleId=session['id'], geminiProposalId='Not recorded',
                                 arenaValidationId='Not recorded', codexRepairId='Not recorded',
                                 kaneBreakRunId=runs.get('before', {}).get('evidence_id') or 'Not recorded',
                                 kaneVerifyRunId=runs.get('after', {}).get('evidence_id') or 'Not recorded',
                                 sqliteRowKey=session['id']))))
    return dict(schemaVersion='1.0', mode='live_archive', isSample=False,
                status='ready' if battles else 'empty', dataSourceLabel='Local SQLite recorded archive',
                notice='Genuine local battle records. Preview states are separate SAMPLE data. '
                       'Infrastructure problems, escapes and repair results remain distinct. '
                       'Only the ten most recent records are shown.',
                activeBattleId=selected if any(b['id'] == selected for b in battles) else
                               (battles[0]['id'] if battles else None), battles=battles, error=None)
