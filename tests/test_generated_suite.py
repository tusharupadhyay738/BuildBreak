import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from app import create_app
from buildbreak.arena import generated_suite_cards
from buildbreak.battle_runner import classify_kane
from buildbreak.generated_suite import approve, dashboard_suites, digest, disposition, qualified_tests, verify
from buildbreak.seatpilot_runner import builder


class GeneratedSuiteTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve()
        self.proposals = self.root / "proposed"
        self.proposals.mkdir()
        self.name = "catalog_test.md"
        self.sample = b"## Step 1\n\nPrivate fixture sentinel for the browser only.\n"
        (self.proposals / self.name).write_bytes(self.sample)
        self.selected = {self.name: digest(self.sample)}
        self.suite = self.root / "generated" / "example"

    def lock(self):
        approve(self.proposals, self.suite, self.selected)

    def test_copies_only_approved_bytes_and_detects_changes(self):
        (self.proposals / "other_test.md").write_text("unapproved", encoding="utf-8")
        self.lock()
        self.assertEqual(verify(self.suite), {"proposed": 2, "tests": self.selected})
        self.assertFalse((self.suite / "other_test.md").exists())
        (self.suite / self.name).write_bytes(b"edited")
        with self.assertRaises(ValueError):
            verify(self.suite)

    def test_changed_proposal_does_not_install_partial_suite(self):
        (self.proposals / self.name).write_bytes(b"changed since review")
        with self.assertRaises(ValueError):
            self.lock()
        self.assertFalse(self.suite.exists())

    def test_refuses_existing_target_and_path_traversal(self):
        with self.assertRaises(ValueError):
            approve(self.proposals, self.suite, {"../catalog_test.md": digest(self.sample)})
        self.lock()
        with self.assertRaises(FileExistsError):
            self.lock()
        self.assertEqual((self.suite / self.name).read_bytes(), self.sample)

    def test_two_distinct_passes_required(self):
        first = {"result": "passed", "evidence_id": "fixture-a"}
        second = {"result": "passed", "evidence_id": "fixture-b"}
        self.assertEqual(disposition([first, second]), "kept")
        for result in ("verification_failed", "infrastructure_error"):
            self.assertEqual(disposition([first, dict(second, result=result)]),
                             "unstable or failing on healthy app")
        for runs in ([first], [first, first]):
            with self.assertRaises(ValueError):
                disposition(runs)

    def test_checks_the_generated_step_count(self):
        events = [{"type": "test_md_summary", "overall_status": "passed",
                   "steps": {"total": 2, "passed": 2}},
                  {"type": "test_md_done", "overall_status": "passed"}]
        self.assertEqual(classify_kane(events, 0, 2), "passed")
        self.assertEqual(classify_kane(events, 0), "infrastructure_error")

    def test_builder_gets_source_only_in_read_only_sandbox(self):
        self.lock()
        work = self.root / "app"
        work.mkdir()
        (work / "app.py").write_text("value = 1", encoding="utf-8")
        (work / "catalog.json").write_text("[]", encoding="utf-8")

        def mock_codex(args, cwd, *, timeout, input_text):
            self.assertEqual(args[args.index("--sandbox") + 1], "read-only")
            self.assertEqual(sorted(p.name for p in cwd.iterdir()), ["app.py", "catalog.json"])
            self.assertNotIn("Private fixture sentinel", input_text)
            dest = Path(args[args.index("-o") + 1])
            self.assertTrue(dest.is_relative_to(self.root / "attempt" / "session"))
            dest.write_text(json.dumps({"app_source": "value = 2", "explanation": "fixture"}))
            return subprocess.CompletedProcess(args, 0, "", "")

        with patch("buildbreak.battle_runner.command", side_effect=mock_codex):
            answer = builder("mock-codex", work, self.root / "attempt", "fixture assertion", "")
        self.assertEqual(answer["app_source"], "value = 2")
        self.assertEqual(verify(self.suite)["tests"], self.selected)

    def test_only_two_pass_tests_are_eligible_for_drills(self):
        self.lock()
        self.assertEqual(qualified_tests(self.suite), {})
        path = self.suite / "qualification.json"
        for second, expected in (("passed", self.selected), ("verification_failed", {})):
            runs = [{"result": result, "test_hash": self.selected[self.name], "evidence_id": eid}
                    for result, eid in (("passed", "fixture-a"), (second, "fixture-b"))]
            path.write_text(json.dumps({self.name: {"status": disposition(runs), "runs": runs}}))
            self.assertEqual(qualified_tests(self.suite), expected)
            counts = dashboard_suites(self.suite.parent)[0]["counts"]
            self.assertEqual((counts["kept"], counts["dropped"]), (len(expected), 1 - len(expected)))

    def test_dashboard_refuses_mismatched_receipt(self):
        self.lock()
        self.assertEqual(dashboard_suites(self.suite.parent)[0]["counts"]["kept"], 0)
        (self.suite / "qualification.json").write_text("{}", encoding="utf-8")
        self.assertIsNone(dashboard_suites(self.suite.parent)[0]["counts"])

    def test_dashboard_separates_healthy_qualification_from_confirmed_fault_result(self):
        self.lock()
        runs = [{"result": "passed", "test_hash": self.selected[self.name],
                 "evidence_id": evidence_id} for evidence_id in ("synthetic-a", "synthetic-b")]
        (self.suite / "qualification.json").write_text(json.dumps({
            self.name: {"status": "kept", "runs": runs},
        }), encoding="utf-8")
        generated_battle = {
            "mode": "SeatPilot generated suite / scripted Breaker / codex Builder",
            "verifications": [{"test_hash": self.selected[self.name]}],
            "drill": {"independently_validated": 1, "outcome": "caught_and_repaired"},
        }

        card = generated_suite_cards(self.suite.parent, [generated_battle])[0]
        self.assertEqual(card["healthy_state"], "Passed twice on healthy app")
        self.assertEqual(card["fault_state"], "Caught a confirmed fault")

        generated_battle["drill"]["outcome"] = "escaped"
        card = generated_suite_cards(self.suite.parent, [generated_battle])[0]
        self.assertEqual(card["fault_state"], "A confirmed fault escaped the selected checks")

        generated_battle["drill"]["independently_validated"] = 0
        card = generated_suite_cards(self.suite.parent, [generated_battle])[0]
        self.assertEqual(card["fault_state"], "Not recorded")

    def test_regression_counts_render_without_battle_history(self):
        self.lock()
        app = create_app({"TESTING": True, "DATABASE": str(self.root / "shop.db"),
                          "ARENA_DATABASE": str(self.root / "arena.db"),
                          "ARENA_GENERATED_SUITES": self.suite.parent})
        html = app.test_client().get("/arena").get_data(as_text=True)
        self.assertIn("Generated proposals selected and human-approved", html)
        self.assertIn("Confirmed-fault state", html)
        self.assertIn("Healthy verification pending", html)
        self.assertIn("Kept after two healthy runs", html)
        self.assertNotIn("Private fixture sentinel", html)
