# Import the earlier historical dashboard

These steps reproduce the first human-triggered experiment from genuine local files.
Runner battles are recorded automatically and need no historical importer.


Open `/arena` on the main BreakShop server. The shop and dashboard link to each other. Restart the main Flask server after updating the code.

The read-only dashboard uses `instance/arena.sqlite3`. A fresh installation displays an empty state until an operator runs a real battle or explicitly imports genuine saved evidence. Missing evidence does not prevent startup. Recorded results persist independently of current local evidence availability.

Create a private `instance/arena-sources.json` with this structure, replacing each value with the corresponding local file path. Use forward slashes or escaped backslashes in JSON. Keep this file in the ignored `instance` directory.

```json
{
  "before": {
    "report": "path/to/preserved-failed/Result.md",
    "metadata": "path/to/preserved-failed/.internal/meta.json",
    "actions": "path/to/preserved-failed/.internal/steps/step/flows/0/actions.ndjson",
    "pack": "path/to/failed.evidence"
  },
  "after": {
    "report": "path/to/preserved-passed/Result.md",
    "metadata": "path/to/preserved-passed/.internal/meta.json",
    "actions": "path/to/preserved-passed/.internal/steps/step/flows/0/actions.ndjson",
    "pack": "path/to/passed.evidence"
  }
}
```

From the repository root, explicitly import the first historical discount challenge:

```powershell
.\.venv\Scripts\python.exe import_battle.py --sources instance/arena-sources.json
.\.venv\Scripts\python.exe -m unittest -v
.\.venv\Scripts\python.exe app.py
```

```sh
.venv/bin/python import_battle.py --sources instance/arena-sources.json
.venv/bin/python -m unittest -v
.venv/bin/python app.py
```

The importer supports the preserved first-challenge report and action-log format. It validates both runs before writing records and can be repeated without duplicates. Missing required report files stop the import without creating sample battles. The pack is optional for import and its availability is checked separately. Baseline, deliberate fault, and repair descriptions are human-reviewed provenance from `docs/first-battle.md`; result statuses and amounts are extracted from the saved runs. The expected amount is calculated from the unchanged 10% acceptance criterion.

Raw evidence stays local. The historical section displays summary records and file availability. Runner battles additionally show selected, hash-matched screenshots; raw evidence packs cannot be downloaded through the dashboard. There is no web command execution route. Availability means that the configured file exists, not that a hosted viewer is running. It is checked when the page is loaded. Custom local configuration can set Flask's `ARENA_SOURCES` and `ARENA_DATABASE`; the defaults are the two files in `instance` above.

A fresh checkout does not include the private source configuration, SQLite records, or raw evidence. It starts with an empty Arena. To reproduce the historical view, obtain the genuine preserved before/after reports and logs locally, configure their paths as above, and explicitly run the importer. Without those files, leave the dashboard empty. The ArenaDashboardBaseline Kane definition expects an already imported historical battle.
