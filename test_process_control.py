"""Local safeguards: fixture credentials below are not real secrets."""
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from battle_runner import ROOT, RejectedRepair, validate_repair
from process_control import child_environment, run


class ChildEnvironmentTests(unittest.TestCase):
    def test_app_allowlist_excludes_other_credentials_and_python_hooks(self):
        with tempfile.TemporaryDirectory(dir='.') as directory, patch.dict(os.environ, {
                'GEMINI_API_KEY': 'fixture', 'GOOGLE_API_KEY': 'fixture',
                'AWS_SECRET_ACCESS_KEY': 'fixture', 'OPENAI_API_KEY': 'fixture',
                'CUSTOM_SECRET': 'fixture', 'PYTHONPATH': 'untrusted',
                'FLASK_SECRET_KEY': 'fixture'}):
            environment = child_environment('app', directory)
            for name in ('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'AWS_SECRET_ACCESS_KEY',
                         'OPENAI_API_KEY', 'CUSTOM_SECRET', 'PYTHONPATH', 'FLASK_SECRET_KEY'):
                self.assertNotIn(name, environment)
            self.assertTrue(Path(environment['TEMP']).is_relative_to(Path(directory).resolve()))
            self.assertEqual(environment['PYTHONNOUSERSITE'], '1')

    def test_real_test_subprocess_uses_allowlist_but_cli_keeps_auth_setup(self):
        with tempfile.TemporaryDirectory(dir='.') as directory, patch.dict(os.environ, {
                'ARENA_TEST_SECRET': 'fixture', 'GEMINI_API_KEY': 'fixture',
                'GOOGLE_API_KEY': 'fixture', 'OPENAI_API_KEY': 'fixture'}):
            result = run([sys.executable, '-c',
                          'import os,json; print(json.dumps({k: k in os.environ for k in '
                          '["ARENA_TEST_SECRET","GEMINI_API_KEY","GOOGLE_API_KEY"]}))'],
                         cwd=directory, environment='app')
            self.assertEqual(result.returncode, 0)
            self.assertEqual(json.loads(result.stdout), {
                'ARENA_TEST_SECRET': False, 'GEMINI_API_KEY': False, 'GOOGLE_API_KEY': False})
            cli = child_environment('cli')
            self.assertIn('OPENAI_API_KEY', cli)
            self.assertNotIn('GEMINI_API_KEY', cli)
            self.assertNotIn('GOOGLE_API_KEY', cli)


class RepairGuardTests(unittest.TestCase):
    def setUp(self):
        self.source = (ROOT / 'app.py').read_text(encoding='utf-8')

    def test_existing_operations_and_legitimate_pricing_repair_remain_valid(self):
        broken = self.source.replace('Decimal("0.10")', 'Decimal("0.05")')
        self.assertEqual(validate_repair({'app_source': self.source}, broken), self.source)

    def test_added_sensitive_imports_rejected_including_aliases(self):
        for statement in ('import os as system', 'import subprocess', 'import socket',
                          'import urllib.request', 'import requests', 'from os import system as go'):
            with self.subTest(statement=statement), self.assertRaises(RejectedRepair):
                validate_repair({'app_source': self.source + '\n' + statement}, self.source)

    def test_new_or_modified_sensitive_calls_rejected(self):
        for expression in ('os.getcwd()', 'eval("1")', 'exec("x=1")', '__import__("socket")',
                           'getattr(os, "system")("fixture")', 'object.eval("1")'):
            with self.subTest(expression=expression), self.assertRaises(RejectedRepair):
                validate_repair({'app_source': self.source + '\n' + expression}, self.source)
        modified = self.source.replace('os.environ.get("SECRET_KEY")', 'os.environ.get("OTHER_KEY")')
        self.assertNotEqual(modified, self.source)
        with self.assertRaises(RejectedRepair):
            validate_repair({'app_source': modified}, self.source)
