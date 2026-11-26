"""Offline tests for the explicit LOCAL static-data adapter contract."""
import json
from pathlib import Path
import tempfile
import unittest

from buildbreak.site_contract import preview, read_site, save_site

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / 'examples/local-contract-museum'


class LocalContractTests(unittest.TestCase):
    def test_third_app_qualifies_as_a_data_only_local_contract(self):
        site = read_site(EXAMPLE)
        self.assertEqual(site.name, 'Museum Exhibit Price Card')
        self.assertEqual(site.data[site.field], 1800)
        test = site.test().decode('utf-8')
        self.assertIn('HTML id show-entry-price', test)
        self.assertIn('equals exactly $18.00', test)
        self.assertEqual(test.count('## Step '), 5)

    def test_only_declared_static_assets_are_snapshotted(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / 'source'
            source.mkdir()
            (source / 'arena.json').write_bytes((EXAMPLE / 'arena.json').read_bytes())
            (source / 'site').mkdir()
            for name in read_site(EXAMPLE).assets:
                target = source / 'site' / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes((EXAMPLE / 'site' / name).read_bytes())
            (source / 'run.py').write_text('raise RuntimeError("must not execute")', encoding='utf-8')
            (source / 'package.json').write_text(json.dumps({
                'scripts': {'postinstall': 'node -e "throw new Error()"'},
            }), encoding='utf-8')
            copy = Path(temporary) / 'private-copy'
            save_site(source, copy)
            self.assertTrue((copy / 'site/index.html').is_file())
            self.assertFalse((copy / 'run.py').exists())
            self.assertFalse((copy / 'package.json').exists())

    def test_contract_rejects_unlisted_paths_and_unsupported_fields(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / 'project'
            source.mkdir()
            (source / 'arena.json').write_bytes((EXAMPLE / 'arena.json').read_bytes())
            for name in read_site(EXAMPLE).assets:
                target = source / 'site' / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes((EXAMPLE / 'site' / name).read_bytes())
            spec = json.loads((source / 'arena.json').read_text(encoding='utf-8'))
            spec['assets'].append('../outside.py')
            (source / 'arena.json').write_text(json.dumps(spec), encoding='utf-8')
            with self.assertRaises(ValueError):
                read_site(source)

    def test_browser_probe_checks_healthy_and_changed_app_copy(self):
        result = preview(EXAMPLE)
        self.assertEqual(result['project'], 'Museum Exhibit Price Card')
        self.assertEqual(result['healthy'], '$18.00')
        self.assertNotEqual(result['changed'], result['healthy'])
        self.assertEqual(len(result['test_sha256']), 64)


if __name__ == '__main__':
    unittest.main()
