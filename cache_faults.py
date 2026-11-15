"""Generate validated private Gemini faults, or revalidate one genuine battle's proposal."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
import time
import uuid

from gemini_breaker import configuration, propose_fault, GeminiError
from fault_cache import store_fault
from fault_validator import InvalidFault, json_command, TEST_SCRIPT, direct_check, protected, validate_fault


def prepare(root, python):
    from battle_runner import snapshot
    root = Path(root).resolve()
    folder = root / 'instance/fault-cache-runs' / (
        datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S') + '-' + uuid.uuid4().hex[:8])
    workspace = folder / 'workspace'
    manifest = snapshot(root, workspace)
    checks = folder / 'healthy'
    checks.mkdir()
    tests = json_command(python, TEST_SCRIPT, workspace, checks, 'app-tests')
    if tests['run'] < 1 or any(tests[key] for key in ('failures', 'errors', 'skipped', 'unexpected_successes', 'expected_failures')):
        raise InvalidFault('Healthy app tests did not all pass; no cache generated.')
    if not direct_check(workspace, checks / 'direct', python)['passed']:
        raise InvalidFault('Healthy direct checkout check failed; no cache generated.')
    protected(workspace, manifest)
    return folder, workspace, manifest


def cache_faults(root, python, count=3, from_battle=None):
    from battle_runner import Server
    if not 1 <= count <= 10:
        raise ValueError('Count must be between 1 and 10 requests.')
    imported = None
    if from_battle:
        if not re.fullmatch(r'\d{8}T\d{6}-[a-f0-9]{8}', from_battle):
            raise InvalidFault('Invalid battle identifier.')
        directory = Path(root).resolve() / 'instance/battles' / from_battle
        if directory.is_symlink() or not directory.resolve().is_relative_to((Path(root).resolve() / 'instance/battles').resolve()):
            raise InvalidFault('Unsafe battle location.')
        imported = json.loads((directory / 'fault.json').read_text(encoding='utf-8'))
        if imported.get('producer') != 'gemini' or imported.get('fallback') is not False:
            raise InvalidFault('Only a recorded Gemini proposal can be imported as a Gemini cache.')
    else:
        _, model = configuration()
    folder, workspace, manifest = prepare(root, python)
    if imported:
        original = json.loads((directory / 'baseline-manifest.json').read_text(encoding='utf-8'))
        for name in ('app.py', 'test_app.py', '.testmuai/tests/CheckoutConsistency_test.md'):
            if original.get(name) != manifest[name]:
                raise InvalidFault('Original battle app or protected tests differ from this baseline.')
        model = imported.get('model')
        if not isinstance(model, str) or not re.fullmatch(r'gemini-[A-Za-z0-9.-]{1,100}', model):
            raise InvalidFault('Original Gemini model was not recorded.')
    results = []
    for attempt in range(1, (1 if imported else count) + 1):
        try:
            proposal = imported['patch'] if imported else propose_fault((workspace / 'app.py').read_text(encoding='utf-8'))
            validate_fault(workspace, folder / f'candidate-{attempt}', python, manifest, proposal, Server)
            target = store_fault(root, manifest, proposal, model, from_battle)
            results.append({'attempt': attempt, 'accepted': True, 'cache_id': target.stem})
            print(f'Proposal {attempt}: validated and cached as {target.stem}', flush=True)
        except (GeminiError, InvalidFault) as error:
            results.append({'attempt': attempt, 'accepted': False, 'reason': str(error)})
            print(f'Proposal {attempt}: not accepted ({type(error).__name__}).', flush=True)
            if isinstance(error, GeminiError) and not error.retryable:
                break
        if not imported and attempt < count:
            time.sleep(4)
    protected(workspace, manifest)
    (folder / 'results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--count', type=int, choices=range(1, 11), default=3)
    parser.add_argument('--from-battle', help='Revalidate an existing Gemini proposal without an API call')
    args = parser.parse_args()
    try:
        results = cache_faults(Path(__file__).resolve().parent, sys.executable, args.count, args.from_battle)
        accepted = len({r['cache_id'] for r in results if r['accepted']})
        print(f'{accepted} distinct validated fault(s) cached; {len(results)} proposal(s) checked.')
        return 0 if accepted else 1
    except (OSError, ValueError, RuntimeError) as error:
        parser.exit(1, f'Cache generation stopped: {error}\n')


if __name__ == '__main__':
    raise SystemExit(main())
