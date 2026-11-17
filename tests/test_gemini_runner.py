"""Orchestration fixtures are synthetic, never reported as live agent battles."""
import json
import io
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import buildbreak.battle_runner as runner
from buildbreak.gemini_breaker import GeminiError
from buildbreak.fault_validator import InvalidFault
from tests.test_fault_validator import proposal


class GeminiRunnerTests(unittest.TestCase):
    def setUp(self):
        (runner.ROOT / 'instance').mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=runner.ROOT / 'instance')
        self.private = Path(self.temp.name).resolve()
        self.workspace = self.private / 'workspace'
        self.manifest = runner.snapshot(runner.ROOT, self.workspace)

    def tearDown(self):
        self.temp.cleanup()

    def test_invalid_proposals_retry_from_unchanged_source_then_accept(self):
        original = (self.workspace / 'app.py').read_text(encoding='utf-8')
        messages = []
        with patch('buildbreak.battle_runner.propose_fault', return_value=proposal()) as provider, \
                patch('buildbreak.battle_runner.validate_fault', side_effect=[InvalidFault('bad'), 'valid candidate']):
            selection, candidate = runner.select_gemini_fault(
                self.workspace, self.private, sys.executable, self.manifest,
                lambda *message: messages.append(message))
        self.assertEqual(candidate, 'valid candidate')
        self.assertEqual(selection['producer'], 'gemini')
        self.assertEqual(selection['attempt'], 2)
        self.assertFalse(selection['fallback'])
        self.assertEqual([message[0] for message in messages], ['fault_rejected', 'fault_accepted'])
        self.assertEqual(messages[-1][1],
                         'Gemini proposals requested: 2; rejected by Arena: 1; accepted: 1.')
        self.assertEqual([call.args[0] for call in provider.call_args_list], [original, original])
        self.assertEqual((self.workspace / 'app.py').read_text(encoding='utf-8'), original)

    def test_validator_rejection_hint_reaches_next_prompt_without_test_or_expected_values(self):
        reason = 'Edit must stay inside one pricing or cart-quantity family.'
        hint = 'Propose a different fault, preferably from the other family.'
        with patch('buildbreak.gemini_breaker.generate_json', return_value=proposal()) as generate, \
                patch('buildbreak.battle_runner.validate_fault', side_effect=[InvalidFault(reason), 'candidate']):
            runner.select_gemini_fault(self.workspace, self.private, sys.executable,
                                       self.manifest, lambda *args: None)
        first, second = [call.args[0] for call in generate.call_args_list]
        feedback = second.split('PREVIOUS VALIDATION: ', 1)[1].split('\nAPP:\n', 1)[0]
        self.assertNotIn(hint, first)
        self.assertEqual(feedback, reason + ' ' + hint)
        self.assertNotIn('CheckoutConsistency', feedback)
        self.assertNotIn('4497', feedback)
        self.assertNotIn('4047', feedback)

    def test_accepted_event_counts_actual_proposals_and_rejections(self):
        for rejected in (0, 2):
            with self.subTest(rejected=rejected):
                messages = []
                with patch('buildbreak.battle_runner.propose_fault', return_value=proposal()) as provider, \
                        patch('buildbreak.battle_runner.validate_fault',
                              side_effect=[InvalidFault('invalid')] * rejected + ['candidate']):
                    runner.select_gemini_fault(self.workspace, self.private, sys.executable,
                                               self.manifest, lambda *args: messages.append(args))
                self.assertEqual(provider.call_count, rejected + 1)
                self.assertEqual([kind for kind, _ in messages],
                                 ['fault_rejected'] * rejected + ['fault_accepted'])
                self.assertEqual(messages[-1][1], f'Gemini proposals requested: {rejected + 1}; '
                                 f'rejected by Arena: {rejected}; accepted: 1.')

    def test_default_breaker_checks_gemini_configuration_before_using_kane(self):
        with patch('buildbreak.battle_runner.gemini_configuration', side_effect=GeminiError('missing')) as setup, \
                patch('buildbreak.battle_runner.executable') as executable, \
                patch('buildbreak.battle_runner.run_kane') as kane:
            with self.assertRaisesRegex(GeminiError, 'missing'):
                runner.run_battle(self.workspace)
        setup.assert_called_once_with()
        executable.assert_not_called()
        kane.assert_not_called()

    def test_cli_defaults_to_gemini_and_missing_key_exits_with_offline_tip(self):
        from contextlib import redirect_stderr
        output = io.StringIO()
        with patch.dict(os.environ, {}, clear=True), \
                patch('sys.argv', ['battle_runner.py']), \
                patch('buildbreak.battle_runner.run_battle', wraps=runner.run_battle) as battle, \
                patch('buildbreak.battle_runner.executable') as executable, redirect_stderr(output):
            with self.assertRaises(SystemExit) as stopped:
                runner.main()
        self.assertEqual(stopped.exception.code, 1)
        self.assertEqual(battle.call_args.kwargs['breaker'], 'gemini')
        self.assertIn('GEMINI_API_KEY is not configured in this process.', output.getvalue())
        self.assertIn('run with --breaker cached --cached-fault <file>, '
                      'or --breaker scripted for an offline demo.', output.getvalue())
        executable.assert_not_called()

    def test_three_api_errors_fall_back_with_honest_attribution(self):
        with patch('buildbreak.battle_runner.propose_fault', side_effect=GeminiError('HTTP 429')) as provider, \
                patch('buildbreak.battle_runner.time.sleep') as wait, \
                patch('buildbreak.battle_runner.validate_fault', return_value='validated fallback') as validator:
            selection, source = runner.select_gemini_fault(
                self.workspace, self.private, sys.executable, self.manifest, lambda *args: None)
        self.assertEqual(provider.call_count, 3)
        self.assertEqual(validator.call_count, 1)
        self.assertEqual(source, 'validated fallback')
        self.assertEqual(selection['producer'], 'controlled-fallback')
        self.assertTrue(selection['fallback'])
        self.assertEqual(len(selection['rejected_attempts']), 3)
        self.assertTrue(all(attempt['kind'] == 'api_error' for attempt in selection['rejected_attempts']))
        self.assertEqual([call.args[0] for call in wait.call_args_list], [2, 4])

    def test_permanent_api_error_is_not_retried(self):
        error = GeminiError('HTTP 403', kind='http_error', status=403, retryable=False)
        with patch('buildbreak.battle_runner.propose_fault', side_effect=error) as provider, \
                patch('buildbreak.battle_runner.time.sleep') as wait, \
                patch('buildbreak.battle_runner.validate_fault', return_value='validated fallback'):
            selection, _ = runner.select_gemini_fault(
                self.workspace, self.private, sys.executable, self.manifest, lambda *args: None)
        self.assertTrue(selection['fallback'])
        self.assertEqual(provider.call_count, 1)
        wait.assert_not_called()
        self.assertEqual(selection['rejected_attempts'][0]['http_status'], 403)

    def exercise(self, statuses, fail_repairs=False, fallback=False):
        source = (self.workspace / 'app.py').read_text(encoding='utf-8')
        old, new = runner.FAULTS['order-total']
        broken = source.replace(old, new)
        selection = {'producer': 'controlled-fallback' if fallback else 'gemini',
                     'fallback': fallback, 'patch': proposal()}
        def result(status):
            return dict(result=status, evidence_id='synthetic-fixture', pack_hash='fixture',
                        test_hash=self.manifest[runner.TEST.as_posix()], duration=0,
                        failure='Fixture: saved order is 4497 cents, expected 4047.')
        def builder(codex, workspace, artifacts, failure, previous_test_failure=''):
            # Exercise the actual Builder context creation, mocking only its Codex call.
            def reply(codex, context, artifacts, prompt, schema, timeout=300):
                self.assertEqual([p.name for p in context.iterdir()], ['app.py'])
                self.assertEqual((context / 'app.py').read_text(encoding='utf-8'), broken)
                self.assertNotIn('Local mutation test fixture', prompt)
                self.assertIn('Fixture: saved order', prompt)
                self.assertNotIn('Gemini', prompt)
                artifacts.mkdir()
                return {'app_source': broken if fail_repairs else source, 'explanation': 'fixture'}
            with patch('buildbreak.battle_runner.codex_json', side_effect=reply):
                return actual_builder_patch(codex, workspace, artifacts, failure, previous_test_failure)
        from types import SimpleNamespace
        unit_result = SimpleNamespace(stdout='fixture', stderr='', returncode=0)
        counts = dict(run=8, failures=0, errors=0, skipped=0, expected_failures=0, unexpected_successes=0)
        observations = [{'passed': True, 'actual_cents': [4497, 450, 4047]}]
        if len(statuses) > 2 or fail_repairs:
            observations += [{'passed': not fail_repairs, 'actual_cents': [4497, 450, 4497]}] * 3
        with patch('buildbreak.battle_runner.gemini_configuration', return_value=('fixture', 'gemini-test')), \
                patch('buildbreak.battle_runner.executable', return_value=sys.executable), \
                patch('buildbreak.battle_runner.Server') as server, \
                patch('buildbreak.battle_runner.command', return_value=unit_result), \
                patch('buildbreak.battle_runner.json_command', return_value=counts), \
                patch('buildbreak.battle_runner.direct_check', side_effect=observations) as direct, \
                patch('buildbreak.battle_runner.select_gemini_fault', return_value=(selection, broken)), \
                patch('buildbreak.battle_runner.run_kane', side_effect=[result(s) for s in statuses]) as kane, \
                patch('buildbreak.battle_runner.builder_patch', side_effect=builder) as repair:
            server.return_value.url = 'http://127.0.0.1:1234'
            battle = runner.run_battle(self.workspace, breaker='gemini', builder='codex')
        database = self.workspace / 'instance/arena.sqlite3'
        with runner.connect(database) as db:
            state, attempts, mode = db.execute('SELECT state,attempts,mode FROM arena_sessions WHERE id=?', (battle,)).fetchone()
            messages = [row[0] for row in db.execute('SELECT message FROM arena_events WHERE battle_id=?', (battle,))]
        self.assertEqual((self.workspace / 'app.py').read_text(encoding='utf-8'), source)
        return state, attempts, mode, messages, kane.call_count, repair.call_count, direct.call_count

    def test_success_requires_direct_check_and_kane_and_separates_builder_context(self):
        state, attempts, mode, messages, kane, builder, direct = self.exercise(
            ['passed', 'verification_failed', 'passed'])
        self.assertEqual((state, attempts, kane, builder, direct), ('completed', 1, 3, 1, 2))
        self.assertTrue(mode.startswith('gemini Breaker'))

    def test_escape_and_infrastructure_do_not_start_builder(self):
        for status, expected in [('passed', 'not_detected'), ('infrastructure_error', 'infrastructure_error')]:
            with self.subTest(status=status):
                outcome = self.exercise(['passed', status], fallback=status == 'passed')
                self.assertEqual((outcome[0], outcome[4], outcome[5]), (expected, 2, 0))
                if status == 'passed':
                    self.assertTrue(outcome[2].startswith('controlled-fallback'))
                    self.assertTrue(any('escaped' in message for message in outcome[3]))

    def test_direct_check_blocks_false_repairs_and_stops_after_three(self):
        outcome = self.exercise(['passed', 'verification_failed'], fail_repairs=True)
        self.assertEqual((outcome[0], outcome[1], outcome[4], outcome[5], outcome[6]),
                         ('needs_human', 3, 2, 3, 4))

    def test_missing_gemini_setup_stops_before_any_kane_call(self):
        with patch('buildbreak.battle_runner.gemini_configuration', side_effect=GeminiError('missing')), \
                patch('buildbreak.battle_runner.run_kane') as kane:
            with self.assertRaises(GeminiError):
                runner.run_battle(self.workspace, breaker='gemini')
        kane.assert_not_called()

    def test_missing_path_uses_private_cli_configuration(self):
        settings = self.private / 'instance/cli-paths.json'
        settings.parent.mkdir()
        settings.write_text(json.dumps({'codex': sys.executable}), encoding='utf-8')
        with patch('buildbreak.battle_runner.ROOT', self.private), patch('buildbreak.battle_runner.shutil.which', return_value=None):
            self.assertEqual(runner.executable('codex'), sys.executable)
            settings.write_text(json.dumps({'codex': str(self.private / 'missing.exe')}), encoding='utf-8')
            with self.assertRaisesRegex(RuntimeError, 'Configured codex path is missing'):
                runner.executable('codex')
            settings.write_text('[]', encoding='utf-8')
            with self.assertRaisesRegex(RuntimeError, 'Invalid local'):
                runner.executable('codex')


actual_builder_patch = runner.builder_patch

if __name__ == '__main__':
    unittest.main()
