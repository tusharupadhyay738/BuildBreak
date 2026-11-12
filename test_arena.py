import json
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from app import create_app
from import_battle import import_battle

class ArenaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=".")
        self.root = Path(self.temp.name)
        self.database = self.root / "arena.sqlite3"
        self.sources = self.root / "sources.json"
        self.app = create_app({"TESTING": True, "DATABASE": str(self.root / "shop.sqlite3"), "ARENA_DATABASE": str(self.database), "ARENA_SOURCES": str(self.sources)})
        self.client = self.app.test_client()
    def tearDown(self):
        self.temp.cleanup()
    def test_missing_sources_still_starts(self):
        self.assertIn(b"No historical battle", self.client.get("/arena").data)
        self.assertEqual(self.client.get("/").status_code, 200)
    def test_import_missing_files_creates_no_battle(self):
        self.sources.write_text(json.dumps({"before": {"report": "missing"}}))
        with self.assertRaises(OSError):
            import_battle(self.sources, self.database)
        self.assertIn(b"No historical battle", self.client.get("/arena").data)
    def test_recorded_results_survive_missing_evidence_and_stay_private(self):
        with closing(sqlite3.connect(self.database)) as connection:
            with connection:
                connection.execute("INSERT INTO battles VALUES (?,?,?,?)", ("discount-regression", "baseline", "fault", "repair"))
                connection.execute("INSERT INTO battle_runs VALUES (?,?,?,?,?,?,?)", ("discount-regression", "before", "test-execution", "failed", 3998, 3598, 3798))
        self.sources.write_text(json.dumps({"before": {"report": "private-secret-path", "pack": "private-cookie-path"}}))
        response = self.client.get("/arena")
        for text in (b"$39.98", b"$35.98", b"$37.98", b"failed", b"Unavailable", b"Human-triggered"):
            self.assertIn(text, response.data)
        self.assertNotIn(b"private-secret-path", response.data)
        self.assertNotIn(b"private-cookie-path", response.data)
        self.assertEqual(self.client.post("/arena").status_code, 405)
        self.assertEqual(self.client.get("/arena/evidence").status_code, 404)
