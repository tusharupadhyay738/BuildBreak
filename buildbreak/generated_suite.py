"""Approve exact Kane proposals and verify their bytes outside the Builder workspace."""
import hashlib
import json
import re
from pathlib import Path
from tempfile import TemporaryDirectory


def suite_file(directory, name):
    if not re.fullmatch(r"[A-Za-z0-9_-]+_test\.md", name):
        raise ValueError("Invalid test filename")
    path = directory / name
    if path.resolve() != path.absolute() or not path.is_file():
        raise ValueError("Approved test missing or redirected")
    return path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def approve(proposals, destination, selected):
    """Publish a new target directory only after every reviewed digest matches."""
    if destination.exists() or destination.resolve() != destination.absolute():
        raise FileExistsError("Suite already exists or destination is redirected")
    if not selected:
        raise ValueError("Select at least one reviewed proposal")
    proposed = len(list(proposals.glob("*_test.md")))
    destination.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=destination.parent) as temporary:
        staging = Path(temporary) / "approved"
        staging.mkdir()
        for name, expected in selected.items():
            data = suite_file(proposals, name).read_bytes()
            if digest(data) != expected:
                raise ValueError("Proposal changed since review")
            (staging / name).write_bytes(data)
        manifest = {"proposed": proposed, "tests": selected}
        (staging / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        staging.rename(destination)


def verify(directory):
    path = directory / "manifest.json"
    if path.resolve() != path.absolute():
        raise ValueError("Manifest is redirected")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    tests = manifest["tests"]
    if not isinstance(tests, dict) or not tests or set(tests) != {p.name for p in directory.glob("*_test.md")}:
        raise ValueError("Approved suite membership changed")
    if not isinstance(manifest["proposed"], int) or manifest["proposed"] < len(tests):
        raise ValueError("Invalid proposal count")
    for name, expected in tests.items():
        if digest(suite_file(directory, name).read_bytes()) != expected:
            raise ValueError("Approved test hash mismatch")
    return manifest


def disposition(runs):
    if len(runs) != 2:
        raise ValueError("Two healthy runs are required")
    if any(run["result"] not in {"passed", "verification_failed", "infrastructure_error"} for run in runs):
        raise ValueError("Unknown healthy-run outcome")
    if all(run["result"] == "passed" for run in runs):
        ids = [run["evidence_id"] for run in runs]
        if all(ids) and ids[0] != ids[1]:
            return "kept"
        raise ValueError("Two independent evidence records are required")
    return "unstable or failing on healthy app"


def qualified_tests(directory):
    """Only tests with two verified healthy passes are eligible for a drill."""
    manifest = verify(directory)
    receipt = directory / "qualification.json"
    if not receipt.exists():
        return {}
    if receipt.resolve() != receipt.absolute():
        raise ValueError("Redirected receipt")
    results = json.loads(receipt.read_text(encoding="utf-8"))
    if set(results) != set(manifest["tests"]):
        raise ValueError("Qualification membership mismatch")
    kept = {}
    for name, item in results.items():
        expected = manifest["tests"][name]
        runs = item["runs"]
        if any(run["test_hash"] != expected for run in runs):
            raise ValueError("Qualification hash mismatch")
        status = disposition(runs)
        if status != item["status"]:
            raise ValueError("Inconsistent qualification")
        if status == "kept":
            kept[name] = expected
    return kept


def dashboard_suites(root):
    summaries = []
    for path in sorted(root.glob("*/manifest.json")):
        directory = path.parent
        try:
            manifest = verify(directory)
            tests = manifest["tests"]
            counts = dict(proposed=manifest["proposed"], approved=len(tests), kept=0, dropped=0)
            receipt = directory / "qualification.json"
            if receipt.exists():
                counts["kept"] = len(qualified_tests(directory))
                counts["dropped"] = len(tests) - counts["kept"]
            summaries.append(dict(target=directory.name, counts=counts))
        except (OSError, ValueError, KeyError, TypeError):
            summaries.append(dict(target=directory.name, counts=None))
    return summaries
