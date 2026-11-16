# Gemini Breaker: local setup and first-stage limits

This is an optional addition. Existing controlled-fault commands continue to work.
A real Gemini 3.5 Flash-Lite battle completed on November 14, 2026; see
[the preserved-run account](../evidence/gemini-first-battle.md). Offline orchestration fixtures
remain separate and are not evidence of a live workflow.

## Configure locally without sharing the key

1. Open [Google AI Studio](https://aistudio.google.com/api-keys). Create an API key
   for a project with billing disabled. Keep the key private.
2. Check the project's available model and free-tier quota in AI Studio and
   [official pricing](https://ai.google.dev/gemini-api/docs/pricing). Availability
   varies; this project intentionally selects no default model. A model being
   listed does not establish free access for your project.
3. In the same PowerShell terminal you will use to launch Arena, read the key
   with hidden input. These variables are process-local; nothing is written
   to `.env` or source files:

```powershell
Set-Location C:\path\to\BuildBreak
$arenaKeyInput = Read-Host 'Paste Gemini API key (hidden)' -AsSecureString
$arenaKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($arenaKeyInput)
try {
    $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($arenaKeyPointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($arenaKeyPointer)
    Remove-Variable arenaKeyInput, arenaKeyPointer
}
$env:GEMINI_MODEL = Read-Host 'Exact model ID verified as available on your free tier'
```

4. Only after confirming billing is disabled and free quota is available:

```powershell
$env:ARENA_GEMINI_FREE_TIER_CONFIRMED = '1'
.\.venv\Scripts\python.exe -c "from gemini_breaker import configuration; configuration(); print('Local configuration present; no API request made.')"
```

The confirmation is an operator assertion, not automatic billing verification.
This preflight checks only local configuration. Do not print the key or send it
in a chat. A terminal you already opened does not inject its new environment
variables into a separate Codex process. Launch the battle from that configured
terminal:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker gemini --builder codex --max-attempts 3
```

Kane and Codex must already be installed and authenticated. Kane consumes its
own credits. If a CLI is installed but absent from the launching terminal's PATH,
the runner also reads an optional private `instance/cli-paths.json` object mapping
`codex` or `kane-cli` to an absolute executable path. This file is Git-ignored,
is not copied into agent contexts, and must be updated if an app upgrade moves
the executable. Commands found on PATH take precedence.

When finished, close the terminal or remove the API key:

```powershell
Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
```

## Contract and safeguards

### Diagnose API access without a full battle

From the terminal containing your environment variables:

```powershell
.\.venv\Scripts\python.exe -m buildbreak.gemini_breaker --diagnose
```

This sends one small structured inference request using the configured model.
It uploads no app source, injects no fault and calls neither Kane nor Codex.
It uses Gemini's project quota. A safe summary is printed and saved under ignored
`instance/gemini-diagnostics/<id>/result.json`. It distinguishes HTTP status,
timeout, network/TLS problems, invalid JSON, incomplete output and token limits.
Keys, provider response bodies and generated content are not saved. A successful
diagnostic proves this small request worked, not that fault generation or a
complete battle works. A new diagnostic does not rewrite earlier battle results.

The runner now waits 2 and 4 seconds before retrying temporary API failures
within the existing three-request cap. Permanent API failures such as HTTP 400,
403 and 404 stop API retries and proceed to the validated controlled fallback.
There is no automatic model switch or billing change. Error classification is
based on [Google's troubleshooting guidance](https://ai.google.dev/gemini-api/docs/troubleshooting).

### Patch validation

Gemini uses the REST `generateContent` endpoint with JSON schema output,
documented in the [official API reference](https://ai.google.dev/api/generate-content).
The only accepted fields are `file`, `old_text`, `new_text`, `description`.
Only `app.py` is allowed. The old fragment must appear exactly once. Each fragment
is bounded to six lines and 500 characters. The parsed Python must preserve all
structure except ONE of two explicit families: (1) numeric constants/arithmetic
operators in `pricing()` and the three saved amount variable references in the
orders INSERT; (2) only the integer upper cap in `cart()`'s `0 <= quantity <= 99`
guard, constrained to 1 through 100. Mixed-family edits are rejected. Imports, new calls,
routes, authentication, test and configuration changes are rejected.

The runner validates each candidate before touching its working copy. It copies
only the baseline manifest, boots a local HTTP server, runs `test_app`, and runs
the independent checkout fixture against a new SQLite database. A valid mutation
must produce assertion failures and genuine passing app tests with no test errors,
plus failure of the selected independent invariant. Pricing keeps the existing
persisted-amount fixture unchanged. Quantity uses a separate API/session probe:
accept 99, reject 100 without changing the cart, remove at zero. That probe must
pass on healthy source before the candidate can be accepted. A no-op or a mutation
outside both invariants is unproven and rejected.
Protected file hashes are checked before and after candidate execution.

Changing the cap to 100 leaves the protected two-shirt/one-sticker checkout
scenario healthy while violating the quantity invariant. If Kane passes, the
runner records an escape and starts no repair. This identifies a gap in that
particular test, not a general weakness of Kane. Family and invariant are stored
in validation metadata and battle history. Existing version-1 pricing caches
remain supported; quantity caches use the same format and are fully revalidated.
The new family has local probe and mocked orchestration tests; no live Gemini,
Kane or Codex battle has verified it yet.

Up to three rejected proposals/API errors trigger a controlled saved-total fallback
(permanent API errors stop retries early),
which undergoes the same validator. This is attributed as `controlled-fallback`,
not a successful Gemini challenge. Provider errors are sanitized; API response
bodies and request headers are not logged. `GEMINI_API_KEY` and `GOOGLE_API_KEY`
are stripped from app, test, Kane and Codex subprocess environments.

The Builder's supplied context contains only the broken app and genuine Kane
failure feedback. Fault JSON and validation artifacts stay outside that context.
Context separation is not an OS security boundary. Builder source validation
retains syntax, route, test and hash guardrails and rejects added sensitive
imports/calls. See [the local execution boundary](execution-boundary.md) for
environment isolation and its limits. It is not a proof that repair code is safe.

## Results and limits

- `completed`: automated tests, direct check and Kane verified the repair.
- `needs_human`: no verified repair within the allowed attempts.
- `not_detected`: independently validated fault passed the selected Kane test;
  the event explicitly describes the escape. No repair is automatically attempted.
- `infrastructure_error`: execution could not establish a verified result.
- `baseline_blocked`: healthy app checks did not pass; no fault accepted.

## Validated cached faults

From the configured terminal, request a small batch:

```powershell
.\.venv\Scripts\python.exe -m buildbreak.cache_faults --count 3
```

`--count` is the maximum number of proposal requests (1–10), not a promise of
that many distinct valid faults. Each proposal gets its own validation copy.
Rejected proposals never become cache entries; identical entries deduplicate.
No controlled fallback is presented as a Gemini cache. This generator uses no
Kane or Codex calls. It checks the healthy app first and uses the same boot,
partial-test-failure, protected-hash and independent-invariant validator.

To reuse a genuine saved Gemini proposal without another API call:

```powershell
.\.venv\Scripts\python.exe -m buildbreak.cache_faults --from-battle 20261114T181556-024e132e
```

This needs that private local battle's files and requires the app/test bindings
to match. It revalidates the proposal against the current snapshot. A fresh clone
does not have those private artifacts. It must generate its own cache or use the
existing controlled-fault mode.

To replay a printed cache identity:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker cached --cached-fault "instance/fault-cache/CACHE_ID.json" --builder codex
```

Cached mode does not call Gemini or require a Gemini key. It still calls Kane
and Codex, using their account allowances. A cache is bound to `app.py`,
`test_app.py` and the protected Kane test; an identity change or mismatched binding
is rejected before Kane starts. Matching caches still undergo full runtime
validation before injection. An invalid cache stops rather than silently switching
faults. The cache's patch and description are outside the Builder's supplied context.

Records under `instance/fault-cache/` include only the patch, model, content
identity, source/test hashes and optional origin battle identifier. They are
Git-ignored. They contain no full healthy source, raw evidence or credentials.
Local content hashes detect changes, but do not authenticate model authorship;
these files are not signed provider attestations or a secure third-party package
format.

## Battle history and Arena reports

New runs store sanitized producer/source/model/cache/outcome fields in a separate
`arena_drill_details` table, preserving the legacy session schema and original
verdicts. Current workflows update classifications as they finish. The read-only
dashboard displays the actual producer and source, explicit fallback attribution,
and one of the three scored outcomes. Infrastructure, blocked baselines, waiting
handoffs and in-progress battles remain unscored. The configured attempt ceiling
is recorded for new runs; older records show only the global safety ceiling.

For supported saved live Gemini/fallback records, explicitly run:

```powershell
.\.venv\Scripts\python.exe -m buildbreak.import_drill_history
```

This verifies the preserved mutation validation, protected files, source patch,
test hashes and evidence identities before adding metadata. It does not change
session rows, original verdicts, fault files or evidence packs. Repeating it adds
no duplicates. Missing or unsupported provenance remains unclassified.

Recent counts include only independently validated terminal drills with a
consistent scored outcome among the ten displayed sessions. Detection is caught
drills divided by scored drills; repair is verified repairs divided by caught
drills with a completed repair outcome. Human handoffs and interrupted attempts
do not enter those denominators. Cached repetitions count as executions, not new
fault types. This is no estimate of total real-world bug coverage.

## Remaining limits

The check supports one known checkout invariant. It does not prove arbitrary
fault validity or full website correctness. A Kane failure and a confirmed mutation
are associated observations, not a general proof of causal attribution for every
possible assertion. One run per phase is used; broad flakiness detection is not
implemented. Test discovery/approval, new suite versions and broader app support
remain later work. No protected Kane test
is changed, generated or weakened by this mode.

All private snapshots, failed proposals, checks, databases and evidence stay under
ignored `instance/battles/<id>/`. Existing `.env`, key and evidence ignore rules
remain in effect. Nothing is automatically committed, pushed or published.
