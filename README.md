# BuildBreak Arena

Check whether your browser acceptance test catches a deliberate logic regression,
then whether a coding agent can repair it while the test stays unchanged.
Arena coordinates that drill and records the evidence. **BreakShop is the supported
demo app; this is not yet a runner for arbitrary websites.**

## Five-minute quickstart

From the repository folder, start the local app without any API keys or agent
logins. Dependency downloads can take longer on a slow connection.

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

macOS / Linux:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app.py
```

Open [BreakShop](http://127.0.0.1:5000) and [Arena](http://127.0.0.1:5000/arena).
Try two shirts and one sticker pack with SAVE10: $44.97 subtotal, $4.50 discount,
$40.47 total. Use fictional checkout details; no payment is taken. Stop with
Ctrl+C. No virtual-environment activation is required.

**A fresh Arena is honestly empty.** For examples before running agents, read
[SAMPLE report: sanitized recorded drills](docs/sample-report.md). It summarizes
existing historical records, not a new execution, and inserts no fake history.
A new real battle needs your authenticated Kane/Codex CLIs, local Chrome and
their available allowances; it is separate from this app-only quickstart.
Raw evidence and private fault caches are not shipped in a clone.

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

```sh
.venv/bin/python battle_runner.py --breaker codex --builder codex --max-attempts 3
```

This command requires your own authenticated Kane CLI and Codex CLI sessions.
It uses separate Codex contexts for controlled fault selection and repair,
and real Kane browser runs. It does not assume an API key or ship credentials.
It operates on an explicit snapshot of the current working tree and keeps the
main app unchanged. A maximum of three repair attempts is enforced.

## Optional Gemini Breaker and validated cache

BuildBreak Arena is the battle runner; BreakShop is its supported demonstration
application. The optional Gemini mode adds **LLM-generated fault injection under
validation**. It does not predict production incidents or discover arbitrary
vulnerabilities. The original `scripted` and `codex` controlled-fault modes remain
available as the demonstration fallback.

Read [Gemini setup and validation](docs/gemini-breaker.md) before using:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker gemini --builder codex --max-attempts 3
```

```sh
.venv/bin/python battle_runner.py --breaker gemini --builder codex --max-attempts 3
```

This mode requires a locally configured `GEMINI_API_KEY`, an explicitly selected
`GEMINI_MODEL`, and confirmation that its project has billing disabled and the
model has free-tier access. Arena cannot verify billing status from an API key.
No paid model fallback is configured. Kane and Codex retain their own account
usage requirements.

The healthy app must pass its application tests, an independent saved-order
check, and the existing approved Kane checkout test. Each generated patch is
limited to one explicit family in `app.py`: pricing arithmetic/saved amounts,
or the cart quantity guard's upper cap. A candidate
is validated in a disposable copy: protected hashes must match, HTTP startup
must work, some app tests must pass and some assertions must fail without test
errors, and that family's independent direct check must fail. At most three proposals are
requested before a separately validated controlled fallback. The private record
and existing battle mode field identify which producer actually supplied the
accepted fault.

The direct check uses a fresh database and fixed expectations of 4497 / 450 /
4047 cents for two shirts, one sticker pack, and SAVE10. It reads persisted
order amounts instead of trusting browser text or the app's pricing function.
The second family's separate API/session probe checks acceptance of 99 items,
rejection of 100 without cart changes, and removal at zero. A 99-to-100 cap fault
can leave the unchanged Kane checkout scenario passing: an honest suite gap.
Only faults demonstrated by one of these explicit invariants are accepted.
The quantity family has local and mocked tests; a live agent battle is unverified.

Codex receives broken source and Kane failure evidence, without the fault patch,
description or healthy source in its supplied context. A repair must pass the
automated tests, direct check and unchanged Kane test. A validated fault passing
Kane is recorded as `not_detected` with an explicit escape event; infrastructure
failures do not count as escapes or detections. Arena records the actual producer,
live/cached/controlled source, model, cache identity and classified outcome.

Local/offline tests cover the API contract, validator and runner branches. Their
mocked Gemini/Kane/Codex responses are test fixtures, not live battle evidence.
A genuine Gemini-to-Kane-to-Codex battle completed on November 14, 2026 using
`gemini-3.5-flash-lite`, with no fallback and one repair attempt. Kane detected
the generated 15% discount; the independent check confirmed a $38.22 saved total
instead of $40.47. See [the genuine run account](docs/gemini-first-battle.md).
This verifies one checkout drill, not general fault discovery.

Generate up to three proposals using your own configured free-tier Gemini key;
only validated patches are kept under ignored `instance/fault-cache/`:

```powershell
.\.venv\Scripts\python.exe cache_faults.py --count 3
```

```sh
.venv/bin/python cache_faults.py --count 3
```

Replay one printed cache filename without a Gemini API key or live Gemini call:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker cached --cached-fault "instance/fault-cache/CACHE_ID.json" --builder codex --max-attempts 3
```

```sh
.venv/bin/python battle_runner.py --breaker cached --cached-fault instance/fault-cache/CACHE_ID.json --builder codex --max-attempts 3
```

Replay still needs authenticated Kane/Codex and uses their allowances. Cache
records are tied to the app and protected test hashes and undergo full mutation
validation again. They are local, unsigned provenance records, not a trusted code
distribution format. A fresh checkout has no private caches, evidence or history.

A real cached replay completed on November 15, 2026 with a caught fault and
first-attempt verified repair, without a Gemini call during replay. See
[the cached replay record](docs/cached-replay.md). This replay reused the earlier
generated fault; it is another execution, not another independently generated bug.

The dashboard labels caught-and-repaired, caught-needing-human-review and confirmed
escapes. Its counts cover only independently validated scored executions among
the ten displayed recent records. Interrupted, unfinished and unvalidated records
and requirements-only experiments are excluded. Repeated cached faults are executions, not additional distinct bug
types. Counts are measurements for these drills, not a website quality score.
To enrich supported older records without rewriting their verdicts, explicitly
run `.\.venv\Scripts\python.exe import_drill_history.py` on Windows or
`.venv/bin/python import_drill_history.py` on macOS/Linux; missing or inconsistent
artifacts remain unclassified.

The [Kane feasibility gate](docs/kane-feasibility.md) records one bounded local
exploration and a separately generated, owner-approved eight-step test that
passed once on healthy BreakShop. This was a manual CLI workflow; automated
flow-to-test onboarding, suite versioning, arbitrary-app support and public
posting are not implemented. The runner's protected checkout test remains unchanged.

## What this does and does not prove

- A scored drill establishes a result for a specific validated fault and frozen
  browser scenario. Repeating a cached fault is not broader coverage or a reliable
  production detection/repair rate.
- Quantity checks can expose an escape outside that browser scenario. They do
  not automatically create a new acceptance test or prove all quantity behavior.
- The Builder receives written requirements with expected amounts as well as
  evidence. We have not established that Kane feedback is necessary for repair.
  The [requirements-only comparison option](docs/builder-ablation.md) withholds
  that feedback, allows one attempt and stays outside normal drill scores.
  Its implementation tests are offline; no live comparison has run yet.
- App subprocess environments and repair AST checks reduce accidental exposure.
  They are not an OS sandbox. See [the execution boundary](docs/execution-boundary.md).
- A passing drill does not establish full-app correctness, deployment safety,
  arbitrary vulnerability discovery or support for other websites. Infrastructure
  failures stay separate from confirmed application defects.

Verification in this development session ran on Windows. The macOS/Linux
commands are provided for setup; those operating systems have not been tested here.

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

macOS / Linux equivalent:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m unittest -v
.venv/bin/python app.py
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

Raw evidence stays local. The web page displays summary records and file availability only. It has no command execution or evidence download route. Availability means that the configured file exists, not that a hosted viewer is running. It is checked when the page is loaded. Custom local configuration can set Flask's `ARENA_SOURCES` and `ARENA_DATABASE`; the defaults are the two files in `instance` above.

A fresh checkout does not include the private source configuration, SQLite records, or raw evidence. It starts with an empty Arena. To reproduce the historical view, obtain the genuine preserved before/after reports and logs locally, configure their paths as above, and explicitly run the importer. Without those files, leave the dashboard empty. The ArenaDashboardBaseline Kane definition expects an already imported historical battle.
