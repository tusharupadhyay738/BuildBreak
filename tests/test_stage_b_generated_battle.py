"""Unit tests for Stage B generated suite battle evaluation and classifications."""
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch, MagicMock

from buildbreak.generated_battle import BattleResult, evaluate_suite_on_broken_app


class GeneratedBattleEvaluationTests(unittest.TestCase):
    def test_unqualified_suite_reports_no_eligible_tests(self):
        with TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            workspace = tmp_path / "workspace"
            workspace.mkdir()
            suite_dir = tmp_path / "suite"
            suite_dir.mkdir()

            res = evaluate_suite_on_broken_app(workspace, tmp_path / "private", "http://127.0.0.1:5000",
                                               suite_dir, "kane-cli")
            self.assertEqual(res['overall_outcome'], BattleResult.INFRASTRUCTURE_ERROR)
            self.assertIn("No qualified tests", res['reason'])

    @patch("buildbreak.generated_battle.qualified_tests")
    @patch("buildbreak.generated_battle.run_generated_test")
    def test_suite_caught_defect(self, mock_run_test, mock_qualified):
        mock_qualified.return_value = {"test_a_test.md": "hash_a"}
        mock_run_test.return_value = {
            "result": "verification_failed",
            "evidence_id": "ev-123",
            "test_hash": "hash_a"
        }

        with TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            workspace = tmp_path / "workspace"
            workspace.mkdir()
            suite_dir = tmp_path / "suite"
            suite_dir.mkdir()
            (suite_dir / "manifest.json").write_text('{"tests": {"test_a_test.md": "hash_a"}}', encoding="utf-8")
            (suite_dir / "test_a_test.md").write_text("## Step 1\nStep", encoding="utf-8")

            res = evaluate_suite_on_broken_app(workspace, tmp_path / "private", "http://127.0.0.1:5000",
                                               suite_dir, "kane-cli")
            self.assertEqual(res['overall_outcome'], BattleResult.CAUGHT)
            self.assertEqual(res['failing_test'], "test_a_test.md")

    @patch("buildbreak.generated_battle.qualified_tests")
    @patch("buildbreak.generated_battle.run_generated_test")
    def test_suite_escaped_defect(self, mock_run_test, mock_qualified):
        mock_qualified.return_value = {"test_a_test.md": "hash_a"}
        mock_run_test.return_value = {
            "result": "passed",
            "evidence_id": "ev-456",
            "test_hash": "hash_a"
        }

        with TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            workspace = tmp_path / "workspace"
            workspace.mkdir()
            suite_dir = tmp_path / "suite"
            suite_dir.mkdir()
            (suite_dir / "manifest.json").write_text('{"tests": {"test_a_test.md": "hash_a"}}', encoding="utf-8")
            (suite_dir / "test_a_test.md").write_text("## Step 1\nStep", encoding="utf-8")

            res = evaluate_suite_on_broken_app(workspace, tmp_path / "private", "http://127.0.0.1:5000",
                                               suite_dir, "kane-cli")
            self.assertEqual(res['overall_outcome'], BattleResult.ESCAPED)

    @patch("buildbreak.generated_battle.qualified_tests")
    @patch("buildbreak.generated_battle.run_generated_test")
    def test_suite_infrastructure_error(self, mock_run_test, mock_qualified):
        mock_qualified.return_value = {"test_a_test.md": "hash_a"}
        mock_run_test.return_value = {
            "result": "infrastructure_error",
            "evidence_id": None,
            "test_hash": "hash_a"
        }

        with TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            workspace = tmp_path / "workspace"
            workspace.mkdir()
            suite_dir = tmp_path / "suite"
            suite_dir.mkdir()
            (suite_dir / "manifest.json").write_text('{"tests": {"test_a_test.md": "hash_a"}}', encoding="utf-8")
            (suite_dir / "test_a_test.md").write_text("## Step 1\nStep", encoding="utf-8")

            res = evaluate_suite_on_broken_app(workspace, tmp_path / "private", "http://127.0.0.1:5000",
                                               suite_dir, "kane-cli")
            self.assertEqual(res['overall_outcome'], BattleResult.INFRASTRUCTURE_ERROR)


if __name__ == '__main__':
    unittest.main()
