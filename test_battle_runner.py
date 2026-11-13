import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
import zipfile
import subprocess
import sys
import time
from types import SimpleNamespace
from unittest.mock import patch
from contextlib import closing

from app import create_app
from battle_runner import (ROOT, TEST, apply_fault, check_protected, classify_kane,
                           connect, digest, event, record_run, snapshot, validate_pack,
                           validate_repair, RejectedRepair, battle_exit_code, run_battle, main, command,
                           failure_handoff, Server)


class BattleRunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir='.')
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_intermediate_pass_is_not_a_file_pass(self):
        self.assertEqual(classify_kane([{'type': 'run_end', 'status': 'passed'}], 0), 'infrastructure_error')
        events = [{'type': 'test_md_summary', 'overall_status': 'passed', 'steps': {'total': 5, 'passed': 5}},
                  {'type': 'test_md_done', 'overall_status': 'passed'}]
        self.assertEqual(classify_kane(events, 0), 'passed')
        self.assertEqual(classify_kane(events, 1), 'infrastructure_error')
        events[0]['steps']['passed'] = 4
        self.assertEqual(classify_kane(events, 0), 'infrastructure_error')

    def test_failed_assertion_distinguished_from_browser_failure(self):
        events = [{'type': 'test_md_summary', 'overall_status': 'failed'},
                  {'type': 'test_md_done', 'overall_status': 'failed'}]
        self.assertEqual(classify_kane(events, 1), 'infrastructure_error')
        events.append({'type': 'step_event', 'event': 'assertion', 'passed': False})
        self.assertEqual(classify_kane(events, 1), 'verification_failed')
        events[1]['overall_status'] = 'passed'
        self.assertEqual(classify_kane(events, 1), 'infrastructure_error')

    def test_snapshot_excludes_private_state_and_detects_test_tampering(self):
        workspace = self.root / 'workspace'
        manifest = snapshot(ROOT, workspace)
        self.assertFalse((workspace / '.git').exists())
        self.assertFalse((workspace / 'instance').exists())
        self.assertFalse((workspace / 'battle_runner.py').exists())
        self.assertFalse((workspace / '.testmuai/evidence').exists())
        self.assertEqual(digest(workspace / TEST), digest(ROOT / TEST))
        check_protected(workspace, manifest)
        (workspace / TEST).write_text('weakened assertion', encoding='utf-8')
        with self.assertRaises(ValueError):
            check_protected(workspace, manifest, allow_app=True)

    def test_fault_is_isolated_and_rejects_repeat_injection(self):
        workspace = self.root / 'workspace'
        manifest = snapshot(ROOT, workspace)
        original_hash = digest(ROOT / 'app.py')
        apply_fault(workspace, 'order-total')
        self.assertNotEqual(digest(workspace / 'app.py'), manifest['app.py'])
        check_protected(workspace, manifest, allow_app=True)
        self.assertEqual(digest(ROOT / 'app.py'), original_hash)
        with self.assertRaises(ValueError):
            apply_fault(workspace, 'order-total')

    def test_dashboard_displays_only_recorded_safe_fields(self):
        database = self.root / 'arena.sqlite3'
        with connect(database) as db:
            db.execute('INSERT INTO arena_sessions VALUES (?,?,?,?,?,?)',
                       ('real-record', '2026-11-13T00:00:00+00:00', 'prepared', 'snapshot', 'scripted Breaker / human Builder', 0))
        event(database, 'real-record', 'prepared', 'Isolated source prepared.', 'awaiting_builder')
        record_run(database, 'real-record', 'before', 0, dict(result='verification_failed',
                   evidence_id='recorded-run', pack_hash='abc', test_hash='def', duration=10))
        app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'),
                          'ARENA_DATABASE': str(database), 'ARENA_SOURCES': str(self.root / 'private-paths.json')})
        client = app.test_client()
        page = client.get('/arena/live')
        self.assertEqual(page.status_code, 200)
        for value in (b'real-record', b'awaiting_builder', b'verification_failed', b'recorded-run'):
            self.assertIn(value, page.data)
        self.assertNotIn(str(self.root).encode(), page.data)
        self.assertEqual(client.post('/arena/live').status_code, 405)
        self.assertEqual(client.get('/arena/run').status_code, 404)
        self.assertIn('no-store', page.headers['Cache-Control'])

    def test_dashboard_empty_without_runner_database_tables(self):
        app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'),
                          'ARENA_DATABASE': str(self.root / 'arena.sqlite3')})
        self.assertIn(b'No runner battles yet', app.test_client().get('/arena/live').data)

    def test_evidence_identity_verdict_test_hash_and_target_must_agree(self):
        # Synthetic metadata fixture, never presented as a real Kane execution.
        pack = self.root / 'fixture.zip'
        with zipfile.ZipFile(pack, 'w') as archive:
            archive.writestr('run.yaml', 'run_id: fixture\nenvironment:\n  surfaces:\n    - http://127.0.0.1:1234\n')
            archive.writestr('tests/fixture/result.yaml', 'status: passed\ndefinition:\n  sha256: sha256:abc\n')
        validate_pack(pack, 'fixture', 'abc', 'passed', 'http://127.0.0.1:1234')
        for args in [('other', 'abc', 'passed', 'http://127.0.0.1:1234'),
                     ('fixture', 'changed', 'passed', 'http://127.0.0.1:1234'),
                     ('fixture', 'abc', 'failed', 'http://127.0.0.1:1234'),
                     ('fixture', 'abc', 'passed', 'http://127.0.0.1:9999')]:
            with self.assertRaises(ValueError):
                validate_pack(pack, *args)

    def test_timeout_stops_descendants_holding_output_open(self):
        # Real local processes, no Kane/Codex/network. Child would otherwise
        # retain the output pipe for 30 seconds after its parent is killed.
        code = ('import subprocess,sys,time; '
                'subprocess.Popen([sys.executable,"-c","import time; time.sleep(30)"]); '
                'print("child started",flush=True); time.sleep(30)')
        started = time.monotonic()
        with self.assertRaises(subprocess.TimeoutExpired) as caught:
            command([sys.executable, '-c', code], self.root, timeout=.5)
        self.assertLess(time.monotonic() - started, 5)
        self.assertIn('child started', caught.exception.output)

    def test_broken_pack_requires_triaged_application_assertion(self):
        pack = self.root / 'fixture-broken.zip'
        def write_failure(category='application_issue/ui_data_defect', message='assertion_failed: @ step 15', triage='triaged'):
            with zipfile.ZipFile(pack, 'w') as archive:
                archive.writestr('run.yaml', 'run_id: fixture\nenvironment:\n  surfaces:\n    - http://127.0.0.1:1234\n')
                archive.writestr('tests/fixture/result.yaml', 'status: broken\ndefinition:\n  sha256: sha256:abc\n')
                archive.writestr('tests/fixture/steps/15/failure.yaml',
                                 f"error:\n  message: '{message}'\n  type: replay_failure\ntriage:\n  status: {triage}\n  rca:\n    category: {category}\n")
        write_failure()
        validate_pack(pack, 'fixture', 'abc', 'failed', 'http://127.0.0.1:1234')
        with self.assertRaises(ValueError):
            validate_pack(pack, 'fixture', 'abc', 'passed', 'http://127.0.0.1:1234')
        for kwargs in ({'category': 'system_issue/browser_crash'}, {'message': 'navigation_timeout'}, {'triage': 'untriaged'}):
            write_failure(**kwargs)
            with self.assertRaises(ValueError):
                validate_pack(pack, 'fixture', 'abc', 'failed', 'http://127.0.0.1:1234')

    def test_empty_replay_summary_handoff_uses_current_observations(self):
        pack = self.root / 'fixture-handoff.zip'
        actions = [{'action_type': 'analyze', 'action_params': {'key': 'saved_confirmation_total'}, 'output_value': '$44.97'},
                   {'action_type': 'analyze', 'action_params': {'key': 'cookie'}, 'output_value': 'private-cookie'}]
        with zipfile.ZipFile(pack, 'w') as archive:
            archive.writestr('tests/fixture/logs/3-actions.ndjson', '\n'.join(json.dumps(a) for a in actions))
        events = [{'type': 'run_end', 'summary': ''}, {'event': 'assertion', 'passed': False, 'detail': 'Total must be $40.47'}]
        handoff = failure_handoff(events, pack)
        self.assertIn('Total must be $40.47', handoff)
        self.assertIn('Observed saved_confirmation_total: $44.97', handoff)
        self.assertNotIn('private-cookie', handoff)

    def test_timeout_is_bounded_when_parent_exits_before_child(self):
        code = ('import subprocess,sys; '
                'subprocess.Popen([sys.executable,"-c","import time; time.sleep(30)"]); '
                'print("parent exiting",flush=True)')
        started = time.monotonic()
        with self.assertRaises(subprocess.TimeoutExpired):
            command([sys.executable, '-c', code], self.root, timeout=.5)
        self.assertLess(time.monotonic() - started, 5)

    def test_successful_command_retains_output_and_status(self):
        result = command([sys.executable, '-c', 'print("finished"); raise SystemExit(7)'], self.root)
        self.assertEqual(result.returncode, 7)
        self.assertEqual(result.stdout.strip(), 'finished')

    def test_server_restarts_use_fresh_databases_and_preserve_previous_orders(self):
        workspace = self.root / 'server-workspace'
        snapshot(ROOT, workspace)
        server = Server(workspace.resolve(), self.root.resolve(), sys.executable)
        try:
            server.start()
            first = server.database
            with closing(sqlite3.connect(first)) as db:
                db.execute("INSERT INTO orders(token) VALUES ('local-unit-test-fixture')")
                db.commit()
            server.stop()
            server.start()
            self.assertNotEqual(server.database, first)
            with closing(sqlite3.connect(server.database)) as db:
                self.assertEqual(db.execute('SELECT COUNT(*) FROM orders').fetchone()[0], 0)
            with closing(sqlite3.connect(first)) as db:
                self.assertEqual(db.execute('SELECT COUNT(*) FROM orders').fetchone()[0], 1)
        finally:
            server.stop()

    def test_repair_validation_rejects_syntax_routes_and_wrong_shapes(self):
        source = (ROOT / 'app.py').read_text(encoding='utf-8')
        self.assertEqual(validate_repair({'app_source': source}, source), source)
        for answer in ({'app_source': 'def broken('}, {'app_source': source.replace('@app.post("/checkout")', '@app.post("/wrong")')}, {}, None):
            with self.assertRaises(RejectedRepair):
                validate_repair(answer, source)

    def exercise_repairs(self, answers):
        project = self.root / 'project'
        snapshot(ROOT, project)
        original = (project / 'app.py').read_text(encoding='utf-8')
        def result(status):
            # Synthetic orchestration fixtures, stored only in a temporary DB.
            return dict(result=status, evidence_id='fixture', pack_hash='fixture',
                        test_hash='fixture', duration=0, failure='Recorded fixture failure')
        replies = iter(answers)
        def fake_builder(codex, workspace, artifacts, failure, previous_test_failure=''):
            artifacts.mkdir(parents=True)
            return next(replies)
        with patch('battle_runner.executable', return_value=sys.executable), \
             patch('battle_runner.Server') as server, \
             patch('battle_runner.command', return_value=SimpleNamespace(stdout='fixture-head', stderr='', returncode=0)), \
             patch('battle_runner.run_kane', side_effect=[result('passed'), result('verification_failed'), result('passed')]) as kane, \
             patch('battle_runner.builder_patch', side_effect=fake_builder) as builder:
            server.return_value.url = 'http://127.0.0.1:1234'
            battle = run_battle(root=project, builder='codex', max_attempts=3)
        with connect(project / 'instance/arena.sqlite3') as db:
            state, attempts = db.execute('SELECT state,attempts FROM arena_sessions WHERE id=?', (battle,)).fetchone()
            rejected = db.execute("SELECT COUNT(*) FROM arena_events WHERE battle_id=? AND kind='builder_rejected'", (battle,)).fetchone()[0]
        self.assertEqual((project / 'app.py').read_text(encoding='utf-8'), original)
        return state, attempts, rejected, builder.call_count, kane.call_count

    def test_invalid_repairs_retry_then_valid_repair_reaches_kane(self):
        source = (ROOT / 'app.py').read_text(encoding='utf-8')
        outcome = self.exercise_repairs([{'app_source': 'def broken('},
                                        {'app_source': source.replace('@app.post("/checkout")', '@app.post("/wrong")')},
                                        {'app_source': source}])
        self.assertEqual(outcome, ('completed', 3, 2, 3, 3))

    def test_three_rejected_repairs_stop_without_false_infrastructure_error(self):
        outcome = self.exercise_repairs([{'app_source': 'def broken('}] * 3)
        self.assertEqual(outcome, ('needs_human', 3, 3, 3, 2))

    def test_cli_returns_final_state_exit_code(self):
        database = self.root / 'instance/arena.sqlite3'
        for state, expected in [('completed', 0), ('baseline_blocked', 1), ('not_detected', 1),
                                ('needs_human', 1), ('awaiting_builder', 2), ('infrastructure_error', 3)]:
            with self.subTest(state=state):
                with connect(database) as db:
                    db.execute('INSERT OR REPLACE INTO arena_sessions VALUES (?,?,?,?,?,?)',
                               ('fixture', 'now', state, 'baseline', 'fixture', 0))
                with patch('battle_runner.ROOT', self.root), \
                     patch('battle_runner.run_battle', return_value='fixture'), \
                     patch('sys.argv', ['battle_runner.py']):
                    self.assertEqual(main(), expected)
        self.assertEqual(battle_exit_code('unknown'), 3)


if __name__ == '__main__':
    unittest.main()
