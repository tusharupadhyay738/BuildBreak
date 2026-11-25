"""Synthetic saved-run fixtures; no live Kane execution."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from buildbreak.coverage_gap import recheck_broken
from buildbreak.generated_suite import digest


class SavedGapTests(unittest.TestCase):
    def test_saved_detection_requires_sealed_evidence_and_approved_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            artifacts=root/'kane'
            artifacts.mkdir()
            test=root/'app/.testmuai/tests/quote_test.md'
            test.parent.mkdir(parents=True)
            test.write_bytes(b'## Step 1\nCheck quote.\n')
            sha=digest(test.read_bytes())
            (root/'receipt.json').write_text(json.dumps(dict(test_hash=sha,evidence_id='fixture')))
            (root/'kane-variables.json').write_text(json.dumps({'start_url':{'value':'http://127.0.0.1:1234'}}))
            (artifacts/'artifact-provenance.json').write_text(json.dumps(dict(timed_out=False,process_exit_code=1)))
            events=[dict(type='test_md_summary',overall_status='failed'),
                    dict(type='test_md_done',overall_status='failed'),
                    dict(type='step_event',event='assertion',passed=False)]
            (artifacts/'events.ndjson').write_text('\n'.join(map(json.dumps,events)))
            with patch('buildbreak.coverage_gap.validate_pack') as validate:
                result=recheck_broken(root,test.name,sha)
                self.assertEqual(result['result'],'verification_failed')
                validate.assert_called_once_with(artifacts/'run.evidence','fixture',sha,'failed','http://127.0.0.1:1234')
                validate.side_effect=ValueError('invalid pack')
                with self.assertRaises(ValueError):
                    recheck_broken(root,test.name,sha)
            test.write_bytes(b'changed')
            with self.assertRaises(ValueError):
                recheck_broken(root,test.name,sha)
