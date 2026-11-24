"""Evaluate locked regression tests against a demonstrated business-logic change."""
import json
import re
from pathlib import Path

from .battle_runner import _run_testmd
from .differential_check import DifferentialProbeError, compare_differential_observations
from .generated_suite import digest, qualified_tests, suite_file


class BattleResult:
    CAUGHT = "caught"
    ESCAPED = "escaped"
    NO_DIFFERENCE = "no_observable_change"
    INFRASTRUCTURE_ERROR = "infrastructure_error"


def run_generated_test(workspace, artifacts, url, name, kane, test_path, expected_hash,
                       show_browser=False, on_line=None, cdp_endpoint=None):
    """Run a disposable copy. Never pass the source archive to the CLI."""
    data = test_path.read_bytes()
    if digest(data) != expected_hash:
        raise ValueError("Generated test changed after approval")
    steps = len(re.findall(r"^##\s+Step\s+\d+\b", data.decode("utf-8"), re.M))
    if not steps:
        raise ValueError("No numbered Kane steps")
    relative = Path(".testmuai/tests") / test_path.name
    dest = workspace / relative
    if dest.resolve() != dest.absolute():
        raise ValueError("Redirected test destination")
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        with dest.open("xb") as stream:
            stream.write(data)
    if dest.read_bytes() != data:
        raise ValueError("Isolated test does not match its approved definition")
    variables = artifacts.with_name(artifacts.name + "-variables.json")
    with variables.open("x", encoding="utf-8") as stream:
        json.dump({"start_url": {"value": url}}, stream)
    return _run_testmd(workspace, artifacts, url, name, kane, relative, steps,
                       show_browser=show_browser, on_line=on_line,
                       cdp_endpoint=cdp_endpoint, variables_file=variables)


def evaluate_suite_on_broken_app(workspace, private, url, suite_dir, kane, *,
                                 healthy=None, broken=None, show_browser=False, runner=None):
    results = {}

    def outcome(state, reason):
        return dict(overall_outcome=state, reason=reason, test_results=results)

    try:
        eligible = qualified_tests(suite_dir)
    except (OSError, ValueError, KeyError, TypeError):
        return outcome(BattleResult.INFRASTRUCTURE_ERROR, "No qualified tests or invalid suite archive")
    if not eligible:
        return outcome(BattleResult.INFRASTRUCTURE_ERROR, "No qualified tests in suite")
    try:
        changed, explanation = compare_differential_observations(healthy, broken)
    except DifferentialProbeError:
        return outcome(BattleResult.INFRASTRUCTURE_ERROR, "Probe observations are missing or invalid")
    if not changed:
        return outcome(BattleResult.NO_DIFFERENCE, explanation)

    for name, expected in eligible.items():
        test = suite_file(suite_dir, name)
        result = (runner or run_generated_test)(workspace, private / ("eval-" + name), url,
            "SeatPilotGenerated", kane, test_path=test, expected_hash=expected, show_browser=show_browser)
        results[name] = result
        if (result.get("test_hash") != expected or not result.get("evidence_id")
                or result.get("result") not in {"passed", "verification_failed"}):
            return outcome(BattleResult.INFRASTRUCTURE_ERROR, "Kane evidence unavailable or invalid")
        if result["result"] == "verification_failed":
            return dict(outcome(BattleResult.CAUGHT, explanation), failing_test=name)
    return outcome(BattleResult.ESCAPED, explanation)
