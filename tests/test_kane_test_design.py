"""Offline contract tests for the unlaunched Kane design path."""
import hashlib
from pathlib import Path
import tempfile
import unittest
from types import SimpleNamespace

from buildbreak.kane_test_design import DesignError, design_local_test, validate_generated_test
from buildbreak.site_contract import read_site


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'examples/local-contract-museum'


class KaneDesignTests(unittest.TestCase):
    def test_uses_documented_commands_and_discovers_saved_test(self):
        calls = []
        content = (b'# Museum test\n\n## Step 1\nOpen {{start_url}}.\n\n'
                   b'## Step 2\nClick show-entry-price and assert entry-price '
                   b'equals exactly $18.00.\n')

        def invoke(args, cwd):
            calls.append(args[1:])
            if args[1:3] == ['context', 'list']:
                return SimpleNamespace(returncode=0, stdout='{"id":"uc-7","label":"usecase"}\n')
            if args[1:3] == ['design', 'tests']:
                target = cwd / '.testmuai' / 'tests' / 'museum_test.md'
                target.parent.mkdir(parents=True)
                target.write_bytes(content)
            return SimpleNamespace(returncode=0, stdout='')

        with tempfile.TemporaryDirectory() as temp:
            workspace = Path(temp) / 'design'
            result = design_local_test(SOURCE, workspace, 'kane-cli.cmd', invoke)
            self.assertEqual(result['use_case'], 'uc-7')
            self.assertEqual(result['test_sha256'], hashlib.sha256(content).hexdigest())
            self.assertEqual(result['test_path'].read_bytes(), content)
            self.assertIn('$18.00', (workspace / 'requirements.md').read_text())
        self.assertEqual(calls, [
            ['context', 'ingest', '--mode', 'ci', '--local', 'requirements.md'],
            ['context', 'extract', '--mode', 'override', '--json'],
            ['context', 'list', '--type', 'usecase', '--undesigned', '--json'],
            ['design', 'tests', '--use-case', 'uc-7', '--allow-unreviewed',
             '--mode', 'override', '--max', '1', '--json'],
        ])

    def test_ambiguous_use_cases_stop_before_design(self):
        calls = []

        def invoke(args, cwd):
            calls.append(args[1:])
            value = ('{"id":"uc-1","label":"usecase"}\n'
                     '{"id":"uc-2","label":"usecase"}\n') if args[1:3] == ['context', 'list'] else ''
            return SimpleNamespace(returncode=0, stdout=value)

        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(DesignError, 'exactly one'):
                design_local_test(SOURCE, Path(temp) / 'design', 'kane-cli.cmd', invoke)
        self.assertFalse(any(call[:2] == ['design', 'tests'] for call in calls))

    def test_design_without_saved_test_fails(self):
        def invoke(args, cwd):
            value = '{"id":"uc-1","label":"usecase"}\n' if args[1:3] == ['context', 'list'] else ''
            return SimpleNamespace(returncode=0, stdout=value)

        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(DesignError, 'exactly one new test'):
                design_local_test(SOURCE, Path(temp) / 'design', 'kane-cli.cmd', invoke)

    def test_rejects_optional_click_from_live_generated_test(self):
        site = read_site(SOURCE)
        content = (b'## Step 1\nOpen {{start_url}}.\n\n## Step 2\n'
                   b'Activate show-entry-price if present, then assert '
                   b'entry-price equals $18.00.\n')
        with self.assertRaisesRegex(DesignError, 'optional'):
            validate_generated_test(site, content)

    def test_rejects_missing_exact_result_assertion(self):
        site = read_site(SOURCE)
        content = (b'## Step 1\nOpen {{start_url}}.\n\n## Step 2\n'
                   b'Click show-entry-price and observe the page.\n')
        with self.assertRaisesRegex(DesignError, 'exact result assertion'):
            validate_generated_test(site, content)


if __name__ == '__main__':
    unittest.main()
