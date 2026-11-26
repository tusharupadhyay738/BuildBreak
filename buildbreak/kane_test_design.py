"""Prepare a Kane-designed test from a bounded LOCAL site contract.

This module is not wired to the live judge button until a real CLI run proves
the output format and healthy qualification path.
"""
import hashlib
import json
from pathlib import Path
import re

from .process_control import run
from .site_contract import read_site


class DesignError(ValueError):
    pass


def requirements(site):
    action = (f'Click the visible control with id {site.click_id} once.' if site.click_id
              else 'Wait for the initial page to finish loading.')
    return (f'# {site.name} browser requirement\n\n'
            'Use a fresh, fictional local copy of this site. Open its supplied start URL.\n'
            f'{action}\n'
            f'The visible element with id {site.result_id} must display exactly '
            f'{site.expected}. Check its rendered text in Chrome.\n'
            'The stated action is required; do not make it conditional. '
            'Use only navigation, that action, and a visible-text assertion.\n')


def _invoke(executable, workspace, args, invoke):
    result = invoke([str(executable), *args], cwd=workspace)
    if result.returncode:
        raise DesignError('Kane did not complete the requested context or design step.')
    return result.stdout


def _use_case(lines):
    try:
        entries = [json.loads(line) for line in lines.splitlines() if line.strip()]
    except (ValueError, TypeError):
        raise DesignError('Kane use-case listing was not valid NDJSON.') from None
    if (len(entries) != 1 or not isinstance(entries[0], dict)
            or not isinstance(entries[0].get('id'), str)
            or not re.fullmatch(r'uc-[0-9]+', entries[0]['id'])
            or entries[0].get('label') != 'usecase'):
        raise DesignError('Expected exactly one newly extracted Kane use-case.')
    return entries[0]['id']


def validate_generated_test(site, data):
    """Reject a designed test that can skip this contract's required browser check.

    Text checks are only a preflight. Two healthy runs must still prove that
    Chrome reached the target and made the required assertion.
    """
    try:
        text = data.decode('utf-8')
    except UnicodeError:
        raise DesignError('Kane test definition is not UTF-8.') from None
    if ('{{start_url}}' not in text or site.result_id not in text
            or site.expected not in text or not re.search(r'\bassert\b', text, re.I)):
        raise DesignError('Kane test omits the start URL or exact result assertion.')
    if site.click_id:
        if site.click_id not in text or not re.search(r'\b(click|activate|press)\b', text, re.I):
            raise DesignError('Kane test omits the required control action.')
        if re.search(r'\b(if present|if available|if it exists|when present|optionally)\b',
                     text, re.I):
            raise DesignError('Kane test makes the required control action optional.')


def design_local_test(source, workspace, executable, invoke=None):
    """Run one extract and one design in a fresh private workspace.

    The caller supplies a trusted Kane executable. No human review or live
    launch is performed by importing this module.
    """
    site = read_site(source)
    workspace = Path(workspace)
    workspace.mkdir(parents=True, exist_ok=False)
    note = workspace / 'requirements.md'
    note.write_text(requirements(site), encoding='utf-8')
    if invoke is None:
        def invoke(args, cwd):
            return run(args, cwd=cwd, timeout=300, environment='cli')

    _invoke(executable, workspace, ['context', 'ingest', '--mode', 'ci', '--local',
                                    'requirements.md'], invoke)
    _invoke(executable, workspace, ['context', 'extract', '--mode', 'override', '--json'], invoke)
    use_case = _use_case(_invoke(executable, workspace,
                                 ['context', 'list', '--type', 'usecase', '--undesigned', '--json'],
                                 invoke))
    _invoke(executable, workspace, ['design', 'tests', '--use-case', use_case,
                                    '--allow-unreviewed', '--mode', 'override', '--max', '1',
                                    '--json'], invoke)

    candidates = [p for p in workspace.rglob('*_test.md') if p.is_file()]
    if len(candidates) != 1:
        raise DesignError('Kane must save exactly one new test definition.')
    test = candidates[0]
    if (test.is_symlink() or not test.resolve().is_relative_to(workspace.resolve())
            or test.stat().st_size > 64 * 1024):
        raise DesignError('Kane test definition is linked, redirected or too large.')
    data = test.read_bytes()
    if not data or b'## Step ' not in data:
        raise DesignError('Kane did not save a numbered browser test.')
    validate_generated_test(site, data)
    return {'use_case': use_case, 'test_path': test, 'test_sha256': hashlib.sha256(data).hexdigest()}
