"""Local mutation validation; no API, Kane credits or Codex sessions used."""
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from battle_runner import ROOT, TEST, FAULTS, Server, snapshot, digest
from fault_validator import InvalidFault, patch_source, validate_fault, direct_check, protected
from process_control import run


def proposal(fault='order-total'):
    old, new = FAULTS[fault]
    return {'file': 'app.py', 'old_text': old, 'new_text': new, 'description': 'Local mutation test fixture'}


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        (ROOT / 'instance').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=ROOT / 'instance')
        self.artifacts = Path(self.temp.name).resolve()
        self.workspace = self.artifacts / 'baseline'
        self.manifest = snapshot(ROOT, self.workspace)

    def tearDown(self):
        self.temp.cleanup()

    def test_only_exact_app_path_and_exact_schema_are_allowed(self):
        for name in ('../app.py', '/app.py', 'C:/app.py', 'templates/shop.html', 'test_app.py',
                     TEST.as_posix(), 'battle_runner.py', 'app.py/../app.py'):
            with self.subTest(name=name), self.assertRaises(InvalidFault):
                patch_source(self.workspace, {**proposal(), 'file': name})
        for candidate in (None, {}, {**proposal(), 'extra': 'field'}, {**proposal(), 'description': 1}):
            with self.assertRaises(InvalidFault):
                patch_source(self.workspace, candidate)

    def test_nonunique_noop_and_large_replacements_are_rejected(self):
        for candidate in ({**proposal(), 'old_text': 'return'},
                          {**proposal(), 'old_text': 'missing'},
                          {**proposal(), 'new_text': proposal()['old_text']},
                          {**proposal(), 'new_text': 'x' * 501},
                          {**proposal(), 'old_text': ' '},
                          {**proposal(), 'new_text': '\n'.join(['x'] * 7)}):
            with self.assertRaises(InvalidFault):
                patch_source(self.workspace, candidate)

    def test_structural_guard_rejects_code_execution_routes_and_security_changes(self):
        attacks = [
            ('Decimal("0.10")', '__import__("os").system("echo no")'),
            ('if not token or token != session.get("checkout_token"):', 'if False:'),
            ('@app.post("/checkout")', '@app.post("/changed")'),
            ('import secrets', 'import subprocess'),
            ('Decimal("0.10")', 'Decimal("NaN")'),
            ('Decimal("0.10")', '('),
            ('Decimal("0.10")', 'Decimal("1e999999")'),
        ]
        for old, new in attacks:
            with self.subTest(old=old, new=new), self.assertRaises(InvalidFault):
                patch_source(self.workspace, dict(file='app.py', old_text=old,
                                                 new_text=new, description='rejected fixture'))

    def test_direct_check_uses_saved_facts_and_fresh_databases(self):
        healthy = direct_check(self.workspace, self.artifacts / 'healthy', sys.executable)
        self.assertTrue(healthy['passed'])
        self.assertEqual(healthy['actual_cents'], [4497, 450, 4047])
        (self.workspace / 'app.py').write_text(patch_source(self.workspace, proposal()), encoding='utf-8')
        broken = direct_check(self.workspace, self.artifacts / 'broken', sys.executable)
        self.assertFalse(broken['passed'])
        self.assertEqual(broken['actual_cents'], [4497, 450, 4497])
        self.assertTrue((self.artifacts / 'healthy/direct.sqlite3').is_file())
        self.assertTrue((self.artifacts / 'broken/direct.sqlite3').is_file())

    def test_valid_faults_boot_fail_some_tests_and_preserve_baseline(self):
        for index, fault in enumerate(FAULTS):
            candidate = validate_fault(self.workspace, self.artifacts / str(index), sys.executable,
                                       self.manifest, proposal(fault), Server)
            self.assertNotEqual(candidate, (self.workspace / 'app.py').read_text(encoding='utf-8'))
            summary = json.loads((self.artifacts / str(index) / 'validation.json').read_text())
            self.assertGreater(summary['tests']['failures'], 0)
            self.assertEqual(summary['tests']['errors'], 0)
            self.assertFalse(summary['direct']['passed'])
        protected(self.workspace, self.manifest)
        self.assertEqual(digest(self.workspace / TEST), self.manifest[TEST.as_posix()])

    def test_rejects_crashes_all_failures_and_no_assertion_failures(self):
        for counts in (
            dict(run=8, failures=8, errors=0, skipped=0, expected_failures=0, unexpected_successes=0),
            dict(run=8, failures=1, errors=1, skipped=0, expected_failures=0, unexpected_successes=0),
            dict(run=8, failures=0, errors=0, skipped=0, expected_failures=0, unexpected_successes=0),
        ):
            folder = self.artifacts / ('counts-' + str(counts['failures']) + '-' + str(counts['errors']))
            with patch('fault_validator.json_command', return_value=counts), \
                    patch.object(Server, 'start'), patch.object(Server, 'stop'):
                with self.assertRaises(InvalidFault):
                    validate_fault(self.workspace, folder, sys.executable, self.manifest, proposal(), Server)

    def test_rejects_unproven_fault_and_modified_acceptance_test(self):
        counts = dict(run=8, failures=1, errors=0, skipped=0, expected_failures=0, unexpected_successes=0)
        with patch('fault_validator.json_command', return_value=counts), \
                patch('fault_validator.direct_check', return_value={'passed': True}), \
                patch.object(Server, 'start'), patch.object(Server, 'stop'):
            with self.assertRaisesRegex(InvalidFault, 'unproven'):
                validate_fault(self.workspace, self.artifacts / 'unproven', sys.executable,
                               self.manifest, proposal(), Server)
        (self.workspace / TEST).write_text('weakened', encoding='utf-8')
        with self.assertRaisesRegex(InvalidFault, 'hash'):
            validate_fault(self.workspace, self.artifacts / 'tampered', sys.executable,
                           self.manifest, proposal(), Server)

    def test_keys_are_absent_from_actual_app_test_subprocess(self):
        with patch.dict(os.environ, {'GEMINI_API_KEY': 'placeholder', 'GOOGLE_API_KEY': 'placeholder'}):
            result = run([sys.executable, '-c',
                          'import os; print("GEMINI_API_KEY" in os.environ or "GOOGLE_API_KEY" in os.environ)'],
                         self.workspace)
        self.assertEqual(result.stdout.strip(), 'False')


if __name__ == '__main__':
    unittest.main()
