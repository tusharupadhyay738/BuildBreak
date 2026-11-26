"""Approval-gated, single-challenge workflow for explicitly supported local apps."""
from copy import deepcopy
from dataclasses import dataclass, field
import hashlib
import subprocess
import threading
import time
from urllib.parse import urlsplit
import uuid


TERMINAL_STATES = {
    'completed', 'escaped', 'fault_rejected', 'approval_timeout',
    'baseline_failed', 'test_unstable', 'unsupported', 'repair_failed',
    'infrastructure_error',
}
TEST_RESULT_STATES = {'passed', 'verification_failed', 'infrastructure_error'}
PERMITTED_ACTIONS = {'navigate', 'click', 'type', 'assert_text', 'reload'}
MAX_TEST_BYTES = 100_000
MAX_DIFF_BYTES = 20_000
MAX_FAILURE_BYTES = 8_000


class WorkflowError(ValueError):
    """A local judge workflow cannot safely continue."""


@dataclass
class JudgeRun:
    adapter_id: str
    id: str = field(default_factory=lambda: uuid.uuid4().hex)
    state: str = 'created'
    events: list = field(default_factory=list)
    test_sha256: str = ''
    fault_description: str = ''
    fault_diff: str = ''
    proposal_id: str = ''
    decision: str = ''
    result: str = ''
    error: str = ''
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    approval_deadline: float = 0.0
    lock: threading.RLock = field(default_factory=threading.RLock, repr=False)
    decision_ready: threading.Event = field(default_factory=threading.Event, repr=False)

    def emit(self, state, message):
        with self.lock:
            if self.state in TERMINAL_STATES:
                raise WorkflowError('A finished workflow cannot change state.')
            self.state = state
            self.updated_at = time.time()
            self.events.append({'state': state, 'message': message, 'at': self.updated_at})

    def decide(self, proposal_id, decision):
        if decision not in {'approve', 'reject'}:
            raise WorkflowError('Choose approve or reject.')
        with self.lock:
            if (self.state != 'awaiting_fault_approval'
                    or not proposal_id or proposal_id != self.proposal_id
                    or self.decision or time.monotonic() >= self.approval_deadline):
                raise WorkflowError('There is no matching pending fault approval.')
            self.decision = decision
            self.updated_at = time.time()
            self.decision_ready.set()

    def public(self):
        with self.lock:
            return {
                'id': self.id,
                'adapter': self.adapter_id,
                'state': self.state,
                'result': self.result,
                'test_sha256': self.test_sha256,
                'fault_description': self.fault_description if self.state == 'awaiting_fault_approval' else '',
                'fault_diff': self.fault_diff if self.state == 'awaiting_fault_approval' else '',
                'proposal_id': self.proposal_id if self.state == 'awaiting_fault_approval' else '',
                'events': deepcopy(self.events),
                'error': self.error,
            }


class JudgeRegistry:
    """Keep only one active live workflow; history remains in the legacy archive."""

    def __init__(self):
        self._runs = {}
        self._lock = threading.Lock()

    def create(self, adapter_id):
        with self._lock:
            if any(run.state not in TERMINAL_STATES for run in self._runs.values()):
                raise WorkflowError('A judge workflow is already active.')
            run = JudgeRun(adapter_id=adapter_id)
            self._runs[run.id] = run
            return run

    def get(self, run_id):
        with self._lock:
            return self._runs.get(run_id)

    def decide(self, run_id, proposal_id, decision):
        run = self.get(run_id)
        if run is None:
            raise WorkflowError('Judge workflow is unavailable.')
        run.decide(proposal_id, decision)
        return run

    def runs(self):
        with self._lock:
            return tuple(self._runs.values())


def _validate_test(driver, test_bytes, copy):
    if not isinstance(test_bytes, bytes) or not test_bytes or len(test_bytes) > MAX_TEST_BYTES:
        raise WorkflowError('The generated test is empty or exceeds its size limit.')
    contract = driver.validate_test(test_bytes, copy)
    if not isinstance(contract, dict):
        raise WorkflowError('The adapter did not return a test contract.')
    target = contract.get('target')
    expected_target = driver.target_for(copy)
    actions = contract.get('permitted_actions')
    assertions = contract.get('assertions')
    try:
        parsed_target = urlsplit(target)
        local_target = (parsed_target.scheme == 'http' and parsed_target.hostname == '127.0.0.1'
                        and parsed_target.port is not None and 1024 <= parsed_target.port <= 65535
                        and parsed_target.username is None and parsed_target.password is None
                        and parsed_target.path in {'', '/'} and not parsed_target.query
                        and not parsed_target.fragment)
    except (TypeError, ValueError):
        local_target = False
    if (not isinstance(target, str) or target != expected_target or not local_target
            or not isinstance(actions, (list, tuple, set)) or not actions
            or any(not isinstance(action, str) or action not in PERMITTED_ACTIONS for action in actions)
            or not isinstance(assertions, (list, tuple)) or not assertions
            or any(not isinstance(item, str) or not item.strip() or len(item) > 500
                   for item in assertions)):
        raise WorkflowError('The test target, actions or assertions are outside the adapter contract.')
    return contract


def _checked_test_result(driver, copy, result, expected_hash):
    if not isinstance(result, dict):
        raise WorkflowError('Kane returned no structured test result.')
    if (result.get('test_hash') != expected_hash
            or result.get('target_url') != driver.target_for(copy)
            or driver.test_hash() != expected_hash):
        raise WorkflowError('The locked test changed during verification.')
    if (result.get('result') not in TEST_RESULT_STATES
            or not isinstance(result.get('evidence_id'), str)
            or not result['evidence_id']):
        raise WorkflowError('Kane evidence or verdict is missing or invalid.')
    return result


def _set_terminal(run, state, message, error=''):
    with run.lock:
        run.state = state
        run.result = state
        run.error = error
        run.updated_at = time.time()
        run.events.append({'state': state, 'message': message, 'at': run.updated_at})
    return run


def execute_judge_workflow(run, driver, agents, approval_timeout=120):
    """Run one local challenge. Every external role is an injected, isolated port."""
    if not getattr(driver, 'supported', False):
        return _set_terminal(run, 'unsupported', 'No explicit local adapter contract is registered.')
    if not isinstance(approval_timeout, (int, float)) or approval_timeout <= 0:
        raise ValueError('Fault approval timeout must be positive.')

    try:
        run.emit('authoring_test', 'Kane is authoring the adapter-bounded browser test.')
        first_copy = driver.fresh_healthy_copy(1)
        test_bytes = driver.test_definition(first_copy)
        contract = _validate_test(driver, test_bytes, first_copy)
        expected_hash = hashlib.sha256(test_bytes).hexdigest()
        run.test_sha256 = expected_hash
        run.emit('qualifying_test', 'Arena locked the test target, permitted actions, assertions and SHA-256.')
        evidence_ids = set()
        copy_ids = set()
        for attempt in (1, 2):
            copy = first_copy if attempt == 1 else driver.fresh_healthy_copy(attempt)
            if attempt == 2:
                _validate_test(driver, test_bytes, copy)
            copy_id = driver.copy_id(copy)
            if not copy_id or copy_id in copy_ids:
                return _set_terminal(run, 'test_unstable', 'Healthy verification did not use fresh independent copies.')
            copy_ids.add(copy_id)
            result = _checked_test_result(
                driver, copy, agents.kane.run(copy, test_bytes, expected_hash, author=(attempt == 1)),
                expected_hash)
            if result['result'] == 'infrastructure_error':
                return _set_terminal(run, 'infrastructure_error',
                                     'Healthy Kane verification was interrupted; no challenge was started.')
            if result['result'] != 'passed':
                return _set_terminal(run, 'baseline_failed',
                                     'The test failed on a healthy app; no challenge was started.')
            evidence_id = result['evidence_id']
            if evidence_id in evidence_ids:
                return _set_terminal(run, 'test_unstable',
                                     'Healthy runs did not produce distinct evidence records.')
            evidence_ids.add(evidence_id)
            if driver.test_hash() != expected_hash:
                raise WorkflowError('The test hash changed during healthy qualification.')

        source = driver.gemini_source()
        proposal = agents.gemini.propose(source, test_bytes, contract)
        preview = driver.preview_fault(proposal)
        if (not isinstance(preview, dict)
                or not isinstance(preview.get('description'), str)
                or not preview['description'].strip()
                or len(preview['description']) > 1000
                or not isinstance(preview.get('diff'), str)
                or not preview['diff'].strip()
                or len(preview['diff'].encode('utf-8')) > MAX_DIFF_BYTES):
            raise WorkflowError('The fault proposal did not produce a bounded local diff.')
        with run.lock:
            run.fault_description = preview['description']
            run.fault_diff = preview['diff']
            run.proposal_id = uuid.uuid4().hex
            run.approval_deadline = time.monotonic() + approval_timeout
        run.emit('awaiting_fault_approval',
                 'Review this exact fault and diff. No edit has been applied.')
        decided = run.decision_ready.wait(approval_timeout)
        with run.lock:
            decision = run.decision if decided else ''
        if decision != 'approve':
            state = 'fault_rejected' if decision == 'reject' else 'approval_timeout'
            message = ('The operator rejected the fault; nothing was applied.' if decision == 'reject'
                       else 'Fault approval timed out; nothing was applied.')
            return _set_terminal(run, state, message)

        run.emit('validating_fault', 'The approved edit is being validated on an isolated copy.')
        candidate = driver.validate_fault(proposal, expected_hash)
        if driver.test_hash() != expected_hash:
            raise WorkflowError('The locked test changed during fault validation.')
        broken = driver.apply_fault(candidate)
        probe = driver.independent_probe(broken)
        if not isinstance(probe, dict) or probe.get('status') != 'changed':
            return _set_terminal(run, 'infrastructure_error',
                                 'The independent fault probe did not confirm a changed behavior.')
        if driver.test_hash() != expected_hash:
            raise WorkflowError('The locked test changed before broken-copy verification.')

        run.emit('verifying_fault', 'Kane is running the same locked test on the confirmed changed copy.')
        broken_result = _checked_test_result(
            driver, broken, agents.kane.run(broken, test_bytes, expected_hash, author=False), expected_hash)
        if broken_result['result'] == 'infrastructure_error':
            return _set_terminal(run, 'infrastructure_error',
                                 'Broken-copy verification was interrupted; no scored result was recorded.')
        if broken_result['result'] == 'passed':
            return _set_terminal(run, 'escaped',
                                 'The confirmed fault passed the qualified test.')

        evidence = driver.kane_evidence(broken_result)
        if (not isinstance(evidence, dict) or set(evidence) != {'summary', 'test_hash'}
                or evidence.get('test_hash') != expected_hash
                or not isinstance(evidence.get('summary'), str)
                or len(evidence['summary'].encode('utf-8')) > MAX_FAILURE_BYTES):
            raise WorkflowError('Kane failure evidence is invalid or exceeds its limit.')
        broken_source = driver.codex_source(broken)
        if not isinstance(broken_source, dict) or not broken_source:
            raise WorkflowError('No broken source was prepared for Codex.')
        run.emit('repairing', 'Codex receives only broken source and Kane failure evidence.')
        repair = agents.codex.repair(broken_source, evidence)
        candidate_repair = driver.validate_repair(broken, repair)
        driver.apply_repair(broken, candidate_repair)
        if not driver.independent_repair_probe(broken):
            return _set_terminal(run, 'repair_failed',
                                 'Arena did not confirm the repair with its independent behavior probe.')
        if driver.test_hash() != expected_hash:
            raise WorkflowError('The locked test changed before repair verification.')
        run.emit('verifying_repair', 'Kane is re-verifying the repaired copy with the same locked test.')
        repaired_result = _checked_test_result(
            driver, broken, agents.kane.run(broken, test_bytes, expected_hash, author=False), expected_hash)
        if repaired_result['result'] == 'infrastructure_error':
            return _set_terminal(run, 'infrastructure_error',
                                 'Repair verification was interrupted; no repair victory was recorded.')
        if repaired_result['result'] != 'passed':
            return _set_terminal(run, 'repair_failed',
                                 'The repaired copy did not pass the locked browser test.')
        return _set_terminal(run, 'completed',
                             'Arena checked the repair and Kane passed the unchanged locked test.')
    except (WorkflowError, OSError, RuntimeError, ValueError, TypeError, KeyError,
            TimeoutError, subprocess.SubprocessError):
        return _set_terminal(run, 'infrastructure_error',
                             'Workflow stopped on an infrastructure or validation error; inspect private local logs.',
                             'Workflow execution failed; details are not exposed in the dashboard.')
