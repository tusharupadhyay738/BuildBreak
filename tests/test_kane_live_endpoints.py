"""Offline monitor tests: these never invoke Kane or spend credits."""
import json
from pathlib import Path
import queue
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from app import create_app
from buildbreak import kane_live
from buildbreak.kane_live import LiveKaneSession, TEST_PATH, validate_request
from buildbreak.process_control import stream_run


class LiveKaneEndpointTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir='.')
        self.root = Path(self.temp.name)
        self.app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'),
            'ARENA_DATABASE': str(self.root / 'arena.sqlite3'),
            'ARENA_SOURCES': str(self.root / 'sources.json'), 'ARENA_ENABLE_LIVE_KANE': False})
        self.client = self.app.test_client()
        self.headers = {'X-Arena-Request': '1', 'Origin': 'http://localhost'}
        self.session = LiveKaneSession('http://127.0.0.1:5000')
        self.active = patch.object(kane_live, '_ACTIVE_SESSION', None)
        self.active.start()

    def tearDown(self):
        self.active.stop()
        self.temp.cleanup()

    def test_default_launch_disabled_and_stream_never_launches(self):
        with patch('buildbreak.arena.start_live_session') as start:
            response = self.client.post('/api/kane/run', json={}, headers=self.headers)
            self.assertEqual(response.status_code, 403)
            self.assertIn('ARENA_ENABLE_LIVE_KANE', response.json['error'])
            response = self.client.get('/api/kane/stream')
            self.assertIn(b'"status":"idle"', response.data)
            start.assert_not_called()

    def test_explicit_local_launch_only_and_non_object_body(self):
        self.app.config['ARENA_ENABLE_LIVE_KANE'] = True
        with patch('buildbreak.arena.start_live_session', return_value=self.session) as start:
            self.assertEqual(self.client.post('/api/kane/run', json={}).status_code, 403)
            self.assertEqual(self.client.post('/api/kane/run', json={}, headers={**self.headers,
                'Origin': 'https://unrelated.example'}).status_code, 403)
            self.assertEqual(self.client.post('/api/kane/run', json={}, headers=self.headers,
                environ_overrides={'REMOTE_ADDR': '192.0.2.1'}).status_code, 403)
            self.assertEqual(self.client.post('/api/kane/run', json={}, headers=self.headers,
                base_url='http://unrelated.example').status_code, 403)
            self.assertEqual(self.client.post('/api/kane/run', json=['bad'], headers=self.headers).status_code, 400)
            start.assert_not_called()
            response = self.client.post('/api/kane/run', json={}, headers=self.headers)
            self.assertEqual(response.status_code, 200)
            start.assert_called_once_with('http://127.0.0.1:5000', TEST_PATH, True)

    def test_reject_arbitrary_urls_files_and_wrong_types(self):
        for url in ['https://example.com', 'http://127.0.0.1:5000/private',
                    'http://user:secret@127.0.0.1:5000', 'http://127.0.0.1:5000/?key=secret',
                    'http://127.0.0.1:22', 'http://localhost:99999', 'http://localhost:5000/#x', 123]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                validate_request(url, TEST_PATH, True)
        for path in ['app.py', '../private.md', 'C:/private.md', None]:
            with self.assertRaises(ValueError):
                validate_request('http://127.0.0.1:5000', path, True)
        with self.assertRaises(ValueError):
            validate_request('http://localhost:5000', TEST_PATH, 'false')

    def test_screenshot_endpoint_never_accepts_a_file_path(self):
        for name in ['app.py', '.env', str(self.root / 'shop.sqlite3')]:
            self.assertEqual(self.client.get('/api/kane/screenshot', query_string={'file': name}).status_code, 404)
        self.assertEqual(self.client.get('/api/kane/screenshot').status_code, 404)

    def test_verified_image_uses_matching_opaque_reference(self):
        from buildbreak.evidence_images import Screenshot
        self.session.screenshot = Screenshot(b'png-fixture', 'image/png', 1, 'fixture', '0' * 64)
        with patch.object(kane_live, '_ACTIVE_SESSION', self.session):
            self.assertEqual(self.client.get('/api/kane/screenshot?session=wrong').status_code, 404)
            response = self.client.get('/api/kane/screenshot?session=' + self.session.id)
            self.assertEqual(response.data, b'png-fixture')
            self.assertEqual(response.headers['X-Content-Type-Options'], 'nosniff')

    def test_missing_cli_is_an_error_never_a_simulated_pass(self):
        listener = self.session.add_listener()
        with patch.object(kane_live, 'resolve_kane_executable', side_effect=RuntimeError('secret-private-path')):
            self.session.run()
        self.assertEqual(self.session.status, 'error')
        self.assertEqual(self.session.result, 'infrastructure_error')
        self.assertIsNotNone(self.session.finished_at)
        self.assertIsNone(self.session.screenshot)
        events = self.drain(listener)
        self.assertNotIn('secret-private-path', json.dumps(events))
        self.assertNotIn('passed', [e.get('status') for e in events])

    def test_only_verified_runner_verdict_can_finish_session(self):
        for result, status in [('passed', 'passed'), ('verification_failed', 'failed'), ('infrastructure_error', 'error')]:
            with self.subTest(result=result):
                session = LiveKaneSession('http://127.0.0.1:5000')
                run = dict(result=result, evidence_id=None, pack_hash=None, test_hash='0' * 64)
                with patch.object(kane_live, 'ROOT', self.root), \
                     patch.object(kane_live, 'resolve_kane_executable', return_value='fixture-cli'), \
                     patch('buildbreak.battle_runner.run_kane', return_value=run) as runner, \
                     patch('buildbreak.evidence_images.screenshot_for', return_value=None):
                    source = self.root / TEST_PATH
                    source.parent.mkdir(parents=True, exist_ok=True)
                    source.write_text('offline fixture')
                    session.run()
                self.assertEqual(session.status, status)
                self.assertTrue(callable(runner.call_args.kwargs['on_line']))
                self.assertNotEqual(runner.call_args.args[0], self.root)
                self.assertIsNone(session.latest_screenshot)

    def test_summary_and_exit_alone_cannot_publish_a_pass_or_raw_data(self):
        listener = self.session.add_listener()
        self.session.handle_line('Cookie: secret-token C:/private/path')
        for event in [dict(type='test_md_summary', overall_status='passed', secret='private'),
                      dict(type='run_end', screenshot_path='C:/private.png'),
                      dict(type='step_end', summary='private'),
                      dict(type='test_md_step_start', step_index=1, heading='secret'),
                      dict(type='test_md_step_end', step_index=1, status='passed', secret='cookie')]:
            self.session.handle_line(json.dumps(event))
        self.assertEqual(self.session.status, 'running')
        data = json.dumps(self.drain(listener))
        for secret in ['private', 'secret', 'cookie', 'C:/']:
            self.assertNotIn(secret, data)
        self.assertIn('step_start', data)

    def test_snapshot_is_copied_and_completed_stream_closes(self):
        self.session.steps.append(dict(index=1, status='passed'))
        listener = self.session.add_listener()
        self.session.steps[0]['status'] = 'failed'
        self.assertEqual(listener.get_nowait()['steps'][0]['status'], 'passed')
        self.session.remove_listener(listener)
        self.session.status = 'error'
        with patch.object(kane_live, '_ACTIVE_SESSION', self.session):
            response = self.client.get('/api/kane/stream')
            self.assertIn(b'"status": "error"', response.data)
            response.close()
        self.assertEqual(self.session.listeners, [])

    def test_parallel_launch_is_rejected_without_starting_a_thread(self):
        with patch.object(kane_live, '_ACTIVE_SESSION', self.session), \
             patch.object(kane_live.threading, 'Thread') as thread:
            with self.assertRaises(ValueError):
                kane_live.start_live_session('http://127.0.0.1:5000')
            thread.assert_not_called()

    def test_streaming_verdict_still_requires_a_sealed_evidence_pack(self):
        from buildbreak.battle_runner import run_kane
        test = self.root / TEST_PATH
        test.parent.mkdir(parents=True)
        test.write_text('offline test fixture')
        output = '\n'.join(json.dumps(event) for event in [
            dict(type='test_md_summary', overall_status='passed', steps=dict(total=5, passed=5)),
            dict(type='test_md_done', overall_status='passed')])
        completed = subprocess.CompletedProcess([], 0, output, None)
        callback = lambda line: None
        with patch('buildbreak.battle_runner.stream_run', return_value=completed) as stream, \
             patch('buildbreak.battle_runner.find_evidence_pack', return_value=(None, None, None)):
            result = run_kane(self.root, self.root / 'run', 'http://127.0.0.1:5000',
                              'fixture', 'fixture-cli', on_line=callback)
        self.assertEqual(result['result'], 'infrastructure_error')
        self.assertIs(stream.call_args.kwargs['on_line'], callback)

    def test_streaming_process_strips_keys_and_honors_deadline(self):
        lines = []
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'fixture', 'GOOGLE_API_KEY': 'fixture'}):
            with (self.root / 'stderr.txt').open('w') as errors:
                result = stream_run([sys.executable, '-c',
                    "import os; print('clean' if not any(k in os.environ for k in ['GEMINI_API_KEY','GOOGLE_API_KEY']) else 'leaked')"],
                    cwd=self.root, timeout=10, stderr=errors, on_line=lines.append)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(lines, ['clean\n'])
                with self.assertRaises(subprocess.TimeoutExpired):
                    stream_run([sys.executable, '-c', 'import time; time.sleep(30)'], cwd=self.root,
                               timeout=0.2, stderr=errors, on_line=lines.append)

    @staticmethod
    def drain(listener):
        events = []
        while True:
            try: events.append(listener.get_nowait())
            except queue.Empty: return events
