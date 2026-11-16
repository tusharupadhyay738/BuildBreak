"""Offline integration checks for launch commands and isolated package boundaries."""
from pathlib import Path
import sys
import tempfile
import unittest

from buildbreak.battle_runner import ROOT, TEST, digest, snapshot
from buildbreak.process_control import run


class RepositoryLayoutTests(unittest.TestCase):
    def test_documented_cli_help_works_without_api_credentials(self):
        for arguments, flag in [(['battle_runner.py', '--help'], '--breaker'),
                                (['-m', 'buildbreak.cache_faults', '--help'], '--count'),
                                (['-m', 'buildbreak.gemini_breaker', '--help'], '--diagnose'),
                                (['-m', 'buildbreak.import_battle', '--help'], '--sources')]:
            with self.subTest(arguments=arguments):
                result = run([sys.executable, *arguments], cwd=ROOT, timeout=30, environment='app')
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn(flag, result.stdout)

    def test_nested_snapshot_preserves_bindings_without_copying_agent_code(self):
        with tempfile.TemporaryDirectory(dir=ROOT / 'instance') as directory:
            first = Path(directory) / 'first'
            second = Path(directory) / 'second'
            manifest = snapshot(ROOT, first)
            again = snapshot(first, second)
            for name in ('app.py', 'test_app.py', TEST.as_posix()):
                self.assertEqual(manifest[name], again[name])
            self.assertEqual(manifest['test_app.py'], digest(ROOT / 'tests/test_app.py'))
            self.assertTrue((second / 'buildbreak/arena.py').is_file())
            for name in ('battle_runner.py', 'gemini_breaker.py', 'fault_validator.py'):
                self.assertFalse((second / 'buildbreak' / name).exists())
            self.assertFalse((second / 'tests').exists())
