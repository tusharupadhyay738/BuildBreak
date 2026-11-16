"""Synthetic local evidence fixtures, never a substitute for a live Kane result."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from buildbreak.battle_runner import ROOT, TEST, snapshot, digest, find_evidence_pack, run_kane


class LocalEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=ROOT / 'instance')
        self.root = Path(self.temp.name).resolve()
        self.workspace = self.root / 'workspace'
        snapshot(ROOT, self.workspace)
        self.sessions = self.root / 'sessions'
        self.session = '11111111-1111-4111-8111-111111111111'
        self.evidence = '22222222-2222-4222-8222-222222222222'
        self.pack = self.sessions / self.session / 'evidence' / (self.evidence + '.evidence')
        self.pack.parent.mkdir(parents=True)
        self.url = 'http://127.0.0.1:1234'

    def tearDown(self):
        self.temp.cleanup()

    def events(self):
        return [
            {'type': 'test_md_summary', 'overall_status': 'passed', 'steps': {'passed': 5, 'total': 5},
             'upload': {'performed': True, 'succeeded': False}},
            {'type': 'coverage', 'status': 'skipped', 'pack': str(self.pack)},
            {'type': 'test_md_done', 'overall_status': 'passed', 'session_id': self.session},
        ]

    def write_pack(self, test_hash=None):
        with zipfile.ZipFile(self.pack, 'w') as archive:
            archive.writestr('run.yaml', f'run_id: {self.evidence}\nenvironment:\n  surfaces:\n    - {self.url}\n')
            archive.writestr('tests/fixture/result.yaml', 'status: passed\ndefinition:\n  sha256: sha256:' +
                             (test_hash or digest(self.workspace / TEST)) + '\n')

    def execute(self, events):
        output = '\n'.join(json.dumps(event) for event in events)
        with patch('buildbreak.battle_runner.KANE_SESSION_ROOT', self.sessions), \
                patch('buildbreak.battle_runner.owned_run', return_value=subprocess.CompletedProcess([], 0, output, '')):
            return run_kane(self.workspace, self.root / 'verification', self.url, 'fixture', 'synthetic-kane')

    def test_local_sealed_pack_works_without_cloud_ingest_and_records_provenance(self):
        self.write_pack()
        result = self.execute(self.events())
        self.assertEqual(result['result'], 'passed')
        self.assertEqual(result['evidence_id'], self.evidence)
        self.assertEqual(result['pack_hash'], digest(self.pack))
        provenance = json.loads((self.root / 'verification/artifact-provenance.json').read_text())
        self.assertEqual(provenance['evidence_source'], 'kane_local_session')
        self.assertFalse(provenance['workspace_ingest_succeeded'])
        self.assertFalse(provenance['cloud_upload_succeeded'])
        self.assertTrue(self.pack.is_file())

    def test_local_pack_still_requires_matching_test_and_final_events(self):
        self.write_pack('wrong-test')
        self.assertEqual(self.execute(self.events())['result'], 'infrastructure_error')

    def test_arbitrary_paths_and_wrong_sessions_are_not_accepted(self):
        self.write_pack()
        events = self.events()
        with patch('buildbreak.battle_runner.KANE_SESSION_ROOT', self.sessions):
            events[-1]['session_id'] = '33333333-3333-4333-8333-333333333333'
            self.assertEqual(find_evidence_pack(events, self.workspace), (None, None, None))
            events[-1]['session_id'] = self.session
            events[-2]['pack'] = str(self.root / (self.evidence + '.evidence'))
            self.assertEqual(find_evidence_pack(events, self.workspace), (None, None, None))

    def test_incomplete_stream_never_becomes_a_pass(self):
        self.write_pack()
        self.assertEqual(self.execute(self.events()[:-1])['result'], 'infrastructure_error')


if __name__ == '__main__':
    unittest.main()
