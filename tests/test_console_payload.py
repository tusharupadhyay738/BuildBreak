"""Offline console adapter fixtures; these are not live Kane executions."""
from contextlib import closing
from pathlib import Path
import json
import tempfile
import re
import sqlite3
import unittest

from app import create_app
from buildbreak.battle_runner import connect, record_run
from buildbreak.battle_history import save_details
from buildbreak.console_payload import console_payload


class ConsoleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1] / 'instance')
        self.root = Path(self.temp.name)
        self.database = self.root / 'arena.sqlite3'
        self.app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'),
                               'ARENA_DATABASE': str(self.database), 'ARENA_ARTIFACTS': str(self.root / 'private-artifacts')})
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp.cleanup()

    def seed(self, state='completed'):
        with connect(self.database) as db:
            db.execute('INSERT INTO arena_sessions VALUES (?,?,?,?,?,?)',
                       ('fixture', '2026-11-17T10:00:00+00:00', state, 'fixture-head', 'gemini Breaker / codex Builder', 1))
            save_details(db, 'fixture', requested='gemini', producer='gemini', source='live',
                         validated=True, family='pricing', invariant='saved_checkout_amounts', max_attempts=3)
        for phase, result in [('baseline', 'passed'), ('before', 'verification_failed'), ('after', 'passed')]:
            record_run(self.database, 'fixture', phase, int(phase == 'after'),
                       dict(result=result, evidence_id='synthetic', pack_hash='fixture', test_hash='fixture', duration=0))

    def test_empty_archive_offers_sample_replay_without_adding_sample_records(self):
        response = self.client.get('/arena/data')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual((data['status'], data['isSample'], data['battles']), ('empty', False, []))
        self.assertEqual(data['notice'], 'Showing a fictional UI demo (SAMPLE), not recorded Kane evidence. Your own battles will appear here.')
        self.assertIn(data['notice'].encode(), self.client.get('/arena').data)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        self.assertEqual(self.client.post('/arena/data').status_code, 405)

    def test_adapter_uses_records_and_never_fabricates_images_values_or_identifiers(self):
        self.seed()
        data = self.client.get('/arena/data').get_json()
        battle = data['battles'][0]
        self.assertEqual((data['isSample'], battle['isSample']), (False, False))
        self.assertEqual((data['status'], len(data['battles'])), ('ready', 1))
        self.assertEqual((battle['id'], battle['breaker'], battle['faultFamily']), ('fixture', 'Gemini', 'pricing'))
        self.assertEqual(battle['comparisons'], [])
        self.assertEqual(battle['screenshots']['failure']['status'], 'missing')
        self.assertEqual(battle['verification']['kaneExitCodeBefore'], 'Not recorded')
        self.assertEqual(battle['verification']['identifiers']['geminiProposalId'], 'Not recorded')
        self.assertNotIn(str(self.root), str(data))
        self.assertNotIn('old_text', str(data))

    def test_infrastructure_remains_distinct_from_a_repair_failure(self):
        self.seed('infrastructure_error')
        battle = self.client.get('/arena/data').get_json()['battles'][0]
        self.assertIn('Infrastructure', battle['outcome'])
        self.assertNotEqual(battle['outcome'], 'Success')

    def test_confirmed_seatpilot_escape_exposes_only_recorded_quote_fields(self):
        battle_id = '20261124T151404-6db82d63'
        folder = self.root / battle_id / 'coverage-gap'
        folder.mkdir(parents=True)
        (folder / 'observations.json').write_text(json.dumps({
            'healthy': {'subtotal': 136, 'discountAmount': 20.4, 'total': 115.6},
            'changed': {'subtotal': 136, 'discountAmount': 6.8, 'total': 129.2},
            'healthy_source': 'SYNTHETIC_PRIVATE_FINGERPRINT',
            'evidence_id': 'SYNTHETIC_PRIVATE_ID',
        }), encoding='utf-8')
        session = {
            'id': battle_id,
            'created': '2026-11-24T15:14:04+00:00',
            'state': 'not_detected',
            'mode': 'SeatPilot generated suite / scripted Breaker / codex Builder',
            'attempts': 0,
            'events': [],
            'drill': {'outcome': 'escaped', 'independently_validated': 1,
                      'family': 'seatpilot_pricing', 'invariant': 'healthy_vs_changed_quote',
                      'max_attempts': 3},
            'verifications': [
                {'phase': 'baseline', 'attempt': 0, 'result': 'passed',
                 'evidence_id': 'synthetic', 'pack_hash': 'fixture',
                 'test_hash': 'approved-generated-fixture'},
                {'phase': 'before', 'attempt': 0, 'result': 'passed',
                 'evidence_id': 'synthetic', 'pack_hash': 'fixture',
                 'test_hash': 'approved-generated-fixture'},
            ],
        }

        payload = console_payload([session], self.root, battle_id, lambda _: 'Synthetic record',
                                  {'approved-generated-fixture'})
        escape = payload['battles'][0]['escape']
        self.assertEqual(escape['healthyObservation'],
                         {'subtotal': '$136.00', 'discount': '$20.40', 'total': '$115.60'})
        self.assertEqual(escape['changedObservation'],
                         {'subtotal': '$136.00', 'discount': '$6.80', 'total': '$129.20'})
        self.assertIn('no pricing assertion', escape['missed'])
        self.assertIn('human approval', escape['followUp'])
        self.assertEqual(payload['battles'][0]['targetApp'], 'SeatPilot')
        before_check = next(check for check in payload['battles'][0]['verification']['checks']
                            if check['id'] == 'before')
        self.assertIn('generated/seatpilot-attempt-02/', before_check['command'])
        self.assertNotIn('SYNTHETIC_PRIVATE', json.dumps(payload))

    def test_escape_report_requires_qualified_hash_and_marks_missing_values(self):
        session = {
            'id': '20261124T151404-6db82d63',
            'created': '2026-11-24T15:14:04+00:00',
            'mode': 'SeatPilot generated suite / scripted Breaker / codex Builder',
            'state': 'not_detected',
            'attempts': 0,
            'events': [],
            'drill': {'outcome': 'escaped', 'independently_validated': 1,
                      'family': 'seatpilot_pricing', 'invariant': 'healthy_vs_changed_quote',
                      'max_attempts': 3},
            'verifications': [{'phase': 'before', 'attempt': 0, 'result': 'passed',
                               'evidence_id': 'synthetic', 'pack_hash': 'fixture',
                               'test_hash': 'unqualified-fixture'}],
        }
        payload = console_payload([session], self.root, session['id'], lambda _: 'Synthetic record',
                                  {'approved-generated-fixture'})
        self.assertIsNone(payload['battles'][0]['escape'])

        session['verifications'][0]['test_hash'] = 'approved-generated-fixture'
        payload = console_payload([session], self.root, session['id'], lambda _: 'Synthetic record',
                                  {'approved-generated-fixture'})
        escape = payload['battles'][0]['escape']
        self.assertEqual(escape['healthyObservation']['subtotal'], 'Not recorded')
        self.assertEqual(escape['changedObservation']['total'], 'Not recorded')

        session['drill']['independently_validated'] = 0
        payload = console_payload([session], self.root, session['id'], lambda _: 'Synthetic record',
                                  {'approved-generated-fixture'})
        self.assertEqual(payload['battles'][0]['escape']['faultStatus'], 'Not recorded')
        self.assertEqual(payload['battles'][0]['escape']['missed'], 'Not recorded')

    def test_original_shell_features_and_safe_json_injection(self):
        self.seed()
        with closing(sqlite3.connect(self.database)) as db:
            db.execute('UPDATE arena_sessions SET mode=?', ('</script><script>alert(1)</script>',))
            db.commit()
        page = self.client.get('/arena').data
        for control in (b'footer-sound-toggle', b'shortcuts-modal', b'screenshot-modal',
                        b'schema-modal', b'Data format (for developers)'):
            self.assertIn(control, page)
        self.assertIn(b'\\u003c/script\\u003e', page)
        self.assertNotIn(b'</script><script>alert(1)</script>', page)
        bundle = re.search(rb'<script type="module" crossorigin src="([^"]+)"', page)
        self.assertIsNotNone(bundle)
        with self.client.get(bundle.group(1).decode()) as script_response:
            javascript = script_response.get_data()
        for control in (b'export-json-btn', b'Advanced', b'Preview state:', b'Reload recorded data'):
            self.assertIn(control, javascript)
        self.assertNotIn(b'Reload from Jinja payload', javascript)
        self.assertNotIn(b'Jinja / JSON integration contract', page)


if __name__ == '__main__':
    unittest.main()
