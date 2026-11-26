"""Offline fixtures for the opt-in judge workflow; no agent CLIs are launched."""
import hashlib
import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
from types import SimpleNamespace

from buildbreak.battle_runner import ROOT
from buildbreak.judge_adapters import BreakShopJudgeDriver, LocalContractJudgeDriver
from buildbreak.judge_workflow import (
    JudgeRegistry, JudgeRun, WorkflowError, execute_judge_workflow,
)
from buildbreak.site_contract import observe


class FakeDriver:
    supported = True

    def __init__(self, *, healthy_results=None, broken_result='verification_failed',
                 test_tamper=False, invalid_test=False, probe_status='changed'):
        self.test = b'locked adapter test'
        self.healthy_results = list(healthy_results or ['passed', 'passed'])
        self.broken_result = broken_result
        self.test_tamper = test_tamper
        self.invalid_test = invalid_test
        self.probe_status = probe_status
        self.next_copy = 0
        self.test_runs = 0
        self.validation_calls = 0
        self.apply_calls = 0
        self.gemini_source_seen = None
        self.gemini_test_seen = None
        self.codex_source_seen = None
        self.codex_evidence_seen = None

    def fresh_healthy_copy(self, attempt):
        self.next_copy += 1
        return {'id': 'healthy-' + str(self.next_copy), 'stage': 'healthy'}

    def copy_id(self, copy):
        return copy['id']

    def target_for(self, copy):
        suffix = copy['id'].rsplit('-', 1)[1]
        port = 14000 + int(suffix) if suffix.isdigit() else 14099
        return 'http://127.0.0.1:' + str(port)

    def test_definition(self, copy):
        return self.test

    def validate_test(self, data, copy):
        if self.invalid_test:
            return dict(target='https://outside.invalid', permitted_actions=['click'],
                        assertions=['visible total'])
        return dict(target=self.target_for(copy), permitted_actions=['navigate', 'click', 'assert_text'],
                    assertions=['Displayed total equals the adapter requirement.'])

    def test_hash(self):
        return hashlib.sha256(self.test).hexdigest()

    def run_kane(self, copy, test, expected_hash, author):
        self.test_runs += 1
        if self.test_tamper and self.test_runs == 1:
            self.test = b'tampered locked adapter test'
        if copy['stage'] == 'healthy':
            status = self.healthy_results.pop(0)
            evidence = 'healthy-evidence-' + str(self.test_runs)
        elif copy['stage'] == 'broken':
            status = self.broken_result
            evidence = 'broken-evidence'
        else:
            status = 'passed'
            evidence = 'repair-evidence'
        return dict(result=status, evidence_id=evidence, test_hash=expected_hash,
                    target_url=self.target_for(copy), failure='Expected 4047 cents; observed 4048 cents.')

    def gemini_source(self):
        return 'allowed app source'

    def preview_fault(self, proposal):
        return dict(description=proposal['description'], diff='-price = 10\\n+price = 9\\n')

    def validate_fault(self, proposal, test_hash):
        self.validation_calls += 1
        self.asserted_hash = test_hash
        return {'patch': proposal, 'test_hash': test_hash}

    def apply_fault(self, candidate):
        self.apply_calls += 1
        return {'id': 'broken-copy', 'stage': 'broken', 'candidate': candidate}

    def independent_probe(self, copy):
        return {'status': self.probe_status}

    def kane_evidence(self, result):
        return {'summary': result['failure'], 'test_hash': result['test_hash']}

    def codex_source(self, broken):
        return {'app.py': 'broken app source only'}

    def validate_repair(self, broken, repair):
        return repair

    def apply_repair(self, broken, repair):
        broken['stage'] = 'repaired'

    def independent_repair_probe(self, broken):
        return broken['stage'] == 'repaired'


class FakeKane:
    def __init__(self, driver):
        self.driver = driver
        self.author_flags = []

    def run(self, copy, test, expected_hash, author):
        self.author_flags.append(author)
        return self.driver.run_kane(copy, test, expected_hash, author)


class FakeGemini:
    def __init__(self, driver):
        self.driver = driver

    def propose(self, source, test, contract):
        self.driver.gemini_source_seen = source
        self.driver.gemini_test_seen = test
        self.driver.gemini_contract_seen = contract
        return dict(description='Change one price constant.', value=9)


class FakeCodex:
    def __init__(self, driver):
        self.driver = driver

    def repair(self, source, evidence):
        self.driver.codex_source_seen = source
        self.driver.codex_evidence_seen = evidence
        return {'replacement': 'repair from the failed assertion'}


class FakeAgents:
    def __init__(self, driver):
        self.kane = FakeKane(driver)
        self.gemini = FakeGemini(driver)
        self.codex = FakeCodex(driver)


class JudgeWorkflowTests(unittest.TestCase):
    def launch_and_decide(self, driver, decision, timeout=1):
        run = JudgeRun(adapter_id='fixture')
        agents = FakeAgents(driver)
        worker = threading.Thread(target=execute_judge_workflow,
                                  args=(run, driver, agents, timeout), daemon=True)
        worker.start()
        deadline = time.monotonic() + 2
        while run.state != 'awaiting_fault_approval' and worker.is_alive() and time.monotonic() < deadline:
            time.sleep(.005)
        if decision:
            run.decide(run.proposal_id, decision)
        worker.join(timeout=2)
        self.assertFalse(worker.is_alive(), 'workflow worker did not finish')
        return run, agents

    def test_complete_flow_qualifies_test_and_keeps_gemini_patch_from_codex(self):
        driver = FakeDriver()
        run, agents = self.launch_and_decide(driver, 'approve')
        self.assertEqual(run.state, 'completed')
        self.assertEqual(agents.kane.author_flags, [True, False, False, False])
        self.assertEqual(driver.validation_calls, 1)
        self.assertEqual(driver.apply_calls, 1)
        self.assertEqual(driver.gemini_test_seen, driver.test)
        self.assertEqual(driver.codex_source_seen, {'app.py': 'broken app source only'})
        self.assertNotIn('patch', driver.codex_source_seen)
        self.assertNotIn('healthy_source', driver.codex_source_seen)
        self.assertEqual(driver.codex_evidence_seen['summary'],
                         'Expected 4047 cents; observed 4048 cents.')

    def test_rejection_never_validates_or_applies_fault(self):
        driver = FakeDriver()
        run, _ = self.launch_and_decide(driver, 'reject')
        self.assertEqual(run.state, 'fault_rejected')
        self.assertEqual(driver.validation_calls, 0)
        self.assertEqual(driver.apply_calls, 0)

    def test_timeout_never_validates_or_applies_fault(self):
        driver = FakeDriver()
        run, _ = self.launch_and_decide(driver, None, timeout=.02)
        self.assertEqual(run.state, 'approval_timeout')
        self.assertEqual(driver.validation_calls, 0)
        self.assertEqual(driver.apply_calls, 0)

    def test_missing_operator_decision_is_not_a_approval(self):
        driver = FakeDriver()
        run, _ = self.launch_and_decide(driver, None, timeout=.02)
        self.assertNotEqual(run.state, 'completed')
        self.assertEqual(driver.apply_calls, 0)

    def test_healthy_failure_stops_before_gemini_or_fault(self):
        driver = FakeDriver(healthy_results=['verification_failed', 'passed'])
        run = JudgeRun(adapter_id='fixture')
        result = execute_judge_workflow(run, driver, FakeAgents(driver))
        self.assertEqual(result.state, 'baseline_failed')
        self.assertIsNone(driver.gemini_source_seen)
        self.assertEqual(driver.apply_calls, 0)
        self.assertEqual(driver.test_runs, 1)

    def test_test_target_validation_rejects_unsupported_target(self):
        driver = FakeDriver(invalid_test=True)
        run = JudgeRun(adapter_id='fixture')
        result = execute_judge_workflow(run, driver, FakeAgents(driver))
        self.assertEqual(result.state, 'infrastructure_error')
        self.assertEqual(driver.test_runs, 0)
        self.assertIsNone(driver.gemini_source_seen)

    def test_hash_tampering_stops_qualification(self):
        driver = FakeDriver(test_tamper=True)
        run = JudgeRun(adapter_id='fixture')
        result = execute_judge_workflow(run, driver, FakeAgents(driver))
        self.assertEqual(result.state, 'infrastructure_error')
        self.assertEqual(driver.test_runs, 1)
        self.assertIsNone(driver.gemini_source_seen)

    def test_confirmed_fault_escape_is_not_sent_to_codex(self):
        driver = FakeDriver(broken_result='passed')
        run, agents = self.launch_and_decide(driver, 'approve')
        self.assertEqual(run.state, 'escaped')
        self.assertIsNone(driver.codex_source_seen)

    def test_infrastructure_error_is_not_scored_as_caught_or_escaped(self):
        driver = FakeDriver(broken_result='infrastructure_error')
        run, agents = self.launch_and_decide(driver, 'approve')
        self.assertEqual(run.state, 'infrastructure_error')
        self.assertIsNone(driver.codex_source_seen)

    def test_independent_probe_must_confirm_fault_before_kane_runs(self):
        driver = FakeDriver(probe_status='healthy')
        run, _ = self.launch_and_decide(driver, 'approve')
        self.assertEqual(run.state, 'infrastructure_error')
        self.assertEqual(driver.test_runs, 2)

    def test_unsupported_adapter_stops_before_any_port_is_called(self):
        driver = FakeDriver()
        driver.supported = False
        run = JudgeRun(adapter_id='unknown')
        result = execute_judge_workflow(run, driver, FakeAgents(driver))
        self.assertEqual(result.state, 'unsupported')
        self.assertEqual(driver.test_runs, 0)

    def test_approval_is_bound_to_pending_proposal_and_local_registry(self):
        registry = JudgeRegistry()
        run = registry.create('fixture')
        run.state = 'awaiting_fault_approval'
        run.proposal_id = 'proposal-1'
        run.fault_description = 'Private proposal description'
        run.fault_diff = 'private diff'
        run.approval_deadline = time.monotonic() + 1
        with self.assertRaises(WorkflowError):
            registry.decide(run.id, 'stale-proposal', 'approve')
        registry.decide(run.id, 'proposal-1', 'approve')
        with self.assertRaises(WorkflowError):
            registry.decide(run.id, 'proposal-1', 'approve')
        self.assertEqual(run.decision, 'approve')
        self.assertEqual(run.state, 'fault_decision_received')
        self.assertEqual(run.public()['fault_diff'], '')
        with self.assertRaises(WorkflowError):
            registry.create('fixture')


class BreakShopWorkflowIntegrationTests(unittest.TestCase):
    def test_existing_adapter_runs_through_mocked_gate_and_real_local_validation(self):
        with tempfile.TemporaryDirectory() as temporary:
            driver = BreakShopJudgeDriver(
                'offline-breakshop', artifacts_root=Path(temporary) / 'artifacts')
            original_source = (ROOT / 'app.py').read_text(encoding='utf-8')
            proposal = {
                'file': 'app.py',
                'old_text': 'Decimal("0.10")',
                'new_text': 'Decimal("0.05")',
                'description': 'Change one pricing constant for an offline fixture.',
            }
            seen = {}

            class Kane:
                def run(self, copy, test, expected_hash, author):
                    if copy['stage'] == 'healthy':
                        result = 'passed'
                    elif copy['stage'] == 'broken':
                        result = 'verification_failed'
                    else:
                        result = 'passed'
                    seen.setdefault('author_flags', []).append(author)
                    return dict(result=result, evidence_id='synthetic-' + copy['id'],
                                test_hash=expected_hash, target_url=driver.target_for(copy),
                                failure='Synthetic Kane assertion: total should be $40.47.')

            class Gemini:
                def propose(self, source, test, contract):
                    seen['gemini_source'] = source
                    seen['gemini_test'] = test
                    return proposal

            class Codex:
                def repair(self, source, evidence):
                    seen['codex_source'] = source
                    seen['codex_evidence'] = evidence
                    return {'explanation': 'Synthetic repair fixture.', 'app_source': original_source}

            agents = SimpleNamespace(kane=Kane(), gemini=Gemini(), codex=Codex())
            run = JudgeRun(adapter_id='breakshop')
            worker = threading.Thread(target=execute_judge_workflow,
                                      args=(run, driver, agents, 2), daemon=True)
            try:
                worker.start()
                deadline = time.monotonic() + 10
                while run.state != 'awaiting_fault_approval' and worker.is_alive() and time.monotonic() < deadline:
                    time.sleep(.01)
                self.assertEqual(run.state, 'awaiting_fault_approval',
                                 (run.public(), getattr(run, 'failure_type', None),
                                  getattr(run, 'failure_reason', None)))
                self.assertEqual((driver.original_workspace / 'app.py').read_text(encoding='utf-8'),
                                 original_source)
                self.assertIn('app.py', run.fault_diff)
                run.decide(run.proposal_id, 'approve')
                worker.join(timeout=30)
                self.assertFalse(worker.is_alive(), 'offline integration workflow did not finish')
                self.assertEqual(run.state, 'completed', run.public())
                self.assertEqual(seen['author_flags'], [True, False, False, False])
                self.assertEqual(seen['gemini_test'], driver.test_bytes)
                self.assertEqual(set(seen['codex_source']), {'app.py'})
                self.assertIn('Decimal("0.05")', seen['codex_source']['app.py'])
                self.assertNotIn('Gemini', seen['codex_source']['app.py'])
                self.assertEqual(seen['codex_evidence']['summary'],
                                 'Synthetic Kane assertion: total should be $40.47.')
            finally:
                if worker.is_alive():
                    worker.join(timeout=30)
                driver.close()


class LocalContractWorkflowIntegrationTests(unittest.TestCase):
    def test_third_app_completes_flow_with_real_local_browser_and_mocked_agents(self):
        example = ROOT / 'examples/local-contract-museum'
        with tempfile.TemporaryDirectory() as temporary:
            driver = LocalContractJudgeDriver(
                'offline-museum', source=example, artifacts_root=Path(temporary) / 'artifacts')
            seen = {'author_flags': []}

            class Kane:
                def run(self, copy, test, expected_hash, author):
                    actual = observe(copy['site'], driver.target_for(copy))
                    expected = copy['site'].expected
                    status = 'passed' if actual == expected else 'verification_failed'
                    seen['author_flags'].append(author)
                    return dict(result=status, evidence_id='synthetic-' + copy['id'],
                                test_hash=expected_hash, target_url=driver.target_for(copy),
                                failure=f'Synthetic visible assertion: expected {expected}; observed {actual}.')

            class Gemini:
                def propose(self, source, test, contract):
                    seen['gemini_source'] = source
                    seen['gemini_test'] = test
                    return {'file': 'site/offer.json', 'field': 'price_cents',
                            'old_value': 1800, 'new_value': 1700,
                            'description': 'Synthetic one-field price fault.'}

            class Codex:
                def repair(self, source, evidence):
                    seen['codex_source'] = source
                    seen['codex_evidence'] = evidence
                    return {'content': json.dumps({'price_cents': 1800}, indent=2) + '\n'}

            agents = SimpleNamespace(kane=Kane(), gemini=Gemini(), codex=Codex())
            run = JudgeRun(adapter_id='local-contract')
            worker = threading.Thread(target=execute_judge_workflow,
                                      args=(run, driver, agents, 2), daemon=True)
            try:
                worker.start()
                deadline = time.monotonic() + 15
                while run.state != 'awaiting_fault_approval' and worker.is_alive() and time.monotonic() < deadline:
                    time.sleep(.01)
                self.assertEqual(run.state, 'awaiting_fault_approval')
                self.assertIn('offer.json', run.fault_diff)
                self.assertIn('1700', run.fault_diff)
                self.assertEqual(driver.base_site.data['price_cents'], 1800)
                run.decide(run.proposal_id, 'approve')
                worker.join(timeout=60)
                self.assertFalse(worker.is_alive(), 'LOCAL contract workflow did not finish')
                self.assertEqual(run.state, 'completed', run.public())
                self.assertEqual(seen['author_flags'], [True, False, False, False])
                self.assertEqual(seen['gemini_test'], driver.test_bytes)
                self.assertEqual(set(seen['codex_source']), {'site/offer.json'})
                self.assertEqual(json.loads(seen['codex_source']['site/offer.json'])['price_cents'], 1700)
                self.assertIn('observed $17.00', seen['codex_evidence']['summary'])
                self.assertEqual(driver.base_site.data['price_cents'], 1800)
            finally:
                if worker.is_alive():
                    worker.join(timeout=60)
                driver.close()


if __name__ == '__main__':
    unittest.main()
