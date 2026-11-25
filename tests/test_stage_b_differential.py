"""Tests for Stage B flow-guided breaker and generic differential check."""
import unittest
from contextlib import closing
import sqlite3
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from buildbreak.flow_breaker import build_flow_guided_prompt
from buildbreak.differential_check import (compare_differential_observations, probe_database_snapshot,
                                          DifferentialProbeError)


class StageBArchitectureTests(unittest.TestCase):
    def test_flow_guided_prompt_never_contains_tests_or_assertions(self):
        flow_map = {
            "target": "SeatPilot",
            "pages": [{"path": "/"}],
            "controls_seen": [{"label": "All Programs"}, {"label": "Chamber Music"}]
        }
        source = "def pricing():\n    return 4497\n"
        prompt = build_flow_guided_prompt("SeatPilot", flow_map, source)

        # Gemini must only see flow map + mutable source, NEVER tests
        self.assertIn("Chamber Music", prompt)
        self.assertIn("def pricing()", prompt)
        self.assertNotIn("testmd", prompt)
        self.assertNotIn("_test.md", prompt)
        self.assertNotIn("manifest.json", prompt)
        self.assertNotIn("assert", prompt)

    def test_sqlite_probe_reads_fictional_amounts_and_rejects_writes(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp)/"demo.sqlite3"
            with closing(sqlite3.connect(path)) as db:
                db.execute("CREATE TABLE quotes(total INTEGER)")
                db.execute("INSERT INTO quotes VALUES (500)")
                db.commit()
            query = [("quotes", "SELECT total FROM quotes ORDER BY total")]
            self.assertEqual(probe_database_snapshot(path, query), {"quotes":[{"total":500}]})
            with self.assertRaises(DifferentialProbeError):
                probe_database_snapshot(path, [("write", "UPDATE quotes SET total=0")])
            self.assertEqual(probe_database_snapshot(path, query)["quotes"][0]["total"], 500)

    def test_differential_check_detects_mismatch(self):
        healthy_obs = {
            "events_count": 3,
            "filter_chamber_music": ["Nocturne Symphony"],
            "saved_total": 4047
        }
        broken_obs = {
            "events_count": 3,
            "filter_chamber_music": ["Nocturne Symphony"],
            "saved_total": 4497  # bug injected
        }
        has_diff, explanation = compare_differential_observations(healthy_obs, broken_obs)
        self.assertTrue(has_diff)
        self.assertIn("saved_total", explanation)

    def test_differential_check_rejects_identical_runs(self):
        healthy_obs = {
            "events_count": 3,
            "filter_chamber_music": ["Nocturne Symphony"],
            "saved_total": 4047
        }
        has_diff, explanation = compare_differential_observations(healthy_obs, dict(healthy_obs))
        self.assertFalse(has_diff)
        self.assertIn("identical", explanation)


if __name__ == '__main__':
    unittest.main()
