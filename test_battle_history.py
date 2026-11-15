"""Outcome and dashboard fixtures are synthetic, never displayed as genuine runs."""
from pathlib import Path
from contextlib import closing
import sqlite3
import tempfile
import unittest

from app import create_app
from battle_runner import ROOT, SCHEMA, connect, event, record_run
from battle_history import save_details, outcome_for, summarize


class HistoryTests(unittest.TestCase):
    def setUp(self):
        (ROOT / 'instance').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=ROOT / 'instance')
        self.root = Path(self.temp.name)
        self.database = self.root / 'arena.sqlite3'

    def tearDown(self):
        self.temp.cleanup()

    def test_schema_addition_preserves_legacy_rows_and_values(self):
        with closing(sqlite3.connect(self.database)) as db:
            db.executescript(SCHEMA)
            db.execute('INSERT INTO arena_sessions VALUES (?,?,?,?,?,?)', ('legacy', 'now', 'completed', 'old', 'old mode', 1))
            db.commit()
        with connect(self.database) as db:
            self.assertEqual(db.execute('SELECT * FROM arena_sessions').fetchone(), ('legacy', 'now', 'completed', 'old', 'old mode', 1))
            self.assertEqual(db.execute('SELECT COUNT(*) FROM arena_drill_details').fetchone()[0], 0)

    def test_outcomes_require_consistent_verdicts_and_confirmed_escape(self):
        def runs(before, after=None):
            rows = [{'phase': 'baseline', 'result': 'passed'}, {'phase': 'before', 'result': before}]
            return rows + ([{'phase': 'after', 'result': after}] if after else [])
        self.assertEqual(outcome_for('completed', runs('verification_failed', 'passed'), True), 'caught_and_repaired')
        self.assertEqual(outcome_for('needs_human', runs('verification_failed'), True), 'caught_needs_human')
        self.assertEqual(outcome_for('not_detected', runs('passed'), True), 'escaped')
        self.assertIsNone(outcome_for('not_detected', runs('passed'), False))
        self.assertIsNone(outcome_for('infrastructure_error', runs('verification_failed'), True))
        self.assertIsNone(outcome_for('completed', runs('infrastructure_error', 'passed'), True))

    def seed(self, battle, state, producer='gemini', source='live', validated=True):
        with connect(self.database) as db:
            db.execute('INSERT INTO arena_sessions VALUES (?,?,?,?,?,?)', (battle, '2026-11-14T18:00:00+00:00', 'prepared', 'fixture', 'gemini Breaker / codex Builder', 1))
            save_details(db, battle, requested='gemini', producer=producer, source=source,
                         model='gemini-fixture' if producer == 'gemini' else None,
                         cache_id='a' * 64 if source == 'cached' else None, validated=validated, max_attempts=3)
        for phase, result in [('baseline', 'passed'), ('before', 'passed' if state == 'not_detected' else 'verification_failed')]:
            record_run(self.database, battle, phase, 0, dict(result=result, evidence_id='synthetic', pack_hash='fixture', test_hash='fixture', duration=0))
        if state == 'completed':
            record_run(self.database, battle, 'after', 1, dict(result='passed', evidence_id='synthetic', pack_hash='fixture', test_hash='fixture', duration=0))
        event(self.database, battle, 'fixture', 'Synthetic test fixture', state)

    def test_dashboard_labels_actual_producer_fallback_and_cached_source(self):
        self.seed('live', 'completed')
        self.seed('cached', 'completed', source='cached')
        self.seed('fallback', 'completed', producer='controlled-fallback', source='controlled')
        app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'), 'ARENA_DATABASE': str(self.database)})
        client = app.test_client()
        live = client.get('/arena/live?battle=live').data
        self.assertIn(b'Breaker: Gemini', live)
        self.assertIn(b'Generated live', live)
        self.assertIn(b'Caught and repaired', live)
        self.assertNotIn(b'Kane detected a controlled defect', live)
        cached = client.get('/arena/live?battle=cached').data
        self.assertIn(b'Cached replay', cached)
        self.assertIn(b'without a Gemini API call', cached)
        fallback = client.get('/arena/live?battle=fallback').data
        self.assertIn(b'Breaker: Controlled fallback', fallback)
        self.assertIn(b'not a successful Gemini-generated challenge', fallback)
        for page in (live, cached, fallback):
            self.assertNotIn(str(self.root).encode(), page)
            self.assertNotIn(b'old_text', page)

    def test_infrastructure_is_unscored_and_review_and_escapes_are_separate(self):
        self.seed('interrupted', 'infrastructure_error')
        self.seed('review', 'needs_human')
        self.seed('escape', 'not_detected')
        with connect(self.database) as db:
            rows = dict(db.execute('SELECT battle_id,outcome FROM arena_drill_details'))
        self.assertIsNone(rows['interrupted'])
        self.assertEqual(rows['review'], 'caught_needs_human')
        self.assertEqual(rows['escape'], 'escaped')
        app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'), 'ARENA_DATABASE': str(self.database)})
        client = app.test_client()
        page = client.get('/arena/live?battle=interrupted').data
        self.assertIn(b'Drill outcome: <strong>Not scored', page)
        self.assertIn(b'no verified repair', page)
        self.assertIn(b'Escaped the selected checks', client.get('/arena/live?battle=escape').data)

    def test_metrics_exclude_unvalidated_and_infrastructure_results(self):
        def session(outcome, valid=True):
            return {'drill': {'outcome': outcome, 'independently_validated': valid}}
        scores = summarize([session('caught_and_repaired'), session('escaped'),
                            session('caught_needs_human'), session(None),
                            session('caught_and_repaired', False), {'drill': None}])
        self.assertEqual((scores['scored'], scores['caught'], scores['caught_and_repaired'], scores['excluded']), (3, 2, 1, 3))


if __name__ == '__main__':
    unittest.main()
