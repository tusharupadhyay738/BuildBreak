"""Offline fixtures only; no Kane credits or real user browser is involved."""
import base64
import json
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest.mock import Mock, patch

from buildbreak.live_browser import LiveBrowser, MAX_FRAME
from buildbreak.battle_runner import run_kane, TEST
from buildbreak import kane_live
from tests.test_kane_live_endpoints import LiveKaneEndpointTests


class BrowserFeedTests(unittest.TestCase):
    def setUp(self):
        self.browser = LiveBrowser(Path('unused-fixture'), 'http://127.0.0.1:5000', True, Mock())
        self.browser.endpoint = 'http://127.0.0.1:9222'
        self.page = dict(type='page', url='http://127.0.0.1:5000/confirmation/1',
                         webSocketDebuggerUrl='ws://127.0.0.1:9222/devtools/page/ABC-123')

    def test_only_owned_demo_page_can_be_captured(self):
        self.assertTrue(self.browser.allowed_page(self.page))
        for changes in [dict(url='https://accounts.google.com'), dict(type='service_worker'),
                        dict(url='http://127.0.0.1:5001'), dict(url='http://localhost:5000'),
                        dict(webSocketDebuggerUrl='ws://127.0.0.1:9223/devtools/page/ABC'),
                        dict(webSocketDebuggerUrl='ws://example.com:9222/devtools/page/ABC'),
                        dict(webSocketDebuggerUrl='ws://127.0.0.1:9222/private'),
                        dict(webSocketDebuggerUrl='ws://user:pass@127.0.0.1:9222/devtools/page/ABC')]:
            with self.subTest(changes=changes):
                self.assertFalse(self.browser.allowed_page(dict(self.page, **changes)))

    def capture_once(self, responses):
        connection = Mock()
        connection.call.side_effect = responses
        self.browser.stopped.wait = Mock(side_effect=lambda delay: self.browser.stopped.set())
        with patch.object(self.browser, '_json', return_value=[self.page]), \
             patch('buildbreak.live_browser.CDP', return_value=connection):
            self.browser._capture()
        return connection

    def test_capture_is_read_only_and_holds_only_latest_jpeg(self):
        frame = b'\xff\xd8\xfffixture\xff\xd9'
        tree = dict(frameTree=dict(frame=dict(url=self.page['url'])))
        connection = self.capture_once([tree, dict(data=base64.b64encode(frame).decode()), tree])
        self.assertEqual(self.browser.frame, frame)
        self.assertEqual(self.browser.sequence, 1)
        self.assertEqual([c.args[0] for c in connection.call.call_args_list],
                         ['Page.getFrameTree', 'Page.captureScreenshot', 'Page.getFrameTree'])
        self.browser.on_state.assert_called_with('ready')
        connection.close.assert_called()

    def test_frame_is_discarded_if_navigation_leaves_demo_origin(self):
        tree = dict(frameTree=dict(frame=dict(url=self.page['url'])))
        changed = dict(frameTree=dict(frame=dict(url='https://private.example')))
        self.capture_once([tree, dict(data=base64.b64encode(b'\xff\xd8\xfffixture\xff\xd9').decode()), changed])
        self.assertIsNone(self.browser.frame)
        self.browser.on_state.assert_called_with('waiting')

    def test_invalid_or_oversized_frames_are_not_published(self):
        tree = dict(frameTree=dict(frame=dict(url=self.page['url'])))
        for data in ['not base64', base64.b64encode(b'not an image').decode(), 'A' * (MAX_FRAME * 2 + 1)]:
            self.browser.stopped.clear()
            self.capture_once([tree, dict(data=data), tree])
            self.assertIsNone(self.browser.frame)
            self.assertEqual(self.browser.sequence, 0)

    def test_mjpeg_has_only_image_bytes_and_stops_with_session(self):
        self.browser.frame = b'\xff\xd8\xfffixture\xff\xd9'
        self.browser.sequence = 1
        self.browser.captured_at = time.monotonic()
        stream = self.browser.frames(lambda: True)
        part = next(stream)
        self.assertTrue(part.startswith(b'--arena-frame\r\nContent-Type: image/jpeg'))
        self.assertNotIn(b'ws://', part)
        self.browser.stopped.set()
        self.assertEqual(list(stream), [])
        self.assertEqual(list(self.browser.frames(lambda: False)), [])

    def test_cleanup_targets_owned_process_and_clears_frame(self):
        process = Mock()
        self.browser.process = process
        self.browser.frame = b'fixture'
        with patch('buildbreak.process_control.stop_tree') as stop:
            self.browser.close()
            self.browser.close()
        stop.assert_called_once_with(process)
        self.assertIsNone(self.browser.frame)
        self.assertTrue(self.browser.stopped.is_set())
        self.browser.on_state.assert_called_once_with('ended')

    def test_runner_passes_only_a_loopback_cdp_endpoint(self):
        with tempfile.TemporaryDirectory(dir='.') as temporary:
            root = Path(temporary)
            (root / TEST).parent.mkdir(parents=True)
            (root / TEST).write_text('offline fixture')
            with patch('buildbreak.battle_runner.stream_run', return_value=subprocess.CompletedProcess([], 0, '', None)) as run, \
                 patch('buildbreak.battle_runner.find_evidence_pack', return_value=(None, None, None)):
                run_kane(root, root / 'run', 'http://127.0.0.1:5000', 'fixture', 'fixture-cli',
                         on_line=lambda line: None, cdp_endpoint='http://127.0.0.1:9222')
                self.assertIn('--cdp-endpoint', run.call_args.args[0])
                self.assertIn('http://127.0.0.1:9222', run.call_args.args[0])
            with self.assertRaises(ValueError):
                run_kane(root, root / 'bad-run', 'http://127.0.0.1:5000', 'fixture', 'fixture-cli',
                         cdp_endpoint='http://example.com:9222')


class LiveViewEndpointTests(LiveKaneEndpointTests):
    # Endpoint setup is shared; inherited tests are excluded by the loader below.
    def test_live_view_is_local_session_bound_and_read_only(self):
        self.assertEqual(self.client.get('/api/kane/live-view?session=missing').status_code, 404)
        self.session.browser = Mock()
        self.session.browser.frames.return_value = iter([b'--arena-frame\r\nfixture'])
        with patch.object(kane_live, '_ACTIVE_SESSION', self.session):
            url = '/api/kane/live-view?session=' + self.session.id
            self.assertEqual(self.client.get('/api/kane/live-view?session=wrong').status_code, 404)
            self.assertEqual(self.client.get(url, environ_overrides={'REMOTE_ADDR': '192.0.2.1'}).status_code, 403)
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            self.assertIn('multipart/x-mixed-replace', response.content_type)
            self.assertEqual(response.headers['Cache-Control'], 'no-store')
            self.assertIn(b'fixture', response.data)
            self.assertEqual(self.client.post(url).status_code, 405)
            self.session.status = 'passed'
            self.assertEqual(self.client.get(url).status_code, 404)


def load_tests(loader, tests, pattern):
    suite = loader.loadTestsFromTestCase(BrowserFeedTests)
    suite.addTest(LiveViewEndpointTests('test_live_view_is_local_session_bound_and_read_only'))
    return suite
