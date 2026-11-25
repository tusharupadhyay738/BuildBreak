"""Offline evaluator checks. All Kane responses in this module are fixtures."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from buildbreak.generated_battle import BattleResult, evaluate_suite_on_broken_app, run_generated_test
from buildbreak.generated_suite import approve, digest
from buildbreak import seatpilot_adapter as adapter, seatpilot_runner
import sqlite3
from contextlib import closing


class GeneratedBattleEvaluationTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve()
        self.proposed = self.root / "proposed"
        self.proposed.mkdir()
        self.name = "catalog_test.md"
        data = b"## Step 1\nRead the catalog.\n"
        (self.proposed / self.name).write_bytes(data)
        self.sha = digest(data)
        self.suite = self.root / "approved"
        approve(self.proposed, self.suite, {self.name: self.sha})
        runs = [dict(test_hash=self.sha, result="passed", evidence_id=f"fixture-{i}") for i in (1, 2)]
        (self.suite / "qualification.json").write_text(json.dumps({self.name: dict(status="kept", runs=runs)}))
        self.workspace = self.root / "workspace"
        self.workspace.mkdir()
        self.runner = Mock(return_value=dict(test_hash=self.sha, result="passed", evidence_id="fixture-3"))

    def evaluate(self, healthy, broken):
        return evaluate_suite_on_broken_app(self.workspace, self.root / "private", "http://127.0.0.1:5000",
            self.suite, "fixture-cli", healthy=healthy, broken=broken, runner=self.runner)

    def test_unqualified_suite_reports_no_eligible_tests(self):
        (self.suite / "qualification.json").unlink()
        self.assertEqual(self.evaluate({"total": 10}, {"total": 9})["overall_outcome"], BattleResult.INFRASTRUCTURE_ERROR)
        self.runner.assert_not_called()

    def test_same_observations_do_not_launch_kane_or_score_escape(self):
        self.assertEqual(self.evaluate({"total": 10}, {"total": 10})["overall_outcome"], BattleResult.NO_DIFFERENCE)
        self.runner.assert_not_called()

    def test_probe_missing_or_errored_is_unscored(self):
        for broken in (None, {}, {"error": "unavailable"}, {"wrong_key": 9}, {"db_present": False}):
            self.assertEqual(self.evaluate({"total": 10}, broken)["overall_outcome"], BattleResult.INFRASTRUCTURE_ERROR)
        self.runner.assert_not_called()

    def test_suite_caught_defect(self):
        self.runner.return_value["result"] = "verification_failed"
        res = self.evaluate({"total": 10}, {"total": 9})
        self.assertEqual(res["overall_outcome"], BattleResult.CAUGHT)
        self.assertEqual(res["failing_test"], self.name)

    def test_suite_escaped_defect(self):
        self.assertEqual(self.evaluate({"total": 10}, {"total": 9})["overall_outcome"], BattleResult.ESCAPED)

    def test_unknown_result_missing_evidence_or_wrong_hash_never_scores(self):
        for change in (dict(result="infrastructure_error"), dict(result="incomplete"),
                       dict(evidence_id=None), dict(test_hash="stale")):
            self.runner.return_value = dict(dict(result="passed", evidence_id="fixture", test_hash=self.sha), **change)
            self.assertEqual(self.evaluate({"total": 10}, {"total": 9})["overall_outcome"], BattleResult.INFRASTRUCTURE_ERROR)

    def exercise_dashboard_runner(self, broken_result, suite_name='seatpilot-attempt-02'):
        from buildbreak.battle_runner import ROOT
        suite = self.root / '.testmuai/tests/generated' / suite_name
        suite.parent.mkdir(parents=True)
        self.suite.rename(suite)
        (self.root/adapter.TEST).write_bytes((ROOT/adapter.TEST).read_bytes())
        original_prepare = adapter.prepare_runtime

        def prepare(dest, **unused):
            original_prepare(dest)
            (dest/"site").mkdir()
            (dest/"site/index.html").write_text("<title>SeatPilot</title>")

        phases = []
        def offline_check(workspace, artifacts, url, name, kane, **opts):
            self.assertEqual(opts["expected_hash"], self.sha)
            self.assertEqual(opts["test_path"], suite/self.name)
            phase = artifacts.name.split("-")[0]
            phases.append(phase)
            return dict(result=broken_result if phase=="before" else "passed", test_hash=self.sha,
                        evidence_id="fixture-"+phase, pack_hash="fixture", duration=0,
                        failure="fixture quote mismatch" if phase=="before" else "")

        def offline_builder(codex, workspace, artifacts, failure, previous):
            artifacts.mkdir()
            return {"app_source": (ROOT/"examples/seatpilot/app.py").read_text()}

        db = self.root/"history.sqlite3"
        with patch.object(seatpilot_runner,"ROOT",self.root), patch.object(adapter,"prepare_runtime",prepare), \
             patch.object(seatpilot_runner,"executable",return_value="offline"), \
             patch.object(seatpilot_runner,"builder", side_effect=offline_builder) as builder:
            battle = seatpilot_runner.run_battle(self.root/"source",breaker="scripted",database=db,
                artifacts_root=self.root/"instance/battles",generated_hash=self.sha,
                generated_suite_name=suite_name,verification_runner=offline_check)
        with closing(sqlite3.connect(db)) as conn:
            state = conn.execute("select state from arena_sessions where id=?",(battle,)).fetchone()[0]
        return state, phases, builder.call_count, self.root/"instance/battles"/battle

    def test_real_probe_and_mocked_browser_escape_save_followup(self):
        state, phases, attempts, private = self.exercise_dashboard_runner("passed")
        self.assertEqual((state, phases, attempts), ("not_detected", ["baseline","before"], 0))
        gap = json.loads((private/"coverage-gap/observations.json").read_text())
        self.assertNotEqual(gap["healthy"]["total"],gap["changed"]["total"])
        self.assertIn("EARLY15",(private/"coverage-gap/requirements.md").read_text())

        from buildbreak.coverage_gap import check_followup
        from buildbreak.generated_suite import qualified_tests
        proposed = private/"coverage-gap/proposed/.testmuai/tests"
        proposed.mkdir(parents=True)
        (proposed/self.name).write_bytes((self.proposed/self.name).read_bytes())
        def verify_gap(*args):
            phase = args[1].parent.name
            return dict(result="verification_failed" if phase=="broken" else "passed",
                        test_hash=self.sha, evidence_id="fixture-"+phase)
        with patch("buildbreak.coverage_gap.executable",return_value="offline"), \
             patch("buildbreak.coverage_gap.run_generated_test",side_effect=verify_gap):
            self.assertTrue(check_followup(self.root, private.name, self.name, self.sha))
        qualified = self.root/".testmuai/tests/generated"/("seatpilot-gap-"+private.name)
        self.assertEqual(qualified_tests(qualified), {self.name:self.sha})

    def test_real_probe_and_mocked_browser_catch_goes_through_repair(self):
        state, phases, attempts, _ = self.exercise_dashboard_runner("verification_failed",'seatpilot-gap-fixture')
        self.assertEqual((state, phases, attempts), ("completed", ["baseline","before","after"], 1))

    def test_generated_suite_name_cannot_escape_the_archive(self):
        for name in ('../other', 'seatpilot-../../other', '/absolute', 'other'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                seatpilot_runner.run_battle(self.root,breaker='scripted',generated_hash=self.sha,
                                           generated_suite_name=name)

    def test_cli_only_receives_isolated_copy_with_bound_start_url(self):
        with patch("buildbreak.generated_battle._run_testmd") as kane:
            run_generated_test(self.workspace, self.root/"kane", "http://127.0.0.1:5000",
                               "fixture", "kane", self.suite/self.name, self.sha)
        path, steps = kane.call_args.args[5:7]
        self.assertEqual(steps, 1)
        self.assertEqual((self.workspace/path).read_bytes(), (self.suite/self.name).read_bytes())
        self.assertFalse(path.is_absolute())
        self.assertEqual(json.loads(kane.call_args.kwargs["variables_file"].read_text())["start_url"]["value"],
                         "http://127.0.0.1:5000")
