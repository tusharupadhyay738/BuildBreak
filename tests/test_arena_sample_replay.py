from pathlib import Path
import os
import tempfile
import unittest

from app import create_app
from buildbreak.battle_history import save_details
from buildbreak.battle_runner import connect, record_run

try:
    from playwright.sync_api import Error as PlaywrightError, expect, sync_playwright
except ImportError:
    PlaywrightError = None
    expect = None
    sync_playwright = None

if os.environ.get('ARENA_REQUIRE_BROWSER_TESTS') == '1' and sync_playwright is None:
    raise RuntimeError('Browser tests are required; install requirements-dev.txt.')


@unittest.skipUnless(sync_playwright, 'Playwright is not installed.')
class ArenaSampleReplayTests(unittest.TestCase):
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
        self.database = self.root / 'arena.sqlite3'
        self.app = create_app({
            'TESTING': True,
            'DATABASE': str(self.root / 'shop.sqlite3'),
            'ARENA_DATABASE': str(self.database),
            'ARENA_PROJECTS': str(self.root / 'projects'),
            'ARENA_ARTIFACTS': str(self.root / 'artifacts'),
            'ARENA_ENABLE_LIVE_KANE': False,
        })
        self.client = self.app.test_client()
        self.page = self.browser.new_page()

        def serve_local_page(route):
            if not route.request.url.startswith('http://localhost/') or route.request.method != 'GET':
                return route.abort()
            with self.client.get(route.request.url.removeprefix('http://localhost')) as response:
                route.fulfill(status=response.status_code, content_type=response.content_type,
                              body=response.get_data())

        self.page.route('**/*', serve_local_page)

    def tearDown(self):
        self.page.close()
        self.temp.cleanup()

    def test_empty_database_shows_sample_replay_and_banner(self):
        self.page.goto('http://localhost/arena')

        expect(self.page.get_by_text(
            'Showing a fictional UI demo (SAMPLE), not recorded Kane evidence. Your own battles will appear here.',
            exact=True,
        )).to_be_visible()
        expect(self.page.get_by_text(
            'Checkout order total renders NaN when tax rate is omitted',
            exact=True,
        )).to_be_visible()
        expect(self.page.get_by_text(
            'SAMPLE replay · not included in real battle counts',
            exact=True,
        )).to_be_visible()
        expect(self.page.locator('#battle-filter-bar [data-outcome-filter="all"]')).to_contain_text('0')

    def recorded_payload(self):
        # Synthetic archive record for UI tests, not live agent evidence.
        with connect(self.database) as db:
            db.execute('INSERT INTO arena_sessions VALUES (?,?,?,?,?,?)',
                       ('fixture-real', '2026-11-17T10:00:00+00:00', 'completed',
                        'fixture-head', 'fixture', 1))
            save_details(db, 'fixture-real', requested='gemini', producer='gemini',
                         source='live', validated=True, family='pricing',
                         invariant='saved_checkout_amounts', max_attempts=3)
        for phase, result in [('baseline', 'passed'), ('before', 'verification_failed'),
                              ('after', 'passed')]:
            record_run(self.database, 'fixture-real', phase, int(phase == 'after'),
                       dict(result=result, evidence_id='synthetic', pack_hash='fixture',
                            test_hash='fixture', duration=0))
        return self.client.get('/arena/data').get_json()

    def test_real_record_replaces_sample_and_counts(self):
        self.page.goto('http://localhost/arena')
        payload = self.recorded_payload()
        self.page.evaluate(
            "(payload) => document.dispatchEvent(new CustomEvent('arena:archive-update', {detail: payload}))",
            payload,
        )

        expect(self.page.get_by_text(
            'Showing a fictional UI demo (SAMPLE), not recorded Kane evidence. Your own battles will appear here.',
            exact=True,
        )).to_have_count(0)
        expect(self.page.locator('#history')).to_contain_text('fixture-real')
        expect(self.page.get_by_text('Showing 1 of 1 battles (All)', exact=True)).to_be_visible()

    def test_latest_archive_update_waits_for_setup_focus_then_applies(self):
        self.page.goto('http://localhost/arena')
        self.page.locator('#project-approve').focus()
        payload = self.recorded_payload()
        self.page.evaluate('''(payload) => {
            document.dispatchEvent(new CustomEvent('arena:archive-update', {detail: payload}));
            const latest = structuredClone(payload);
            latest.battles[0].title = 'Newest fixture result';
            document.dispatchEvent(new CustomEvent('arena:archive-update', {detail: latest}));
        }''', payload)
        expect(self.page.get_by_text('Checkout order total renders NaN when tax rate is omitted', exact=True)).to_be_visible()
        self.page.locator('#project-approve').evaluate('(element) => element.blur()')
        expect(self.page.locator('#history')).to_contain_text('fixture-real')
        expect(self.page.get_by_text('Newest fixture result', exact=True).first).to_be_visible()

    def test_archive_update_waits_for_replay_then_applies_without_new_event(self):
        self.page.goto('http://localhost/arena')
        self.page.locator('[data-stage-replay]').click()
        payload = self.recorded_payload()
        self.page.evaluate(
            "(payload) => document.dispatchEvent(new CustomEvent('arena:archive-update', {detail: payload}))",
            payload,
        )
        expect(self.page.get_by_text('Checkout order total renders NaN when tax rate is omitted', exact=True)).to_be_visible()
        self.page.get_by_role('button', name='Pause replay', exact=True).click()
        expect(self.page.locator('#history')).to_contain_text('fixture-real')

    def test_setup_and_advanced_controls_remain_available(self):
        self.page.goto('http://localhost/arena')

        expect(self.page.get_by_text(
            'Ready to replay. Connect Kane CLI, Codex and a Gemini key to run live.',
            exact=True,
        )).to_be_visible()
        expect(self.page.get_by_text('Local execution', exact=True)).to_be_hidden()
        expect(self.page.get_by_text('Preview state:', exact=True)).to_be_hidden()
        expect(self.page.get_by_role('button', name='Export JSON', exact=True)).to_be_hidden()

        self.page.get_by_text('Show setup details', exact=True).click()
        expect(self.page.get_by_text('Local execution', exact=True)).to_be_visible()
        self.page.get_by_text('Advanced', exact=True).click()
        expect(self.page.get_by_text('Preview state:', exact=True)).to_be_visible()
        expect(self.page.get_by_role('button', name='Export JSON', exact=True)).to_be_visible()
        with self.page.expect_download() as download_info:
            self.page.get_by_role('button', name='Export JSON', exact=True).click()
        self.assertEqual(download_info.value.suggested_filename, 'buildbreak-arena-historical_demo.json')
        self.page.get_by_role('button', name='Data format (for developers)', exact=True).click()
        expect(self.page.get_by_role('heading', name='Data format (for developers)', exact=True)).to_be_visible()
