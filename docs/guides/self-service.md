# Local dashboard project workflow

## What is implemented

The dashboard now provides source ZIP import, compatibility preflight, explicit
acceptance-test review and approval, and a Start full battle control. The full
battle uses the existing validated runner, fixed supported modes, a fresh Codex
Builder session, three attempts maximum and unchanged Kane acceptance tests.
Each Kane phase has an isolated Chrome live observer view. Stage records and
final verdicts use the existing local SQLite history. Starting a battle is an
explicit local action; opening the page or importing a ZIP never starts agents.

## One-time local setup

Install the repository dependencies, Chrome, Kane CLI and Codex CLI. Sign in to
Kane and Codex using their normal login commands. To use live Gemini proposals,
configure GEMINI_API_KEY and GEMINI_MODEL in the terminal environment, confirm
that billing is disabled and the selected model is available free, and set
ARENA_GEMINI_FREE_TIER_CONFIRMED=1. Do not paste keys into the dashboard.

Start Arena from that same configured terminal:

```powershell
$env:ARENA_ENABLE_LIVE_KANE = "1"
.\.venv\Scripts\python.exe app.py
```

On macOS/Linux, use `ARENA_ENABLE_LIVE_KANE=1 .venv/bin/python app.py`.
An Arena process started in another terminal does not inherit keys configured
later in your VS Code terminal. Restart it from the configured terminal. The
preflight shows only CLI presence/configuration, not a promise of valid login,
remaining credits or API availability. Execution reports actual failures.

## Judge flow

1. Open `/arena` locally. The setup controls work even with empty battle history.
2. Choose **Use built-in BreakShop** or **Try SeatPilot ticket booking**, or upload a source ZIP (maximum 20 MB,
   expanded maximum 80 MB; exclude dependencies and build artifacts). The exact
   SeatPilot AI Studio export in this repository is recognized by a reviewed
   source manifest. Its ZIP can include the ordinary source files; `.env.example`
   is excluded, and dependencies/build output should be omitted.
3. Read compatibility and prerequisite checks. Unsupported imports are inspection
   only, with no install scripts, application startup or agent execution.
4. Open the acceptance test, review its scope and hash, and explicitly check the
   approval box. Approval is reset when the selected project changes.
5. Choose Gemini, or the explicitly labeled scripted controlled-demo mode.
   Missing Gemini setup blocks Gemini launch; it never silently changes modes.
6. Start full battle. Watch the read-only live viewport and public progress.
   Do not interact with the pop-up Chrome. The runner owns its local copies,
   processes and separate fresh application databases.
7. Inspect the resulting phase verdicts, recognized recorded amounts, evidence
   screenshots and final classification. Infrastructure problems and escapes are
   not relabeled as repaired application defects.

## Supported imports and remaining work

**The established full-battle demos** are the built-in BreakShop app and the exact
recognized SeatPilot source export. BreakShop imports must match the canonical
Python application AST and keep the expected Jinja execution structure. The
SeatPilot adapter supplies a reviewed Flask API, separate fixed Kane test and
independent saved-booking/inventory invariant. It builds the React UI from the
reviewed repository copy; only the API client and the sample-booking label differ
from the supplied design source. The uploaded ZIP's scripts and dependencies are
never executed or installed. Its accepted source must match the known manifest.

**A separate Kane-generated judge path** accepts the bundled Museum sample or a
ZIP matching the narrow [LOCAL static-data contract](local-adapter-contract.md).
Kane designs its browser test from that contract, Arena checks two fresh healthy
copies, and the operator reviews Gemini's fault. This path runs no imported
scripts or server code. The [recorded Museum runs](../evidence/museum-generated-healthy.md)
prove test qualification only; a live end-to-end judge battle is still unverified.

This is not general React or arbitrary-project support. Other imports remain
inspection-only until they have a reviewed startup adapter, explicit
fault allowlist, independent direct invariant and locked acceptance test. URL-only
fault injection/repair is not supported: changing an isolated app requires source
code. SeatPilot is fictional demo data with no real payments, and a live Kane
battle on the uploaded SeatPilot site has not yet been recorded.

Known environment/key files, Git metadata, dependencies, databases, evidence and
caches are excluded from imports. ZIP paths, symlinks, encryption, duplicate names
and size limits are checked before writing source. Source manifests are checked
again before preparing a run. Imports and logs stay in ignored instance storage;
no arbitrary path, command, CDP control or evidence-download endpoint is exposed.
Local ZIP metadata checks are not a complete secret scanner.

## Validation

Offline unit tests use labeled fixtures and never count as live battle proof.
Actual dashboard-driven runs, when performed, are documented under docs/evidence.
A mocked pass is never substituted for a failed login, browser or agent call.
