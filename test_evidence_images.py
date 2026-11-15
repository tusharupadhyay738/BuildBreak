"""Synthetic one-pixel fixtures test image boundaries, never live Kane results."""
import base64
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from app import create_app
from battle_runner import ROOT, connect, record_run
from evidence_images import screenshot_for

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==')


class EvidenceImageTests(unittest.TestCase):
    def setUp(self):
        (ROOT / 'instance').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=ROOT / 'instance')
        self.root = Path(self.temp.name).resolve()
        self.artifacts = self.root / 'battles'
        self.battle = '20261115T000000-aaaaaaaa'
        self.evidence = '11111111-1111-4111-8111-111111111111'
        self.run = dict(phase='before', attempt=0, result='verification_failed',
                        evidence_id=self.evidence, pack_hash='', test_hash='a' * 64, duration=0)
        self.pack = self.artifacts / self.battle / 'before-0/run.evidence'
        self.pack.parent.mkdir(parents=True)
        self.database = self.root / 'arena.sqlite3'

    def tearDown(self):
        self.temp.cleanup()

    def write_pack(self, *, status='failed', evidence=None, test_hash=None, failed_image=True,
                   failure=True, invalid_image=False, traversal=False):
        with zipfile.ZipFile(self.pack, 'w') as archive:
            archive.writestr('run.yaml', 'run_id: ' + (evidence or self.evidence) + '\n')
            archive.writestr('tests/fixture/result.yaml', 'status: ' + status + '\ndefinition:\n  sha256: sha256:' + (test_hash or self.run['test_hash']) + '\n')
            archive.writestr('tests/fixture/steps/1-0-1/screenshot.png', PNG)
            if failure:
                archive.writestr('tests/fixture/steps/2-0-2/failure.yaml', 'status: failed\n')
            if failed_image:
                archive.writestr('tests/fixture/steps/2-0-2/screenshot.png', b'<script>no</script>' if invalid_image else PNG)
            if traversal:
                archive.writestr('tests/fixture/steps/3-0-3/../../private.png', PNG)
            archive.writestr('tests/fixture/logs/network.ndjson', 'SYNTHETIC_PRIVATE_COOKIE')
            archive.writestr('tests/fixture/logs/1-actions.ndjson', '\n'.join(json.dumps(item) for item in [
                dict(action_type='analyze', action_params={'key': 'order_summary_discount_check'}, output_value='$6.75'),
                dict(action_type='analyze', action_params={'key': 'cookie'}, output_value='SYNTHETIC_PRIVATE_COOKIE'),
                dict(action_type='analyze', action_params={'key': 'order_summary_total_check'}, output_value='private text'),
            ]))
        self.run['pack_hash'] = hashlib.sha256(self.pack.read_bytes()).hexdigest()

    def test_selects_failed_checkpoint_and_last_passed_viewport(self):
        self.write_pack()
        image = screenshot_for(self.artifacts, self.battle, self.run)
        self.assertEqual((image.content, image.ordinal, image.checkpoint), (PNG, 2, 'Failure checkpoint'))
        self.assertEqual(image.observations, (('Cart discount', '$6.75'),))
        self.run['result'] = 'passed'
        self.write_pack(status='passed', failure=False)
        image = screenshot_for(self.artifacts, self.battle, self.run)
        self.assertEqual((image.ordinal, image.checkpoint), (2, 'Last recorded viewport'))

    def test_failure_never_substitutes_another_steps_screenshot(self):
        self.write_pack(failed_image=False)
        self.assertIsNone(screenshot_for(self.artifacts, self.battle, self.run))

    def test_saved_currency_is_preferred_without_exposing_unknown_log_data(self):
        self.run['result'] = 'passed'
        self.write_pack(status='passed', failure=False)
        with zipfile.ZipFile(self.pack, 'a') as archive:
            archive.writestr('tests/fixture/logs/2-actions.ndjson', '\n'.join(json.dumps(item) for item in [
                dict(action_type='analyze', action_params={'key': 'confirmation_total_check'}, output_value='$40.47'),
                dict(action_type='analyze', action_params={'key': 'confirmation_discount_check'}, output_value='private text'),
                dict(action_type='analyze', action_params={'key': 'unexpected_cookie'}, output_value='$99.99'),
            ]))
        self.run['pack_hash'] = hashlib.sha256(self.pack.read_bytes()).hexdigest()
        image = screenshot_for(self.artifacts, self.battle, self.run)
        self.assertEqual(image.observations, (('Saved total', '$40.47'),))

    def test_duplicate_archive_names_are_rejected(self):
        import warnings
        self.write_pack()
        with warnings.catch_warnings(), zipfile.ZipFile(self.pack, 'a') as archive:
            warnings.simplefilter('ignore', UserWarning)
            archive.writestr('run.yaml', 'run_id: ' + self.evidence)
        self.run['pack_hash'] = hashlib.sha256(self.pack.read_bytes()).hexdigest()
        self.assertIsNone(screenshot_for(self.artifacts, self.battle, self.run))

    def test_wrong_identity_hash_verdict_and_infrastructure_have_no_preview(self):
        for changes in ({'evidence': '22222222-2222-4222-8222-222222222222'},
                        {'test_hash': 'b' * 64}, {'status': 'passed'}, {'invalid_image': True}):
            with self.subTest(changes=changes):
                self.write_pack(**changes)
                self.assertIsNone(screenshot_for(self.artifacts, self.battle, self.run))
        self.write_pack()
        for changes in ({'pack_hash': 'b' * 64}, {'result': 'infrastructure_error'},
                        {'evidence_id': 'missing'}, {'attempt': 99}, {'phase': '../before'}):
            self.assertIsNone(screenshot_for(self.artifacts, self.battle, {**self.run, **changes}))
        self.pack.write_bytes(self.pack.read_bytes() + b'tampered')
        self.assertIsNone(screenshot_for(self.artifacts, self.battle, self.run))

    def test_traversal_missing_packs_and_member_limits_are_unavailable(self):
        self.write_pack(traversal=True)
        self.assertIsNone(screenshot_for(self.artifacts, '../' + self.battle, self.run))
        self.assertIsNone(screenshot_for(self.root / 'missing', self.battle, self.run))
        with patch('evidence_images.MAX_IMAGE_BYTES', 1):
            self.assertIsNone(screenshot_for(self.artifacts, self.battle, self.run))
        with patch('evidence_images.MAX_PACK_BYTES', 1):
            self.assertIsNone(screenshot_for(self.artifacts, self.battle, self.run))

    def test_linked_root_is_rejected_before_reading(self):
        self.write_pack()
        with patch.object(Path, 'is_symlink', return_value=True):
            self.assertIsNone(screenshot_for(self.artifacts, self.battle, self.run))

    def client(self):
        with connect(self.database) as db:
            db.execute('INSERT INTO arena_sessions VALUES (?,?,?,?,?,?)',
                       (self.battle, '2026-11-15T00:00:00+00:00', 'repairing', 'synthetic snapshot', 'synthetic fixture', 0))
        record_run(self.database, self.battle, 'before', 0, self.run)
        app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'),
                          'ARENA_DATABASE': str(self.database), 'ARENA_ARTIFACTS': str(self.artifacts)})
        return app.test_client()

    def test_dashboard_serves_only_bound_image_bytes_and_keeps_logs_private(self):
        self.write_pack()
        client = self.client()
        page = client.get('/arena').data
        url = '/arena/evidence/' + self.battle + '/before/0/screenshot'
        self.assertIn(url.encode(), page)
        self.assertIn(b'Failure checkpoint', page)
        self.assertIn(b'Cart discount', page)
        self.assertIn(b'$6.75', page)
        self.assertIn(b'Waiting for verification', page)
        self.assertNotIn(str(self.root).encode(), page)
        self.assertNotIn(b'SYNTHETIC_PRIVATE_COOKIE', page)
        response = client.get(url)
        self.assertEqual((response.status_code, response.mimetype, response.data), (200, 'image/png', PNG))
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        self.assertEqual(response.headers['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(client.post(url).status_code, 405)
        for target in (url.replace('/0/', '/99/'), url.replace('/before/', '/unknown/'),
                       '/arena/evidence/' + self.battle + '/before/0/run.evidence'):
            self.assertEqual(client.get(target).status_code, 404)
        self.pack.write_bytes(b'tampered')
        self.assertEqual(client.get(url).status_code, 404)
        page = client.get('/arena/live').data
        self.assertIn(b'Screenshot unavailable', page)
        self.assertIn(b'Defect detected', page)
