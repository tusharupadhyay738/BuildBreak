"""Real local probes plus synthetic orchestration; no live model/browser calls."""
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import buildbreak.battle_runner as runner
from app import create_app
from buildbreak.fault_cache import load_fault, store_fault
from buildbreak.fault_validator import (InvalidFault, direct_check, fault_family, patch_source,
                             protected, validate_fault)


def quantity_proposal(cap=100):
    return dict(file='app.py', old_text='0 <= quantity <= 99',
                new_text=f'0 <= quantity <= {cap}', description='Synthetic quantity boundary fixture')


class QuantityFaultTests(unittest.TestCase):
    def setUp(self):
        (runner.ROOT / 'instance').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=runner.ROOT / 'instance')
        self.root = Path(self.temp.name).resolve()
        self.workspace = self.root / 'baseline'
        self.manifest = runner.snapshot(runner.ROOT, self.workspace)

    def tearDown(self):
        self.temp.cleanup()

    def test_valid_quantity_fault_has_own_invariant_while_pricing_still_passes(self):
        source = validate_fault(self.workspace, self.root / 'validation', sys.executable,
                                self.manifest, quantity_proposal(), runner.Server)
        report = json.loads((self.root / 'validation/validation.json').read_text())
        self.assertEqual((report['family'], report['invariant']), ('cart_quantity', 'quantity_0_99'))
        self.assertEqual((report['tests']['run'], report['tests']['failures'], report['tests']['errors']), (8, 1, 0))
        self.assertFalse(report['direct']['passed'])
        self.assertEqual(report['direct']['actual']['reject_100']['cart'], {'1': 100})
        self.assertTrue(json.loads((self.root / 'validation/healthy-quantity/result.json').read_text())['passed'])
        copy = self.root / 'validation/workspace'
        self.assertTrue(direct_check(copy, self.root / 'pricing', sys.executable)['passed'])
        self.assertIn('0 <= quantity <= 100', source)
        protected(self.workspace, self.manifest)

    def test_out_of_family_quantity_edits_are_rejected(self):
        for replacement in ('0 <= quantity <= 101', '-1 <= quantity <= 100',
                            '0 < quantity <= 100', '0 <= quantity <= float("inf")'):
            with self.subTest(replacement=replacement), self.assertRaises(InvalidFault):
                patch_source(self.workspace, {**quantity_proposal(), 'new_text': replacement})
        for old, new in [('"price": 1999', '"price": 1998'),
                         ('if existing:', 'if False:'),
                         ('0 <= quantity <= 99:\n            abort(400)',
                          '0 <= quantity <= 100:\n            abort(403)')]:
            with self.subTest(old=old), self.assertRaises(InvalidFault):
                patch_source(self.workspace, dict(file='app.py', old_text=old, new_text=new, description='fixture'))

    def test_healthy_quantity_failure_and_all_passing_tests_reject_candidate(self):
        with patch('buildbreak.fault_validator.direct_check', return_value={'passed': False}), \
                patch.object(runner.Server, 'start') as boot:
            with self.assertRaisesRegex(InvalidFault, 'Healthy cart'):
                validate_fault(self.workspace, self.root / 'bad-healthy', sys.executable,
                               self.manifest, quantity_proposal(), runner.Server)
            boot.assert_not_called()
        # 98 changes the boundary but fails no existing app assertion: reject it.
        with self.assertRaisesRegex(InvalidFault, 'assertion failures'):
            validate_fault(self.workspace, self.root / 'no-unit-failure', sys.executable,
                           self.manifest, quantity_proposal(98), runner.Server)

    def test_cache_version_one_round_trips_quantity_patch_without_api(self):
        path = store_fault(self.root, self.manifest, quantity_proposal(), 'gemini-fixture')
        record = load_fault(path, self.workspace, self.manifest)
        self.assertEqual(record['version'], 1)
        self.assertEqual(fault_family(self.workspace, record['patch']), 'cart_quantity')

    def test_quantity_candidate_rejects_test_errors_and_boot_failure(self):
        counts = dict(run=8, failures=1, errors=1, skipped=0, expected_failures=0, unexpected_successes=0)
        with patch('buildbreak.fault_validator.direct_check', return_value={'passed': True}), \
                patch('buildbreak.fault_validator.json_command', return_value=counts), \
                patch.object(runner.Server, 'start'), patch.object(runner.Server, 'stop'):
            with self.assertRaisesRegex(InvalidFault, 'without test errors'):
                validate_fault(self.workspace, self.root / 'test-error', sys.executable,
                               self.manifest, quantity_proposal(), runner.Server)
        with patch('buildbreak.fault_validator.direct_check', return_value={'passed': True}), \
                patch.object(runner.Server, 'start', side_effect=RuntimeError('fixture boot error')), \
                patch.object(runner.Server, 'stop'):
            with self.assertRaisesRegex(InvalidFault, 'boot check'):
                validate_fault(self.workspace, self.root / 'boot-error', sys.executable,
                               self.manifest, quantity_proposal(), runner.Server)

    def test_mocked_caught_quantity_fault_repairs_with_selected_direct_check(self):
        source = (self.workspace / 'app.py').read_text(encoding='utf-8')
        candidate = patch_source(self.workspace, quantity_proposal())
        selection = dict(producer='gemini', fallback=False, patch=quantity_proposal())
        counts = dict(run=8, failures=0, errors=0, skipped=0, expected_failures=0, unexpected_successes=0)
        def verdict(status):
            return dict(result=status, evidence_id='synthetic', pack_hash='fixture',
                        test_hash=self.manifest[runner.TEST.as_posix()], duration=0,
                        failure='Synthetic Kane boundary assertion failure')
        def reply(codex, context, artifacts, prompt, schema):
            self.assertEqual([p.name for p in context.iterdir()], ['app.py'])
            self.assertEqual((context / 'app.py').read_text(encoding='utf-8'), candidate)
            self.assertIn('Synthetic Kane boundary assertion failure', prompt)
            self.assertNotIn(quantity_proposal()['description'], prompt)
            artifacts.mkdir()
            return dict(app_source=source, explanation='fixture')
        with patch('buildbreak.battle_runner.gemini_configuration'), \
                patch('buildbreak.battle_runner.executable', return_value=sys.executable), \
                patch('buildbreak.battle_runner.command', return_value=SimpleNamespace(stdout='fixture', stderr='', returncode=0)), \
                patch('buildbreak.battle_runner.Server'), patch('buildbreak.battle_runner.json_command', return_value=counts), \
                patch('buildbreak.battle_runner.direct_check', return_value={'passed': True}) as direct, \
                patch('buildbreak.battle_runner.select_gemini_fault', return_value=(selection, candidate)), \
                patch('buildbreak.battle_runner.run_kane', side_effect=[verdict('passed'), verdict('verification_failed'), verdict('passed')]), \
                patch('buildbreak.battle_runner.codex_json', side_effect=reply):
            battle = runner.run_battle(self.workspace, breaker='gemini', builder='codex')
        self.assertEqual(direct.call_args.kwargs['family'], 'cart_quantity')
        with runner.connect(self.workspace / 'instance/arena.sqlite3') as db:
            self.assertEqual(db.execute('SELECT outcome FROM arena_drill_details WHERE battle_id=?', (battle,)).fetchone()[0], 'caught_and_repaired')

    def test_mocked_escape_and_infrastructure_do_not_repair_and_record_family(self):
        original = (self.workspace / 'app.py').read_text(encoding='utf-8')
        candidate = patch_source(self.workspace, quantity_proposal())
        counts = dict(run=8, failures=0, errors=0, skipped=0, expected_failures=0, unexpected_successes=0)
        selection = dict(producer='gemini', fallback=False, patch=quantity_proposal(), model='gemini-fixture')
        def verdict(status):
            return dict(result=status, evidence_id='synthetic', pack_hash='fixture',
                        test_hash=self.manifest[runner.TEST.as_posix()], duration=0, failure='fixture')
        for status, outcome in [('passed', 'escaped'), ('infrastructure_error', None)]:
            with self.subTest(status=status), \
                    patch('buildbreak.battle_runner.gemini_configuration'), \
                    patch('buildbreak.battle_runner.executable', return_value=sys.executable), \
                    patch('buildbreak.battle_runner.command', return_value=SimpleNamespace(stdout='fixture', stderr='', returncode=0)), \
                    patch('buildbreak.battle_runner.Server'), \
                    patch('buildbreak.battle_runner.json_command', return_value=counts), \
                    patch('buildbreak.battle_runner.direct_check', return_value={'passed': True}), \
                    patch('buildbreak.battle_runner.select_gemini_fault', return_value=(selection.copy(), candidate)), \
                    patch('buildbreak.battle_runner.run_kane', side_effect=[verdict('passed'), verdict(status)]), \
                    patch('buildbreak.battle_runner.builder_patch') as builder:
                battle = runner.run_battle(self.workspace, breaker='gemini', builder='codex')
                builder.assert_not_called()
            with runner.connect(self.workspace / 'instance/arena.sqlite3') as db:
                row = db.execute('SELECT family,invariant,outcome FROM arena_drill_details WHERE battle_id=?', (battle,)).fetchone()
            self.assertEqual(row, ('cart_quantity', 'quantity_0_99', outcome))
            self.assertEqual((self.workspace / 'app.py').read_text(encoding='utf-8'), original)
        app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'),
                          'ARENA_DATABASE': str(self.workspace / 'instance/arena.sqlite3')})
        page = app.test_client().get('/arena/live').data
        self.assertIn(b'Cart quantity boundary', page)
        self.assertNotIn(b'confirmed wrong persisted amounts', page)
