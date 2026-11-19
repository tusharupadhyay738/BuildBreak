"""Self-service offline fixtures; no uploaded code, Gemini or Kane is executed."""
import io
import json
from pathlib import Path
import sqlite3
import stat
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
import zipfile

from app import create_app
from buildbreak import kane_live
from buildbreak.battle_runner import ROOT, TEST, snapshot, run_battle, SCHEMA
from buildbreak.project_import import import_zip, load_project
from buildbreak.project_setup import BattleSession, prepare_source


def archive(files):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w') as output:
        for name, value in files.items():
            info = zipfile.ZipInfo(name)
            info.filename = name  # Preserve intentionally unsafe fixture bytes on Windows.
            output.writestr(info, value)
    stream.seek(0)
    return stream


class ProjectSetupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir='.')
        self.root = Path(self.temp.name)
        self.storage = self.root / 'projects'
        self.config = dict(TESTING=True, DATABASE=str(self.root / 'shop.sqlite3'),
            ARENA_DATABASE=str(self.root / 'arena.sqlite3'), ARENA_PROJECTS=str(self.storage),
            ARENA_SOURCES=str(self.root / 'sources.json'), ARENA_ARTIFACTS=str(self.root / 'battles'),
            ARENA_ENABLE_LIVE_KANE=True)
        self.app = create_app(self.config)
        self.client = self.app.test_client()
        self.headers = {'X-Arena-Request': '1', 'Origin': 'http://localhost'}
        self.requirements = patch('buildbreak.project_setup.prerequisites',
                                  return_value=dict(kane=True, codex=True, chrome=True, gemini=True))
        self.requirements.start()
        self.active = patch.object(kane_live, '_ACTIVE_SESSION', None)
        self.active.start()

    def tearDown(self):
        self.active.stop()
        self.requirements.stop()
        self.temp.cleanup()

    def compatible_zip(self):
        return archive({'export/app.py': (ROOT / 'app.py').read_bytes(),
                        'export/templates/shop.html': (ROOT / 'templates/shop.html').read_text().replace('BreakShop', 'Imported fixture'),
                        'export/templates/confirmation.html': (ROOT / 'templates/confirmation.html').read_bytes(),
                        'export/.env': b'fixture-secret-do-not-publish',
                        'export/node_modules/skip.js': b'fixture',
                        'export/.testmuai/tests/CheckoutConsistency_test.md': b'weakened fake test'})

    def test_import_excludes_secrets_dependencies_and_uploaded_acceptance_tests(self):
        record = import_zip(self.compatible_zip(), self.storage, ROOT)
        self.assertTrue(record['compatible'])
        self.assertEqual(record['excluded'], 3)
        folder, _ = load_project(self.storage, record['id'])
        self.assertFalse((folder / 'source/.env').exists())
        self.assertFalse((folder / 'source/.testmuai').exists())
        self.assertNotIn('fixture-secret', json.dumps(record))
        destination = self.root / 'prepared'
        prepare_source(folder, record, destination)
        self.assertEqual((destination / TEST).read_bytes(), (ROOT / TEST).read_bytes())
        self.assertIn(b'Imported fixture', (destination / 'templates/shop.html').read_bytes())

    def test_unsafe_zip_paths_duplicates_and_symlinks_are_rejected(self):
        for path in ['../outside.py', '/absolute.py', 'C:/outside.py', 'x\\outside.py', 'x/../outside.py']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                import_zip(archive({path: b'fixture'}), self.storage, ROOT)
        data = io.BytesIO()
        with zipfile.ZipFile(data, 'w') as output:
            link = zipfile.ZipInfo('link')
            link.external_attr = (stat.S_IFLNK | 0o777) << 16
            output.writestr(link, '../private')
        data.seek(0)
        with self.assertRaises(ValueError):
            import_zip(data, self.storage, ROOT)
        with self.assertRaises(ValueError):
            import_zip(archive({'app.py': b'one', 'APP.py': b'two'}), self.storage, ROOT)

    def test_react_import_is_inspection_only_and_never_claims_adapter_support(self):
        record = import_zip(archive({'src/App.tsx': b'fixture', 'package.json': json.dumps({
            'dependencies': {'react': '*'}, 'scripts': {'postinstall': 'must never run'}})}), self.storage, ROOT)
        self.assertFalse(record['compatible'])
        self.assertEqual(record['framework'], 'React / AI Studio')
        self.assertIn('not implemented', record['reason'])
        with patch('buildbreak.project_setup.start_battle') as start:
            response = self.client.post(f"/api/projects/{record['id']}/battle", headers=self.headers,
                                        json={'approved': True, 'test_sha256': 'irrelevant'})
            self.assertEqual(response.status_code, 400)
            start.assert_not_called()

    def test_modified_python_and_changed_imports_are_rejected(self):
        stream = archive({'app.py': (ROOT / 'app.py').read_text().replace('Decimal("0.10")', 'Decimal("0.05")')})
        record = import_zip(stream, self.storage, ROOT)
        self.assertFalse(record['compatible'])
        good = import_zip(self.compatible_zip(), self.storage, ROOT)
        folder, _ = load_project(self.storage, good['id'])
        (folder / 'source/app.py').write_text('print("untrusted")')
        with self.assertRaises(ValueError):
            load_project(self.storage, good['id'])

    def test_imported_jinja_execution_and_other_templates_are_never_trusted(self):
        files = {'app.py': (ROOT/'app.py').read_bytes(),
                 'templates/shop.html': (ROOT/'templates/shop.html').read_text() + '{{ dangerous_call() }}',
                 'templates/confirmation.html': (ROOT/'templates/confirmation.html').read_bytes()}
        record = import_zip(archive(files), self.storage, ROOT)
        self.assertFalse(record['compatible'])
        good = import_zip(self.compatible_zip(), self.storage, ROOT)
        folder, record = load_project(self.storage, good['id'])
        (folder/'source/templates/arena.html').write_text('{{ must_not_be_used() }}')
        destination = self.root/'safe-prepared'
        prepare_source(folder, record, destination)
        self.assertEqual((destination/'templates/arena.html').read_bytes(), (ROOT/'templates/arena.html').read_bytes())

    def test_preflight_returns_test_and_presence_only_not_keys_or_paths(self):
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'fixture-secret'}):
            response = self.client.get('/api/projects/builtin/preflight')
        self.assertEqual(response.status_code, 200)
        self.assertIn('test_sha256', response.json)
        self.assertIn('authentication', response.json)
        for value in [b'fixture-secret', str(ROOT).encode(), str(self.root).encode()]:
            self.assertNotIn(value, response.data)

    def launch_data(self):
        info = self.client.get('/api/projects/builtin/preflight').json
        return dict(approved=True, test_sha256=info['test_sha256'], breaker='scripted', show_browser=False)

    def test_bundled_seatpilot_requires_its_own_approval_and_launches_in_private_directory(self):
        url = '/api/projects/seatpilot'
        with patch('buildbreak.project_setup.shutil.which', return_value='installed'), \
             patch('buildbreak.project_setup.start_battle', return_value=SimpleNamespace(status='running')) as start:
            info = self.client.get(url + '/preflight').json
            self.assertEqual(info['project']['adapter'], 'seatpilot')
            self.assertIn('EARLY15', info['test_text'])
            data = self.launch_data()
            self.assertEqual(self.client.post(url + '/battle', json=data, headers=self.headers).status_code, 400)
            start.assert_not_called()
            data['test_sha256'] = info['test_sha256']
            self.assertEqual(self.client.post(url + '/battle', json=data, headers=self.headers).status_code, 200)
            self.assertEqual(start.call_args.kwargs['adapter_name'], 'seatpilot')
            self.assertEqual(start.call_args.args[0].parent, self.storage / 'seatpilot')

    def test_approval_local_guard_and_setup_are_required_before_launch(self):
        data = self.launch_data()
        with patch('buildbreak.project_setup.start_battle') as start:
            for change in [dict(approved=False), dict(test_sha256='wrong'), dict(breaker='arbitrary-shell')]:
                response = self.client.post('/api/projects/builtin/battle', json=dict(data, **change), headers=self.headers)
                self.assertEqual(response.status_code, 400)
            self.assertEqual(self.client.post('/api/projects/builtin/battle', json=data).status_code, 403)
            self.app.config['ARENA_ENABLE_LIVE_KANE'] = False
            self.assertEqual(self.client.post('/api/projects/builtin/battle', json=data, headers=self.headers).status_code, 400)
            start.assert_not_called()

    def test_missing_gemini_environment_never_silently_selects_scripted(self):
        with patch('buildbreak.project_setup.prerequisites', return_value=dict(kane=True,codex=True,chrome=True,gemini=False)), \
             patch('buildbreak.project_setup.start_battle') as start:
            data = dict(self.launch_data(), breaker='gemini')
            response = self.client.post('/api/projects/builtin/battle', json=data, headers=self.headers)
            self.assertEqual(response.status_code, 400)
            self.assertIn('GEMINI_API_KEY', response.json['error'])
            start.assert_not_called()

    def test_explicit_launch_uses_fixed_runner_modes_and_main_history(self):
        with patch('buildbreak.project_setup.start_battle', return_value=SimpleNamespace(status='running')) as start:
            response = self.client.post('/api/projects/builtin/battle', json=self.launch_data(), headers=self.headers)
            self.assertEqual(response.status_code, 200)
            start.assert_called_once_with(ROOT, Path(self.config['ARENA_DATABASE']),
                Path(self.config['ARENA_ARTIFACTS']), 'scripted', False)

    def test_import_endpoint_is_local_and_never_runs_cli(self):
        with patch('buildbreak.project_setup.start_battle') as start:
            self.assertEqual(self.client.post('/api/projects/import').status_code, 403)
            response = self.client.post('/api/projects/import', headers=self.headers,
                data={'project': (self.compatible_zip(), 'project.zip')})
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json['project']['compatible'])
            start.assert_not_called()

    def test_runner_callbacks_preserve_closed_loop_and_redirect_history(self):
        project = self.root / 'project'
        snapshot(ROOT, project)
        original = (project / 'app.py').read_text()
        observed, bound, phases = [], [], []
        def verify(workspace, artifacts, url, name, kane, **options):
            phases.append(artifacts.name)
            return dict(result='verification_failed' if artifacts.name=='before-0' else 'passed',
                        evidence_id='offline-fixture', pack_hash='offline-fixture', test_hash='offline-fixture',
                        duration=0, failure='Synthetic offline assertion fixture')
        def builder(cli, workspace, artifacts, failure, previous_test_failure=''):
            artifacts.mkdir(parents=True)
            return dict(app_source=original)
        with patch('buildbreak.battle_runner.executable', return_value='fixture-cli'), \
             patch('buildbreak.battle_runner.Server') as server, \
             patch('buildbreak.battle_runner.command', return_value=SimpleNamespace(stdout='fixture', stderr='', returncode=0)), \
             patch('buildbreak.battle_runner.builder_patch', side_effect=builder):
            server.return_value.url = 'http://127.0.0.1:1234'
            battle = run_battle(root=project, breaker='scripted', builder='codex',
                database=Path(self.config['ARENA_DATABASE']), artifacts_root=self.root/'outputs',
                on_battle=bound.append, on_event=lambda k,m,s: observed.append(k), verification_runner=verify)
        self.assertEqual(bound, [battle])
        self.assertEqual(phases, ['baseline-0','before-0','after-1'])
        self.assertIn('completed', observed)
        self.assertTrue((self.root/'outputs'/battle/'baseline-manifest.json').exists())
        self.assertFalse((project/'instance/arena.sqlite3').exists())
        self.assertEqual((project/'app.py').read_text(), original)

    def test_full_battle_verification_streams_owned_browser_without_changing_test(self):
        session = BattleSession(ROOT, self.root/'db', self.root/'artifacts', 'scripted', False)
        artifacts = self.root/'artifacts'/session.id/'before-0'
        artifacts.parent.mkdir(parents=True)
        result = dict(result='verification_failed',evidence_id='fixture',pack_hash='fixture',test_hash='fixture')
        with patch('buildbreak.live_browser.LiveBrowser') as browser, \
             patch('buildbreak.battle_runner.run_kane', return_value=result) as run, \
             patch('buildbreak.evidence_images.screenshot_for', return_value=None):
            browser.return_value.endpoint = 'http://127.0.0.1:9222'
            actual = session.verify(self.root, artifacts, 'http://127.0.0.1:1234', 'fixture', 'fixture-cli')
            self.assertEqual(actual, result)
            self.assertEqual(run.call_args.kwargs['cdp_endpoint'], 'http://127.0.0.1:9222')
            self.assertIs(run.call_args.kwargs['on_line'].__self__, session)
            browser.return_value.close.assert_called_once()
        self.assertEqual(session.phase, 'before')

    def test_battle_binding_exposes_only_public_reference_for_dashboard_following(self):
        session = BattleSession(ROOT, self.root/'db', self.root/'artifacts', 'scripted', False)
        listener = session.add_listener()
        listener.get_nowait()
        session.bind('20261118T000000-1234abcd')
        self.assertEqual(listener.get_nowait(), dict(type='battle', battle_id='20261118T000000-1234abcd'))
        snapshot_listener = session.add_listener()
        self.assertEqual(snapshot_listener.get_nowait()['battle_id'], '20261118T000000-1234abcd')
