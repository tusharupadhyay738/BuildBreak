"""Stage B Generalized Generated Battle Runner.

Runs generated regression suites on broken copies:
- failure = caught -> routes to Codex repair loop
- pass = escaped -> records escape, requires Kane to design the missing test
- infrastructure_error = recorded separately, not counted as defect detection

Supports generic differential checks for apps with a database or HTTP API.
"""
import json
import re
import shutil
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List

from .battle_runner import (ROOT, Server, executable, connect, event,
                            codex_json, validate_repair, RejectedRepair, _run_testmd, digest)
from .battle_history import save_details
from .generated_suite import verify, qualified_tests, suite_file
from .differential_check import compare_differential_observations, probe_http_endpoint
from .flow_breaker import build_flow_guided_prompt


class BattleResult:
    CAUGHT = 'caught'
    ESCAPED = 'escaped'
    INFRASTRUCTURE_ERROR = 'infrastructure_error'


def run_generated_test(workspace: Path, artifacts: Path, url: str, name: str, kane: str,
                       test_path: Path, show_browser: bool = False, variables_file: Optional[Path] = None) -> Dict[str, Any]:
    content = test_path.read_text(encoding='utf-8')
    step_matches = re.findall(r"^##\s+Step\s+\d+\b", content, re.M)
    expected_steps = len(step_matches) if step_matches else 5

    relative = test_path.relative_to(workspace) if test_path.is_relative_to(workspace) else test_path
    return _run_testmd(workspace, artifacts, url, name, kane, relative, expected_steps,
                       show_browser=show_browser, variables_file=variables_file)


def evaluate_suite_on_broken_app(workspace: Path, private: Path, url: str, suite_dir: Path,
                                 kane: str, show_browser: bool = False, variables_file: Optional[Path] = None) -> Dict[str, Any]:
    """Runs each qualified test in the generated suite.

    Returns:
      overall_outcome: 'caught' | 'escaped' | 'infrastructure_error'
      test_results: dict mapping test_name -> result dict
      failing_test: name of the first test that detected the failure (if any)
    """
    if not (suite_dir / "manifest.json").is_file():
        return {
            'overall_outcome': BattleResult.INFRASTRUCTURE_ERROR,
            'reason': 'No qualified tests in suite (manifest missing or suite unverified)',
            'test_results': {}
        }
    eligible = qualified_tests(suite_dir)
    if not eligible:
        # If no tests passed the 2x healthy verification, we cannot evaluate
        return {
            'overall_outcome': BattleResult.INFRASTRUCTURE_ERROR,
            'reason': 'No qualified tests in suite (all unstable or failing on healthy app)',
            'test_results': {}
        }

    results = {}
    failing_test = None
    has_infra_error = False

    for test_name, expected_hash in eligible.items():
        test_file = suite_file(suite_dir, test_name)
        run_artifacts = private / f"eval-{test_name}"
        run_name = f"GenTest-{uuid.uuid4().hex[:6]}"

        res = run_generated_test(workspace, run_artifacts, url, run_name, kane,
                                test_file, show_browser=show_browser, variables_file=variables_file)
        results[test_name] = res

        if res['result'] == 'verification_failed':
            failing_test = test_name
            # Found a caught bug
            return {
                'overall_outcome': BattleResult.CAUGHT,
                'failing_test': test_name,
                'test_results': results
            }
        elif res['result'] == 'infrastructure_error':
            has_infra_error = True

    if has_infra_error:
        return {
            'overall_outcome': BattleResult.INFRASTRUCTURE_ERROR,
            'test_results': results
        }

    # All tests passed despite an independently proven differential fault -> Escaped
    return {
        'overall_outcome': BattleResult.ESCAPED,
        'test_results': results
    }
