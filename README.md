# BreakShop

BuildBreak Arena now includes a local replayable battle runner. See
[the runner guide](docs/replayable-battles.md) for setup, its protected test
contract, private evidence storage, and honest limits. Start the main app and
open `/arena` to see automatically recorded runner events.

The Arena view separates baseline, broken-app and repaired-app verdicts. Choose
among recent recorded battles; expand the timeline, evidence references, or
method details when needed. Times are shown in IST. Its three-second refresh
retains open detail panels and shows a connection warning if refresh fails.
For presenting the project, use the [three-minute demo guide](docs/demo-guide.md).

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker codex --builder codex --max-attempts 3
```

This command requires your own authenticated Kane CLI and Codex CLI sessions.
It uses separate Codex contexts for controlled fault selection and repair,
and real Kane browser runs. It does not assume an API key or ship credentials.
It operates on an explicit snapshot of the current working tree and keeps the
main app unchanged. A maximum of three repair attempts is enforced.

The stronger checkout baseline and the manually orchestrated second battle
are documented in [checkout consistency](docs/checkout-consistency.md).

Small Flask + SQLite demo shop with HTML, CSS, and vanilla JavaScript. Prices are USD; integer cents and decimal half-up discount rounding keep totals accurate. SAVE10 deducts 10%; no tax or shipping is charged. No real payment is collected.

## Windows PowerShell setup

Open PowerShell in your downloaded or cloned BuildBreak folder, then run these commands.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m unittest -v
.\.venv\Scripts\python.exe app.py
```

Open http://127.0.0.1:5000. Stop with Ctrl+C. No environment activation is needed.

Products have labeled quantities (1-99); set zero or use Remove to remove an item. Apply SAVE10, enter checkout details, and place an order. Use Start a new order on the confirmation page to shop again.

Orders persist in instance/shop.sqlite3. Each checkout session has a unique token; a database uniqueness constraint prevents repeat submissions from creating duplicate orders. Confirmation access requires the same browser session. A random development session secret is generated on startup, so restarting clears access to previous sessions. Optionally set $env:SECRET_KEY to a private random value before launching for session continuity. Never commit secrets. This local demo uses Flask's development server.

Tests use temporary databases inside this folder and cover pricing/rounding, cart changes, invalid quantities, checkout validation, discounts, duplicate submissions, server-authoritative totals, and confirmation access.

The Kane BuildBreakSetupCheck passed against example.com (Example Domain).

The Kane BreakShopDiscountBaseline passed against the local BreakShop app. It added two Arena T-shirts, observed a $39.98 subtotal, applied SAVE10, and verified a $35.98 final total. This verifies only that tested flow. Checkout, saved orders, duplicate-order protection, and other cart combinations were outside that browser test.

Useful Kane test definitions are included in .testmuai/tests/. Evidence archives and generated run outputs are preserved locally and excluded from Git.

## Historical Arena dashboard

Open `/arena` on the main BreakShop server. The shop and dashboard link to each other. Restart the main Flask server after updating the code.

The read-only dashboard uses `instance/arena.sqlite3`. A fresh installation displays an empty state until an operator explicitly imports saved evidence. Missing evidence does not prevent startup. Recorded results persist independently of current local evidence availability.

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

The importer supports the preserved first-challenge report and action-log format. It validates both runs before writing records and can be repeated without duplicates. Missing required report files stop the import without creating sample battles. The pack is optional for import and its availability is checked separately. Baseline, deliberate fault, and repair descriptions are human-reviewed provenance from `docs/first-battle.md`; result statuses and amounts are extracted from the saved runs. The expected amount is calculated from the unchanged 10% acceptance criterion.

Raw evidence stays local. The web page displays summary records and file availability only. It has no command execution or evidence download route. Availability means that the configured file exists, not that a hosted viewer is running. It is checked when the page is loaded. Custom local configuration can set Flask's `ARENA_SOURCES` and `ARENA_DATABASE`; the defaults are the two files in `instance` above.

A fresh checkout does not include the private source configuration, SQLite records, or raw evidence. It starts with an empty Arena. To reproduce the historical view, obtain the genuine preserved before/after reports and logs locally, configure their paths as above, and explicitly run the importer. Without those files, leave the dashboard empty. The ArenaDashboardBaseline Kane definition expects an already imported historical battle.
