"""Allowlisted data adapter for the user's original console UI, never raw logs."""
import json
import math
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from flask import url_for

from .evidence_images import pack_path, screenshot_for


def quote_observations(artifacts, battle):
    if not isinstance(battle, str) or not re.fullmatch(r'\d{8}T\d{6}-[a-f0-9]{8}', battle):
        return None
    root = Path(artifacts).absolute()
    path = root / battle / 'coverage-gap' / 'observations.json'
    try:
        if (any(candidate.is_symlink() or getattr(candidate, 'is_junction', lambda: False)()
                for candidate in (path, *path.parents))
                or not path.is_file() or path.stat().st_size > 20000
                or not path.resolve().is_relative_to(root.resolve())):
            return None
        saved = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(saved, dict):
            return None
        result = {}
        for phase in ('healthy', 'changed'):
            quote = saved.get(phase)
            if not isinstance(quote, dict):
                return None
            values = {}
            for source, label in (('subtotal', 'subtotal'), ('discountAmount', 'discount'),
                                  ('total', 'total')):
                amount = quote.get(source)
                if (type(amount) not in (int, float) or amount < 0 or amount > 100000000
                        or not math.isfinite(amount)):
                    return None
                cents = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                values[label] = '$' + format(cents, '.2f')
            result[phase] = values
        return result
    except (OSError, ValueError, TypeError, ArithmeticError):
        return None


def escape_report(artifacts, session, generated_hashes):
    detail = session.get('drill') or {}
    if (not (session.get('mode') or '').startswith('SeatPilot generated suite /')
            or not any(dict(run).get('test_hash') in generated_hashes for run in session['verifications'])):
        return None
    confirmed = bool(detail.get('independently_validated'))
    escaped = (confirmed and session.get('state') == 'not_detected'
               and detail.get('outcome') == 'escaped'
               and detail.get('family') == 'seatpilot_pricing'
               and detail.get('invariant') == 'healthy_vs_changed_quote')
    caught = confirmed and detail.get('outcome') in {'caught_and_repaired', 'caught_needs_human'}
    observations = quote_observations(artifacts, session['id']) if escaped else None
    if observations and observations['healthy'] == observations['changed']:
        observations = None
    not_recorded = {key: 'Not recorded' for key in ('subtotal', 'discount', 'total')}
    return {
        'heading': 'Recorded escape review' if escaped else 'Generated-test fault review',
        'healthyObservation': observations['healthy'] if observations else not_recorded,
        'changedObservation': observations['changed'] if observations else not_recorded,
        'faultStatus': ('Confirmed pricing fault escaped the selected checks.' if escaped
                        else 'Caught a confirmed fault' if caught else 'Not recorded'),
        'browserTestChecked': (
            'Catalog headings before filtering, after selecting Chamber Music, '
            'and after resetting to All Programs.'
        ),
        'missed': ('Ticket pricing; the unchanged catalog test has no pricing assertion.'
                   if escaped else 'Not recorded'),
        'followUp': ('A follow-up test requires explicit human approval before promotion.'
                     if escaped else 'Not recorded'),
    }


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


def console_payload(sessions, artifacts, selected, format_time, generated_hashes=()):
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
        seatpilot = session['mode'].startswith('SeatPilot ')
        target_app = 'SeatPilot' if seatpilot else 'BreakShop'
        if session['mode'].startswith('SeatPilot generated suite /'):
            test_name = ('generated/seatpilot-attempt-02/'
                         'seatpilot-featured-events-category-filter-and-reset_test.md')
        else:
            test_name = 'SeatPilotBooking_test.md' if seatpilot else 'CheckoutConsistency_test.md'
        checks = [dict(id=phase, command='kane-cli testmd run .testmuai/tests/' + test_name,
                       result=run['result'], detail='Execution: ' + (run['evidence_id'] or 'Not recorded') +
                       '; approved test SHA-256: ' + run['test_hash']) for phase, run in runs.items()]
        battles.append(dict(
            id=session['id'], isSample=False, title=outcome + ' · ' + target_app, targetApp=target_app,
            recordedLabel=format_time(session['created']), breaker=detail.get('producer_label') or session['mode'],
            faultFamily=detail.get('family') or 'Not recorded', outcome=outcome, outcomeTone=tone,
            escape=escape_report(artifacts, session, generated_hashes),
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
                checksSummary='Recorded phase verdicts and approved-test references; no raw logs are exported.',
                checks=checks, stdoutExcerpt='\n'.join(event['message'] for event in session['events']),
                identifiers=dict(battleId=session['id'], geminiProposalId='Not recorded',
                                 arenaValidationId='Not recorded', codexRepairId='Not recorded',
                                 kaneBreakRunId=runs.get('before', {}).get('evidence_id') or 'Not recorded',
                                 kaneVerifyRunId=runs.get('after', {}).get('evidence_id') or 'Not recorded',
                                 sqliteRowKey=session['id']))))
    return dict(schemaVersion='1.0', mode='live_archive', isSample=False,
                status='ready' if battles else 'empty', dataSourceLabel='Local SQLite recorded archive',
                notice=('Genuine local battle records. Infrastructure problems, escapes and repair results remain distinct. '
                        'Only the ten most recent records are shown.' if battles else
                        'Showing a fictional UI demo (SAMPLE), not recorded Kane evidence. Your own battles will appear here.'),
                activeBattleId=selected if any(b['id'] == selected for b in battles) else
                               (battles[0]['id'] if battles else None), battles=battles, error=None)
