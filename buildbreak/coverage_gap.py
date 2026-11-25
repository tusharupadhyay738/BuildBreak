"""Preserve a generated-suite escape and check a human-approved follow-up test."""
import argparse
import json
from pathlib import Path
import re
import shutil
import sys

from . import seatpilot_adapter as adapter
from .battle_runner import ROOT, Server, executable
from .generated_battle import run_generated_test
from .generated_suite import approve, digest, disposition, suite_file


def save_gap(private, healthy, broken, test_hash, evidence_id):
    target = private / "coverage-gap"
    (target / "proposed").mkdir(parents=True, exist_ok=False)
    receipt = dict(healthy=healthy, changed=broken, escaped_test=test_hash, evidence_id=evidence_id,
                   healthy_source=adapter.sha(private/"original-app.py"),
                   broken_source=adapter.sha(private/"workspace/app.py"))
    (target/"observations.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    text = (
        "# SeatPilot discounted quote\n\n"
        "On the disposable SeatPilot site, select Nocturne Symphony, set the ticket quantity to two, "
        "apply EARLY15 and inspect the visible quote. Read the displayed subtotal, discount and total "
        "as monetary amounts. Complete the flow without submitting a booking.\n\n"
        f"The healthy quote has subtotal ${healthy['subtotal']:.2f}, discount "
        f"${healthy['discountAmount']:.2f} and total ${healthy['total']:.2f}.\n"
    )
    (target/"requirements.md").write_text(text, encoding="utf-8")


def check_followup(root, battle, filename, reviewed_hash, show_browser=False):
    if not re.fullmatch(r"[0-9]{8}T[0-9]{6}-[0-9a-f]{8}", battle):
        raise ValueError("Invalid battle identifier")
    private = root/"instance/battles"/battle
    gap = private/"coverage-gap"
    source = gap/"proposed/.testmuai/tests"
    test = suite_file(source, filename)
    if digest(test.read_bytes()) != reviewed_hash:
        raise ValueError("Proposal differs from the file reviewed")
    receipt = json.loads((gap/"observations.json").read_text(encoding="utf-8"))
    manifest = json.loads((private/"baseline-manifest.json").read_text(encoding="utf-8"))
    if (adapter.sha(private/"original-app.py") != manifest["app.py"]
            or manifest["app.py"] != receipt["healthy_source"]
            or adapter.sha(private/"workspace/app.py") != receipt["broken_source"]):
        raise ValueError("Saved source snapshots changed")
    destination = root/".testmuai/tests/generated"/("seatpilot-gap-" + battle)
    if destination.exists():
        raise FileExistsError("Follow-up suite already exists")
    kane = executable("kane-cli")
    work = gap/"verification"
    work.mkdir(exist_ok=False)
    healthy_runs = []
    for phase in ("broken", "healthy-1", "healthy-2"):
        directory = work/phase
        workspace = directory/"app"
        copied = adapter.snapshot(private/"workspace", workspace)
        if {k:v for k,v in copied.items() if k!="app.py"} != {k:v for k,v in manifest.items() if k!="app.py"}:
            raise ValueError("Saved app assets changed since the battle")
        if phase != "broken":
            shutil.copyfile(private/"original-app.py", workspace/"app.py")
        server = Server(workspace, directory, sys.executable)
        server.ready_marker = b"SeatPilot"
        try:
            server.start()
            expected = receipt["changed" if phase=="broken" else "healthy"]
            if adapter.observe_quote(server.url) != expected:
                raise ValueError("Snapshot no longer reproduces the recorded quote")
            result = run_generated_test(workspace, directory/"kane", server.url, "SeatPilotGap",
                                        kane, test, reviewed_hash, show_browser)
        finally:
            server.stop()
        saved = {key:result[key] for key in ("result","test_hash","evidence_id")}
        (directory/"receipt.json").write_text(json.dumps(saved), encoding="utf-8")
        print(phase, saved["result"], saved["evidence_id"], flush=True)
        required = "verification_failed" if phase == "broken" else "passed"
        if saved["result"] != required or saved["test_hash"] != reviewed_hash or not saved["evidence_id"]:
            return False
        if phase != "broken":
            healthy_runs.append(saved)
    status = disposition(healthy_runs)
    approve(source, destination, {filename:reviewed_hash})
    with (destination/"qualification.json").open("x",encoding="utf-8") as stream:
        json.dump({filename:dict(status=status,runs=healthy_runs)},stream,indent=2)
        stream.write("\n")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("battle")
    parser.add_argument("filename")
    parser.add_argument("--approved-sha256", required=True)
    parser.add_argument("--show-browser", action="store_true")
    args = parser.parse_args()
    sys.exit(0 if check_followup(ROOT,args.battle,args.filename,args.approved_sha256,args.show_browser) else 1)
