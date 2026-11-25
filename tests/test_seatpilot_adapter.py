"""Adapter tests use the real local API but no live Kane/Gemini/Codex calls."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from buildbreak import seatpilot_adapter as adapter
from buildbreak.battle_runner import Server, ROOT, run_kane
from buildbreak.fault_validator import InvalidFault
from buildbreak.project_import import inspect_project


class SeatPilotAdapterTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=ROOT/'instance')
        self.root=Path(self.temp.name)
        self.source=self.root/'source'
        adapter.prepare_runtime(self.source)
        (self.source/'site').mkdir()
        (self.source/'site/index.html').write_text('<title>SeatPilot synthetic boot fixture</title>')
        self.workspace=self.root/'workspace'
        self.manifest=adapter.snapshot(self.source,self.workspace)
        self.proposal=dict(file='app.py',old_text="Decimal('0.15')",new_text="Decimal('0.05')",description='Offline controlled pricing fixture')

    def tearDown(self):
        self.temp.cleanup()

    def test_new_suite_has_its_own_lock_and_old_suite_is_unchanged(self):
        self.assertEqual(adapter.sha(ROOT/adapter.TEST),(adapter.EXAMPLE/'acceptance.sha256').read_text().strip())
        self.assertEqual(adapter.sha(ROOT/'.testmuai/tests/CheckoutConsistency_test.md'),
                         'cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7')

    def test_healthy_direct_invariant_and_valid_mutation(self):
        observation=adapter.direct_check(self.workspace,self.root/'healthy',sys.executable)
        self.assertTrue(observation['passed'])
        self.assertEqual(observation['actual']['saved'],[13600,2040,11560])
        candidate=adapter.validate_fault(self.workspace,self.root/'broken',sys.executable,self.manifest,self.proposal,Server)
        self.assertIn("Decimal('0.05')",candidate)
        self.assertIn("Decimal('0.15')",(self.workspace/'app.py').read_text())

    def test_out_of_family_security_and_test_edits_are_rejected(self):
        changes=[dict(file='../app.py'),dict(file='.testmuai/tests/SeatPilotBooking_test.md'),
                 dict(old_text='quantity < 1',new_text='quantity < 0'),
                 dict(old_text="Decimal('0.15')",new_text="__import__('os').system('bad')"),
                 dict(old_text="Decimal('0.15')",new_text="Decimal('1e999')")]
        for change in changes:
            with self.subTest(change=change),self.assertRaises(InvalidFault):
                adapter.mutation(self.workspace,dict(self.proposal,**change))

    def test_no_effect_and_changed_acceptance_file_fail_closed(self):
        (self.workspace/adapter.TEST).write_text('weakened offline fixture')
        with self.assertRaises(InvalidFault):
            adapter.validate_fault(self.workspace,self.root/'tampered',sys.executable,self.manifest,self.proposal,Server)
        with self.assertRaises(InvalidFault):
            adapter.mutation(self.workspace,dict(self.proposal,new_text=self.proposal['old_text']))

    def test_export_recognition_is_explicit_and_not_generic_react_support(self):
        frontend=adapter.EXAMPLE/'frontend'
        self.assertTrue(adapter.matches_export(frontend))
        self.assertEqual(inspect_project(frontend,ROOT)['adapter'],'seatpilot')
        unknown=self.root/'unknown'
        unknown.mkdir()
        (unknown/'package.json').write_text(json.dumps({'dependencies':{'react':'*'}}))
        self.assertFalse(inspect_project(unknown,ROOT)['compatible'])

    def test_only_integration_and_session_label_changed_design_sources(self):
        original=json.loads((adapter.EXAMPLE/'original-source-sha256.json').read_text())
        changed=[name for name,expected in original.items() if adapter.export_sha(adapter.EXAMPLE/'frontend'/name)!=expected]
        self.assertEqual(changed,['src/api/seatpilotClient.ts','src/components/BookingLookupBar.tsx'])
        client=(adapter.EXAMPLE/'frontend/src/api/seatpilotClient.ts').read_text()
        implementation=client.split('async function requestWithDemoFallback',1)[1].split('export const seatpilotClient',1)[0]
        self.assertNotIn('await demoFallback',implementation)
        self.assertIn('BACKEND_UNAVAILABLE',implementation)

    def test_export_recognition_accepts_lf_and_crlf_but_rejects_changed_content(self):
        manifest=json.loads((adapter.EXAMPLE/'adapted-source-sha256.json').read_text())
        for ending in (b'\n', b'\r\n'):
            with self.subTest(ending=ending):
                target=self.root/('lf' if ending==b'\n' else 'crlf')
                for name in manifest:
                    source=adapter.EXAMPLE/'frontend'/name
                    data=source.read_bytes()
                    if source.suffix in {'.ts','.tsx','.css','.html','.json'}:
                        data=data.replace(b'\r\n',b'\n').replace(b'\n',ending)
                    dest=target/name
                    dest.parent.mkdir(parents=True,exist_ok=True)
                    dest.write_bytes(data)
                self.assertTrue(adapter.matches_export(target))
                changed=target/'src/App.tsx'
                changed.write_bytes(changed.read_bytes()+b'// unreviewed change')
                self.assertFalse(adapter.matches_export(target))

    def test_export_normalization_does_not_change_binary_or_protected_hashes(self):
        import hashlib
        binary=self.root/'fixture.jpg'
        binary.write_bytes(b'\x00\r\n\xff')
        self.assertEqual(adapter.export_sha(binary),hashlib.sha256(binary.read_bytes()).hexdigest())
        text=self.root/'fixture.ts'
        text.write_bytes(b'first\r\nsecond\r\n')
        self.assertNotEqual(adapter.export_sha(text),adapter.sha(text))

    def test_kane_runner_uses_seatpilot_suite_without_accepting_arbitrary_files(self):
        events='\n'.join(json.dumps(e) for e in [dict(type='test_md_summary',overall_status='passed',steps=dict(total=5,passed=5)),dict(type='test_md_done',overall_status='passed')])
        with patch('buildbreak.battle_runner.owned_run',return_value=subprocess.CompletedProcess([],0,events,None)) as run, \
             patch('buildbreak.battle_runner.find_evidence_pack',return_value=(None,None,None)):
            result=run_kane(self.workspace,self.root/'run','http://127.0.0.1:1234','fixture','fixture-cli',test_path=adapter.TEST)
        self.assertIn(str(adapter.TEST),run.call_args.args[0])
        self.assertEqual(result['result'],'infrastructure_error')  # A synthetic summary has no sealed evidence.
        with self.assertRaises(ValueError):
            run_kane(self.workspace,self.root/'bad','http://127.0.0.1:1234','fixture','fixture-cli',test_path=Path('arbitrary.md'))
