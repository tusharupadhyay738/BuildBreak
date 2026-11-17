"""Offline command checks only; no live Kane verdict is produced."""
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from buildbreak.battle_runner import ROOT, TEST, run_kane


class VisibleBrowserTests(unittest.TestCase):
    def test_visible_mode_omits_only_headless_and_keeps_frozen_test_options(self):
        with tempfile.TemporaryDirectory(dir=ROOT / 'instance') as folder:
            workspace = Path(folder) / 'workspace'
            target = workspace / TEST
            target.parent.mkdir(parents=True)
            original = (ROOT / TEST).read_bytes()
            target.write_bytes(original)
            for visible in (False, True):
                with patch('buildbreak.battle_runner.owned_run', return_value=subprocess.CompletedProcess([], 0, '', '')) as call:
                    result = run_kane(workspace, Path(folder) / str(visible), 'http://127.0.0.1:1234',
                                      'synthetic-command-check', 'kane-cli.cmd', show_browser=visible)
                args = call.call_args.args[0]
                self.assertEqual('--headless' in args, not visible)
                self.assertIn('--no-adaptive-heal', args)
                self.assertIn('--agent', args)
                self.assertIn(str(TEST), args)
                self.assertEqual(target.read_bytes(), original)
                self.assertEqual(result['result'], 'infrastructure_error')
