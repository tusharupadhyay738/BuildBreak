"""Prepare a Kane-designed test from a bounded LOCAL site contract.

This module is not wired to the live judge button until a real CLI run proves
the output format and healthy qualification path.
"""
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

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
    headings = list(re.finditer(r'^## Step ([1-9][0-9]*)[^\n]*\n', text, re.M))
    if [match.group(1) for match in headings] != ['1', '2']:
        raise DesignError('Kane test must contain exactly two numbered steps.')
    opening = text[headings[0].end():headings[1].start()]
    check = text[headings[1].end():]
    if ('{{start_url}}' not in opening
            or not re.search(r'\b(open|navigate|visit)\b', opening, re.I)
            or site.result_id not in check or site.expected not in check
            or not re.search(r'\bassert\b', check, re.I)):
        raise DesignError('Kane test omits the start URL or exact result assertion.')
    if (re.search(r'https?://', opening + check, re.I)
            or re.search(r'\b(type|submit|upload|download|purchase|delete|login)\b',
                         opening + check, re.I)):
        raise DesignError('Kane test includes an action outside the LOCAL contract.')
    if site.click_id:
        if site.click_id not in check or not re.search(r'\b(click|activate|press)\b', check, re.I):
            raise DesignError('Kane test omits the required control action.')
        if re.search(r'\b(if present|if available|if it exists|when present|optionally)\b',
                     text, re.I):
            raise DesignError('Kane test makes the required control action optional.')


def bind_start_url(data, url):
    """Bind only the start URL in a disposable test copy; retain source bytes."""
    parsed = urlsplit(url)
    if (parsed.scheme != 'http' or parsed.hostname != '127.0.0.1'
            or not parsed.port or parsed.username or parsed.password
            or parsed.path not in ('', '/') or parsed.query or parsed.fragment):
        raise DesignError('Expected an owned loopback URL for the private copy.')
    marker = b'{{start_url}}'
    if data.count(marker) != 1:
        raise DesignError('Kane test must contain exactly one start URL marker.')
    return data.replace(marker, url.encode('ascii'))


def verify_browser_trace(lines, url, site, outcome):
    """Require the target page, click and expected assertion outcome."""
    if outcome not in {'passed', 'verification_failed'}:
        raise DesignError('Unknown Kane browser outcome.')
    events = []
    try:
        for line in lines.splitlines():
            if line.strip():
                events.append(json.loads(line))
    except (ValueError, TypeError):
        raise DesignError('Kane trace was not valid NDJSON.') from None
    done = [event for event in events if event.get('type') == 'test_md_done']
    actions = [event for event in events if event.get('type') == 'step_event']
    page_seen = any(event.get('event') == 'screenshot'
                    and urlsplit(str(event.get('detail', ''))).netloc == urlsplit(url).netloc
                    for event in actions)
    navigation_seen = any(event.get('event') == 'action'
                          and event.get('action_type') == 'navigate'
                          and event.get('success') is True
                          and url in str(event.get('detail', ''))
                          for event in actions)
    click_seen = not site.click_id or any(
        event.get('event') == 'action' and event.get('action_type') == 'click'
        and event.get('success') is True
        and (site.click_id in str(event.get('detail', ''))
             or site.click_id.replace('-', ' ').casefold()
             in str(event.get('detail', '')).casefold())
        for event in actions)
    check_seen = any(event.get('type') == 'step_end'
                     and event.get('kind') == 'assert'
                     and event.get('status') == ('passed' if outcome == 'passed' else 'failed')
                     and site.result_id in str(event.get('summary', ''))
                     and site.expected in str(event.get('summary', ''))
                     for event in events)
    if (len(done) != 1 or done[0].get('overall_status') !=
            ('passed' if outcome == 'passed' else 'failed')
            or not page_seen or not navigation_seen or not click_seen or not check_seen):
        raise DesignError('Kane did not prove the target page, required click and matching assertion.')


def verify_healthy_trace(lines, url, site):
    verify_browser_trace(lines, url, site, 'passed')


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
