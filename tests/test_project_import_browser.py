"""Browser checks for ZIP import against a real local Flask HTTP server."""
from io import BytesIO
import json
import os
from pathlib import Path
import tempfile
import threading
import time
import unittest
import zipfile
from unittest.mock import patch

from werkzeug.serving import make_server

from app import create_app
from buildbreak.battle_runner import ROOT

try:
    from playwright.sync_api import Error as PlaywrightError, expect, sync_playwright
except ImportError:
    PlaywrightError = None
    expect = None
    sync_playwright = None

if os.environ.get('ARENA_REQUIRE_BROWSER_TESTS') == '1' and sync_playwright is None:
    raise RuntimeError('Browser tests are required; install requirements-dev.txt.')


def source_zip(files):
    stream = BytesIO()
    with zipfile.ZipFile(stream, 'w') as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    return stream.getvalue()


class DelayedImport:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'] == '/api/projects/import':
            time.sleep(0.25)
        return self.app(environ, start_response)


@unittest.skipUnless(sync_playwright, 'Playwright is not installed.')
class ProjectImportBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        try:
            options = {} if os.environ.get('ARENA_TEST_BROWSER') == 'chromium' else {'channel': 'chrome'}
            cls.browser = cls.playwright.chromium.launch(**options)
        except PlaywrightError:
            cls.playwright.stop()
            if os.environ.get('ARENA_REQUIRE_BROWSER_TESTS') == '1':
                raise
            raise unittest.SkipTest('Chrome is not installed.')

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.app = create_app({
            'TESTING': True,
            'DATABASE': str(self.root / 'shop.sqlite3'),
            'ARENA_DATABASE': str(self.root / 'arena.sqlite3'),
            'ARENA_PROJECTS': str(self.root / 'projects'),
            'ARENA_ARTIFACTS': str(self.root / 'artifacts'),
            'ARENA_ENABLE_LIVE_KANE': False,
        })
        self.prerequisites = patch(
            'buildbreak.project_setup.prerequisites',
            return_value=dict(kane=False, codex=False, chrome=False, gemini=False),
        )
        self.prerequisites.start()
        self.server = make_server('127.0.0.1', 0, DelayedImport(self.app), threaded=True)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.page = self.browser.new_page()
        self.page.goto(f'http://127.0.0.1:{self.server.server_port}/arena')

    def tearDown(self):
        self.page.close()
        self.server.shutdown()
        self.thread.join(timeout=5)
        self.prerequisites.stop()
        self.temp.cleanup()

    def test_dashboard_controls_and_supported_and_unsupported_zip_imports(self):
        expect(self.page.get_by_text(
            'Showing a fictional UI demo (SAMPLE), not recorded Kane evidence. Your own battles will appear here.',
            exact=True,
        )).to_be_visible()
        expect(self.page.get_by_role('progressbar', name='Workflow inspection progress')).to_be_visible()
        expect(self.page.get_by_text('BreakShop · protected curated test', exact=True)).to_be_visible()
        expect(self.page.get_by_text('SeatPilot · protected curated test', exact=True)).to_be_visible()
        expect(self.page.locator('#project-approve')).not_to_be_checked()
        expect(self.page.locator('#live-show-browser')).to_be_checked()
        expect(self.page.get_by_role(
            'link', name='http://127.0.0.1:5000/arena', exact=True,
        )).to_be_visible()

        supported = source_zip({
            'breakshop/app.py': (ROOT / 'app.py').read_bytes(),
            'breakshop/templates/shop.html': (ROOT / 'templates/shop.html').read_bytes(),
            'breakshop/templates/confirmation.html': (ROOT / 'templates/confirmation.html').read_bytes(),
        })
        self.page.locator('#project-zip').set_input_files({
            'name': 'supported-breakshop.zip', 'mimeType': 'application/zip', 'buffer': supported,
        })
        self.page.locator('#project-import').click()
        expect(self.page.locator('#project-status')).to_have_text(
            'Importing source only; no project code or install scripts are being run...'
        )
        expect(self.page.locator('#project-status')).to_contain_text('Import complete. Runnable adapter: BreakShop.')
        expect(self.page.locator('#project-test-origin')).to_have_text(
            'Protected curated demo test; review and explicitly approve before launch.'
        )
        expect(self.page.locator('#project-approve')).not_to_be_checked()
        expect(self.page.locator('#project-start')).to_be_disabled()

        unsupported = source_zip({
            'package.json': json.dumps({'dependencies': {'react': '*'}}).encode(),
            'src/App.tsx': b'export default function App() { return null; }',
        })
        self.page.locator('#project-zip').set_input_files({
            'name': 'inspection-only.zip', 'mimeType': 'application/zip', 'buffer': unsupported,
        })
        self.page.locator('#project-import').click()
        expect(self.page.locator('#project-status')).to_contain_text(
            'Import complete. Inspection only: no runnable adapter.'
        )
        expect(self.page.locator('#project-start')).to_be_disabled()
        expect(self.page.locator('#project-approve')).not_to_be_checked()

        self.page.route('**/api/projects/import', lambda route: route.abort())
        self.page.locator('#project-zip').set_input_files({
            'name': 'preview-only.zip', 'mimeType': 'application/zip', 'buffer': unsupported,
        })
        self.page.locator('#project-import').click()
        expect(self.page.locator('#project-status')).to_contain_text(
            "Arena's Flask API is unavailable. Open http://127.0.0.1:5000/arena and try again."
        )


if __name__ == '__main__':
    unittest.main()
