# SeatPilot generated regression suite

Open `/arena`, choose **SeatPilot generated suite**, review the test and its hash, select a Breaker, and approve the launch. Local execution, Kane sign-in, Chrome, Node/npm and Codex are required. Gemini additionally requires its free-tier environment and the locally saved SeatPilot flow map. Scripted mode uses a controlled pricing change and still consumes Kane browser credits.

The original curated buttons retain their existing suites. The generated route currently supports the bundled SeatPilot app and one qualified catalog test. It compares the successful local HTTP quote for two tickets with EARLY15 across isolated app versions. The generated mode accepts only the adapter's existing numeric pricing edits. A missing probe, response-schema error, or identical quote prevents an escape or catch from being counted. A caught fault enters the existing bounded repair loop. Completion requires the original quote and another pass of the locked regression.

The generic probe helpers support JSON HTTP responses and read-only SQLite queries. Each new app still needs a reviewed source adapter and a repeatable observation that excludes random identifiers and timestamps.

## Review an escaped flow

A confirmed escape creates `coverage-gap/requirements.md` and private snapshot fingerprints inside its ignored battle folder. The requirements contain healthy quote values only. Use the gap's empty `proposed` directory as Kane's working directory. Ingest the note locally, extract a use case, and have the owner review it. Run design once against the approved use case. Review the proposed test and record its exact SHA-256 before evaluation.

From the repository root, use the project Python to run:

```powershell
.\.venv\Scripts\python.exe -m buildbreak.coverage_gap <battle-id> <proposed_test.md> --approved-sha256 <reviewed-sha256>
```

This command recreates the escaped and healthy copies with fresh databases, checks the saved fingerprints and quote observations, and runs the same test against them. Promotion requires a sealed failure on the broken copy and two distinct sealed passes on the healthy copy. The approved follow-up is saved in its own generated suite. The original escape remains in battle history.

If the broken run already has complete sealed evidence, `--resume-broken` rechecks its test bytes, final event verdict, evidence identifier, hash and target URL before running the two healthy copies. It writes a separate recheck receipt and preserves the original result. It refuses to overwrite a healthy attempt or silently retry a failed qualification.

## Select a promoted suite for a battle

The dashboard retains its catalog suite. The separate CLI can select another qualified SeatPilot suite by name and exact digest:

```powershell
.\.venv\Scripts\python.exe -m buildbreak.seatpilot_runner --generated-suite <suite-name> --approved-sha256 <approved-sha256> --breaker gemini --max-attempts 3 --show-browser
```

On macOS/Linux replace the Python path with `.venv/bin/python`. The command refuses an unqualified or changed suite. Configure the environment-only Gemini key, an available free-tier model and `ARENA_GEMINI_FREE_TIER_CONFIRMED=1` in the launching shell; do not place credentials in command arguments or files. Kane and Codex must already be authenticated. A failed proposal can trigger the existing controlled fallback; the recorded producer must be reported accurately.

This route still uses the bundled SeatPilot adapter and numeric pricing edits. It does not import arbitrary applications. Each selected suite contains one qualified test; catalog and pricing suites remain separate so their results are not confused.

## Export line endings

Export recognition normalizes CRLF to LF for reviewed HTML, TypeScript, CSS and JSON source files. Adapted manifests use those normalized hashes. Images remain byte-exact. This normalization does not apply to acceptance-test hashes, saved evidence or runtime snapshot protection.
