"""Offline ablation contract tests; agent and Kane outputs are synthetic."""
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from app import create_app
import buildbreak.battle_runner as runner
from buildbreak.battle_history import summarize
from tests.test_fault_validator import proposal


class BuilderAblationTests(unittest.TestCase):
    def setUp(self):
        (runner.ROOT / 'instance').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=runner.ROOT / 'instance')
        self.root = Path(self.temp.name).resolve()
        self.workspace = self.root / 'baseline'
        self.manifest = runner.snapshot(runner.ROOT, self.workspace)

    def tearDown(self):
        self.temp.cleanup()

    def test_prompt_omits_only_kane_feedback_keeps_requirements_and_broken_source(self):
        prompts = []
        def response(codex, context, artifacts, prompt, schema):
            self.assertEqual([p.name for p in context.iterdir()], ['app.py'])
            prompts.append(prompt)
            return {'app_source': 'fixture'}
        with patch('buildbreak.battle_runner.codex_json', side_effect=response):
            for index, omit in enumerate((False, True)):
                runner.builder_patch('fixture', self.workspace, self.root / f'prompt-{index}',
                                     'UNIQUE_SYNTHETIC_KANE_FAILURE', omit_kane_feedback=omit)
        self.assertIn('UNIQUE_SYNTHETIC_KANE_FAILURE', prompts[0])
        self.assertNotIn('UNIQUE_SYNTHETIC_KANE_FAILURE', prompts[1])
        for prompt in prompts:
            self.assertIn('$44.97', prompt)
            self.assertIn('$4.50', prompt)
            self.assertIn('$40.47', prompt)
            self.assertIn((self.workspace / 'app.py').read_text(encoding='utf-8'), prompt)

    def exercise(self, rejected=False):
        original = (self.workspace / 'app.py').read_text(encoding='utf-8')
        broken = original.replace(proposal()['old_text'], proposal()['new_text'])
        selection = dict(producer='gemini', fallback=False, patch=proposal())
        counts = dict(run=8, failures=0, errors=0, skipped=0, expected_failures=0, unexpected_successes=0)
        def verdict(status):
            return dict(result=status, evidence_id='synthetic', pack_hash='fixture',
                        test_hash=self.manifest[runner.TEST.as_posix()], duration=0,
                        failure='UNIQUE_SYNTHETIC_KANE_FAILURE')
        def response(codex, context, artifacts, prompt, schema):
            self.assertEqual([p.name for p in context.iterdir()], ['app.py'])
            self.assertEqual((context / 'app.py').read_text(encoding='utf-8'), broken)
            self.assertNotIn('UNIQUE_SYNTHETIC_KANE_FAILURE', prompt)
            self.assertNotIn(proposal()['description'], prompt)
            artifacts.mkdir()
            return dict(app_source='def broken(' if rejected else original, explanation='fixture')
        statuses = ['passed', 'verification_failed'] + ([] if rejected else ['passed'])
        with patch('buildbreak.battle_runner.gemini_configuration'), \
                patch('buildbreak.battle_runner.executable', return_value=sys.executable), \
                patch('buildbreak.battle_runner.command', return_value=SimpleNamespace(stdout='fixture', stderr='', returncode=0)), \
                patch('buildbreak.battle_runner.Server'), patch('buildbreak.battle_runner.json_command', return_value=counts), \
                patch('buildbreak.battle_runner.direct_check', return_value={'passed': True}), \
                patch('buildbreak.battle_runner.select_gemini_fault', return_value=(selection, broken)), \
                patch('buildbreak.battle_runner.run_kane', side_effect=[verdict(status) for status in statuses]) as kane, \
                patch('buildbreak.battle_runner.codex_json', side_effect=response) as codex:
            battle = runner.run_battle(self.workspace, breaker='gemini', builder='codex',
                                       max_attempts=1, omit_kane_feedback=True)
        self.assertEqual(codex.call_count, 1)
        self.assertEqual(kane.call_count, len(statuses))
        with runner.connect(self.workspace / 'instance/arena.sqlite3') as db:
            state, attempts = db.execute('SELECT state,attempts FROM arena_sessions WHERE id=?', (battle,)).fetchone()
            detail = db.execute('SELECT experiment,outcome,independently_validated FROM arena_drill_details WHERE battle_id=?', (battle,)).fetchone()
        self.assertEqual(detail, ('builder_without_kane', None, 1))
        self.assertEqual(attempts, 1)
        self.assertEqual(state, 'needs_human' if rejected else 'completed')
        app = create_app({'TESTING': True, 'DATABASE': str(self.root / 'shop.sqlite3'),
                          'ARENA_DATABASE': str(self.workspace / 'instance/arena.sqlite3')})
        self.assertIn(b'EXPERIMENT: Builder without Kane feedback', app.test_client().get('/arena/live').data)

    def test_successful_mocked_ablation_has_separate_unscored_history(self):
        self.exercise()

    def test_rejected_ablation_stops_after_exactly_one_attempt(self):
        self.exercise(rejected=True)

    def test_experiment_never_counts_even_with_stale_normal_outcome(self):
        result = summarize([{'drill': dict(experiment='builder_without_kane',
                                         independently_validated=True, outcome='caught_and_repaired')}])
        self.assertEqual((result['scored'], result['excluded']), (0, 1))

    def test_invalid_ablation_mode_stops_before_any_cli_call(self):
        with patch('buildbreak.battle_runner.executable') as cli:
            for builder, attempts in [('human', 1), ('codex', 3)]:
                with self.assertRaisesRegex(ValueError, 'exactly one'):
                    runner.run_battle(self.workspace, builder=builder, max_attempts=attempts,
                                      omit_kane_feedback=True)
            cli.assert_not_called()
