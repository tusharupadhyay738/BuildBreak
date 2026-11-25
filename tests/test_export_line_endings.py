import shutil
import tempfile
from pathlib import Path
import unittest

from buildbreak import seatpilot_adapter as adapter


class ExportLineEndingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=adapter.ROOT)
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def copy_frontend(self, name, line_ending=None):
        target = self.root / name
        shutil.copytree(adapter.EXAMPLE / 'frontend', target)
        if line_ending is not None:
            for path in target.rglob('*'):
                if path.is_file() and path.suffix in {'.ts', '.tsx', '.css', '.html', '.json'}:
                    data = path.read_bytes().replace(b'\r\n', b'\n').replace(b'\n', line_ending)
                    path.write_bytes(data)
        return target

    def test_lf_copy_of_frontend_is_recognized(self):
        frontend = self.copy_frontend('lf', b'\n')

        self.assertTrue(adapter.matches_export(frontend))

    def test_crlf_copy_of_frontend_is_recognized(self):
        frontend = self.copy_frontend('crlf', b'\r\n')

        self.assertTrue(adapter.matches_export(frontend))

    def test_changed_frontend_file_is_rejected(self):
        frontend = self.copy_frontend('changed')
        client = frontend / 'src/api/seatpilotClient.ts'
        client.write_bytes(client.read_bytes() + b'\n// unreviewed change\n')

        self.assertFalse(adapter.matches_export(frontend))
