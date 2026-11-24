"""Run approved SeatPilot regression tests twice on fresh local app copies."""
import argparse
import json
from pathlib import Path
import re
import shutil
import sys

from . import seatpilot_adapter
from .battle_runner import ROOT, Server, _run_testmd, executable
from .generated_suite import digest, disposition, suite_file, verify


def healthy_run(suite, name, directory, kane, show_browser):
    manifest = verify(suite)
    test = suite_file(suite, name)
    directory.mkdir(parents=True, exist_ok=False)
    workspace = seatpilot_adapter.prepare_runtime(directory / "app", build=True)
    relative = Path(".testmuai/tests") / name
    shutil.copyfile(test, workspace / relative)
    if digest((workspace / relative).read_bytes()) != manifest["tests"][name]:
        raise ValueError("Isolated test differs from approved test")
    steps = len(re.findall(r"^##\s+Step\s+\d+\b", test.read_text(encoding="utf-8"), re.M))
    if not steps:
        raise ValueError("Expected numbered Kane test steps")
    server = Server(workspace, directory, sys.executable)
    server.ready_marker = b"SeatPilot"
    try:
        server.start()
        variables = directory / "variables.json"
        variables.write_text(json.dumps({"start_url": {"value": server.url}}), encoding="utf-8")
        print(f"Running {name} on fresh SeatPilot at {server.url}", flush=True)
        result = _run_testmd(workspace, directory / "kane", server.url, "SeatPilotCatalogHealthy",
                             kane, relative, steps, show_browser=show_browser, variables_file=variables)
    finally:
        server.stop()
    verify(suite)
    return {key: result[key] for key in ("result", "evidence_id", "test_hash")}


def qualify(root, show_browser=False, revision="seatpilot"):
    if revision not in {"seatpilot", "seatpilot-attempt-02"}:
        raise ValueError("Unknown SeatPilot suite")
    suite = root / ".testmuai/tests/generated" / revision
    manifest = verify(suite)
    receipt = suite / "qualification.json"
    if receipt.exists():
        raise FileExistsError("A healthy qualification is already recorded for this suite")
    target = root / "instance/targets/seatpilot"
    if revision == "seatpilot-attempt-02":
        target = target / "attempt-02"
    output = target / "qualification"
    kane = executable("kane-cli")
    output.mkdir(parents=True, exist_ok=False)
    results = {}
    for name in manifest["tests"]:
        runs = []
        for number in (1, 2):
            directory = output / name.removesuffix("_test.md") / str(number)
            run = healthy_run(suite, name, directory, kane, show_browser)
            (directory / "result.json").write_text(json.dumps(run, indent=2), encoding="utf-8")
            print(f"Run {number}: {run['result']} ({run['evidence_id']})", flush=True)
            runs.append(run)
        results[name] = {"status": disposition(runs), "runs": runs}
    with receipt.open("x", encoding="utf-8") as stream:
        json.dump(results, stream, indent=2)
        stream.write("\n")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--show-browser", action="store_true")
    parser.add_argument("--revision", choices=("seatpilot", "seatpilot-attempt-02"), default="seatpilot")
    args = parser.parse_args()
    qualify(ROOT, args.show_browser, args.revision)
