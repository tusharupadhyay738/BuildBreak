"""Explicit local import: python import_battle.py --sources PRIVATE_JSON."""
import argparse
import json
import re
import sqlite3
from contextlib import closing
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from arena import SCHEMA

INSTRUCTION = "Add a product to the cart, set its quantity to 2, apply SAVE10, and verify that the final total equals the subtotal minus a 10 percent discount."

def read_run(source, phase):
    report = Path(source["report"]).read_text(encoding="utf-8")
    metadata = json.loads(Path(source["metadata"]).read_text(encoding="utf-8"))
    actions = [json.loads(line) for line in Path(source["actions"]).read_text(encoding="utf-8").splitlines() if line.strip()]
    if INSTRUCTION not in report:
        raise ValueError("Acceptance instruction does not match")
    status = re.search(r"^status: (passed|failed)$", report, re.M)
    if not status or not metadata.get("executions"):
        raise ValueError("Missing recorded result")
    execution = metadata["executions"][-1]
    if execution["status"] != status[1]:
        raise ValueError("Report and metadata disagree")
    if not any(action.get("action_params", {}).get("url") == "http://127.0.0.1:5001" for action in actions):
        raise ValueError("Challenge target was not recorded")
    if not any(action.get("action_params", {}).get("text") == "SAVE10" for action in actions):
        raise ValueError("SAVE10 entry was not recorded")
    assertions = [action for action in actions if action.get("action_type") == "assert"]
    expected_status = "success" if status[1] == "passed" else "failed"
    if not assertions or assertions[-1]["status"] != expected_status:
        raise ValueError("Assertion and report disagree")
    amounts = {}
    for action in actions:
        params = action.get("action_params", {})
        key = params.get("key")
        value = action.get("output_value")
        if key in ("subtotal", "final_total") and isinstance(value, str) and value.startswith("$"):
            amounts[key] = value[1:]
        if key == "final_total_discount_check" and len(params.get("locators", [])) == 2:
            matches = [re.search(r"\$(\d+\.\d{2})", locator) for locator in params["locators"]]
            if all(matches):
                amounts.update(subtotal=matches[0][1], final_total=matches[1][1])
    subtotal = int(Decimal(amounts["subtotal"]) * 100)
    actual = int(Decimal(amounts["final_total"]) * 100)
    discount = int((Decimal(subtotal) * Decimal("0.10")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    return ("discount-regression", phase, execution["execution_id"], status[1], subtotal, subtotal - discount, actual)

def import_battle(sources_path, database):
    sources = json.loads(Path(sources_path).read_text(encoding="utf-8"))
    rows = [read_run(sources[phase], phase) for phase in ("before", "after")]
    # Human-reviewed provenance from docs/first-battle.md; outcomes come from evidence.
    battle = ("discount-regression", "219a3e006221296cb0158ce85b66e3280a0bb02a", "SAVE10 multiplier deliberately changed from 0.10 to 0.05.", "Builder restored the multiplier from 0.05 to 0.10. No separate repair commit or timestamp recorded.")
    Path(database).parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database)) as connection:
        connection.executescript(SCHEMA)
        with connection:
            connection.execute("INSERT OR REPLACE INTO battles VALUES (?,?,?,?)", battle)
            connection.executemany("INSERT OR REPLACE INTO battle_runs VALUES (?,?,?,?,?,?,?)", rows)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", required=True)
    parser.add_argument("--database", default="instance/arena.sqlite3")
    args = parser.parse_args()
    try:
        import_battle(args.sources, args.database)
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f"Import failed; no battle records written: {error}\n")
    print("Imported historical battle from saved evidence.")
