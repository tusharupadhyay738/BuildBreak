"""Synthetic cache and replay fixtures. No live Gemini, Kane or Codex calls."""
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import buildbreak.battle_runner as runner
from buildbreak.cache_faults import cache_faults
from buildbreak.fault_cache import identity, load_fault, store_fault
from buildbreak.fault_validator import InvalidFault
from tests.test_fault_validator import proposal


class FaultCacheTests(unittest.TestCase):
    def setUp(self):
        (runner.ROOT / 'instance').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=runner.ROOT / 'instance')
        self.root = Path(self.temp.name).resolve()
        self.workspace = self.root / 'project'
        self.manifest = runner.snapshot(runner.ROOT, self.workspace)

    def tearDown(self):
        self.temp.cleanup()

    def cached(self):
        return store_fault(self.root, self.manifest, proposal(), 'gemini-fixture')

    def test_cache_identity_deduplicates_and_contains_only_patch_provenance(self):
        path = self.cached()
        self.assertEqual(path, self.cached())
        self.assertEqual(len(list(path.parent.glob('*.json'))), 1)
        record = load_fault(path, self.workspace, self.manifest)
        self.assertEqual(record['id'], path.stem)
        self.assertEqual(record['patch'], proposal())
        self.assertNotIn('app_source', record)
        self.assertEqual(record['producer'], 'gemini')

    def test_modified_cache_and_source_or_test_bindings_are_rejected(self):
        path = self.cached()
        record = json.loads(path.read_text(encoding='utf-8'))
        record['patch']['description'] = 'tampered fixture'
        path.write_text(json.dumps(record), encoding='utf-8')
        with self.assertRaisesRegex(InvalidFault, 'altered'):
            load_fault(path, self.workspace, self.manifest)
        record['id'] = identity(record)
        path.write_text(json.dumps(record), encoding='utf-8')
        for name in ('app.py', 'test_app.py', runner.TEST.as_posix()):
            with self.subTest(name=name), self.assertRaisesRegex(InvalidFault, 'differ'):
                load_fault(path, self.workspace, {**self.manifest, name: 'changed'})

    def test_recomputed_identity_does_not_bypass_path_or_code_validation(self):
        path = self.cached()
        record = json.loads(path.read_text(encoding='utf-8'))
        record['patch']['file'] = '../app.py'
        record['id'] = identity(record)
        path.write_text(json.dumps(record), encoding='utf-8')
        with self.assertRaises(InvalidFault):
            load_fault(path, self.workspace, self.manifest)

    def test_replay_revalidates_and_repairs_without_gemini_configuration_or_calls(self):
        path = self.cached()
        original = (self.workspace / 'app.py').read_text(encoding='utf-8')
        def verdict(status):
            return dict(result=status, evidence_id='synthetic', pack_hash='fixture',
                        test_hash=self.manifest[runner.TEST.as_posix()], duration=0, failure='Synthetic failure')
        def builder(codex, workspace, artifacts, failure, previous_test_failure=''):
            artifacts.mkdir()
            return {'app_source': original, 'explanation': 'synthetic repair'}
        with patch('buildbreak.battle_runner.executable', return_value=sys.executable), \
                patch('buildbreak.battle_runner.command', return_value=SimpleNamespace(returncode=0, stdout='fixture', stderr='')), \
                patch('buildbreak.battle_runner.gemini_configuration', side_effect=AssertionError('Must not need key')), \
                patch('buildbreak.battle_runner.propose_fault', side_effect=AssertionError('Must not call API')), \
                patch('buildbreak.battle_runner.run_kane', side_effect=[verdict('passed'), verdict('verification_failed'), verdict('passed')]), \
                patch('buildbreak.battle_runner.builder_patch', side_effect=builder):
            battle = runner.run_battle(self.workspace, breaker='cached', cached_fault=path, builder='codex')
        with runner.connect(self.workspace / 'instance/arena.sqlite3') as db:
            self.assertEqual(db.execute('SELECT state FROM arena_sessions WHERE id=?', (battle,)).fetchone()[0], 'completed')
            detail = db.execute('SELECT producer,source,cache_id,independently_validated,outcome FROM arena_drill_details WHERE battle_id=?', (battle,)).fetchone()
        self.assertEqual(detail, ('gemini', 'cached', path.stem, 1, 'caught_and_repaired'))
        self.assertEqual((self.workspace / 'app.py').read_text(encoding='utf-8'), original)
        private = self.workspace / 'instance/battles' / battle
        self.assertTrue((private / 'fault-validation-cached/validation.json').exists())
        self.assertTrue((private / 'repair-direct-1/result.json').exists())

    def test_invalid_cache_stops_before_kane(self):
        path = self.cached()
        record = json.loads(path.read_text())
        record['bindings']['app.py'] = 'wrong'
        record['id'] = identity(record)
        path.write_text(json.dumps(record))
        with patch('buildbreak.battle_runner.executable', return_value=sys.executable), patch('buildbreak.battle_runner.run_kane') as kane:
            with self.assertRaises(InvalidFault):
                runner.run_battle(self.workspace, breaker='cached', cached_fault=path)
        kane.assert_not_called()

    def test_cache_generator_keeps_only_validated_proposals_and_deduplicates(self):
        invalid = {**proposal(), 'file': 'test_app.py'}
        with patch('buildbreak.cache_faults.configuration', return_value=('fixture', 'gemini-fixture')), \
                patch('buildbreak.cache_faults.propose_fault', side_effect=[proposal(), invalid, proposal()]) as provider, \
                patch('buildbreak.cache_faults.time', new=SimpleNamespace(sleep=lambda seconds: None)):
            results = cache_faults(self.workspace, sys.executable, count=3)
        self.assertEqual(provider.call_count, 3)
        self.assertEqual([row['accepted'] for row in results], [True, False, True])
        self.assertEqual(len(list((self.workspace / 'instance/fault-cache').glob('*.json'))), 1)

    def test_imported_battle_proposal_is_revalidated_without_api(self):
        battle = '20261114T000000-00000000'
        folder = self.workspace / 'instance/battles' / battle
        folder.mkdir(parents=True)
        (folder / 'fault.json').write_text(json.dumps({'producer': 'gemini', 'fallback': False,
                                                      'model': 'gemini-fixture', 'patch': proposal()}))
        (folder / 'baseline-manifest.json').write_text(json.dumps(self.manifest))
        with patch('buildbreak.cache_faults.configuration', side_effect=AssertionError('No key needed')), \
                patch('buildbreak.cache_faults.propose_fault', side_effect=AssertionError('No API call')):
            results = cache_faults(self.workspace, sys.executable, from_battle=battle)
        self.assertTrue(results[0]['accepted'])
        path = self.workspace / 'instance/fault-cache' / (results[0]['cache_id'] + '.json')
        record = load_fault(path, self.workspace, self.manifest)
        self.assertEqual(record['origin_battle'], battle)


if __name__ == '__main__':
    unittest.main()
