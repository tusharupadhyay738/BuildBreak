# Replayable local battles

A full Codex Breaker / Codex Builder battle has completed with real Kane
baseline, failure, and repaired pass evidence. See
[the first automatic battle record](first-automatic-battle.md).

The runner snapshots an explicit allowlist from the current working tree,
records its Git HEAD and per-file hashes, and creates an isolated Flask app
and database under ignored `instance/battles/<id>/workspace`. It does not
reset main, switch branches, rewrite history, or copy old project files.
Uncommitted baseline additions are identified as an explicit snapshot rather
than falsely attributed to the Git commit alone.

Each baseline, broken-app check, and repair retest starts a fresh private shop
database stored beside the battle artifacts. Earlier databases are retained.
This makes the first order deterministic for recorded replay; it avoids a
captured order-number assertion from one phase being reused against a later
order number. The acceptance test and expected amounts stay unchanged. This
scenario verifies a first order in each fresh fixture, not arbitrary order IDs.

## Prerequisites

Install the normal project dependencies in `.venv`. Kane CLI must be available
and authenticated using your own account. For Codex roles, install Codex CLI
and sign in yourself; verify with `codex login status`. The local runner reuses
that existing login. No API key is embedded or assumed. These commands can use
your account credits/usage limits and need network access plus local Chrome.

Use this command for an operator-controlled fault and human repair handoff:

```powershell
.\.venv\Scripts\python.exe battle_runner.py
```

Use separate noninteractive Codex sessions for Breaker selection and Builder
repair proposals:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker codex --builder codex --max-attempts 3
```

Open `/arena` on the main app. It polls read-only `/arena/live` every three
seconds. The local CLI is the only execution entry point; web requests cannot
start shell commands. A fresh installation has no battle rows until an actual
run creates them. Existing historical first-battle imports still work.

## What happens, and why

1. A healthy baseline must pass all five frozen checkout steps before a fault
   is introduced. The test includes independent known-price expectations,
   cart, fictional checkout, and confirmation reload.
2. The scripted Breaker uses the saved-order-total fault. The Codex Breaker
   chooses independently between two controlled faults. This is AI selection
   from a library, not discovery of arbitrary unknown vulnerabilities.
3. Only application code is faulted. Kane runs with adaptive healing disabled.
   The runner waits for the final file summary, final completion event, process
   exit, and a preserved evidence pack; an intermediate step pass is insufficient.
   Sealed metadata must agree on run identity, verdict, test hash, and target.
   A replay may retain older authoring output; those files are archived as
   `cached-authoring-output`, with a provenance note, never treated as the
   report for the new replay. The current events and pack remain authoritative.
   Some replay assertion failures are sealed as `broken`. These are accepted
   as verification failures only when the current stream contains a failed
   assertion and the same pack records a triaged application issue caused by
   `assertion_failed` replay execution. An untriaged or browser/system failure
   stays an infrastructure error. A broken pack is never accepted as a pass.
4. A completed failing assertion is recorded as `verification_failed`.
   Authentication/browser/timeout/incomplete-output failures are recorded as
   infrastructure failures and do not award a bug detection or repair win.
5. Genuine failure summaries go to the Builder. A fresh Builder context folder
   contains only the broken app source. The original source, selected fault,
   and earlier chat are not supplied. The Builder uses a read-only session to
   return a complete proposed `app.py`; the runner validates syntax and route
   declarations before applying the candidate to the isolated app.
   Replay summaries may be empty; the handoff also includes the current failed
   assertion and allowlisted numeric observations from the sealed action log.
   Raw network logs, cookies and cached authoring reports are not supplied.
6. The baseline's unit tests and Kane test remain protected by hashes. Each
   repair must pass unit tests before Kane retests. At most three repair
   attempts are allowed. A persistent failure ends as `needs_human`.
   Malformed repair responses, invalid Python, and changed route declarations
   are rejected without applying them. The rejection is passed to the next
   Builder attempt and counts toward the same three-attempt maximum.
7. Every attempt has a separate private artifact folder. Raw event streams,
   logs, source snapshots, and `.evidence` packs stay local and Git-ignored.
   SQLite exposes only safe event messages, actual verdicts, execution IDs,
   hashes, durations, and attempt counts to the dashboard.

## Honest limits

Folder/context separation reduces accidental answer leakage; it is not a
confidential sandbox against a model deliberately searching other readable
paths. Faults come from a small library. The Builder is a separate Codex
session, not a different model vendor. The generated repair is constrained by
tests and route checks, not a formal proof of source-code safety. No agent's
claim is accepted as a Kane pass. Historical bad orders are not silently
rewritten. This runner uses local Flask development servers and fictional
checkout data; it does not collect payments or deploy anything.

If interrupted, the database's last state is historical, not an indication
that a background battle is still alive. Inspect private logs before retrying;
each new invocation creates a new battle ID, never overwrites an old attempt.
Its owned Flask server is stopped when the runner exits normally or encounters
an exception. External process termination can still require local cleanup.

## Process deadlines and command outcomes

Windows subprocesses are assigned to an owned Job Object with kill-on-close;
timeouts stop that process tree rather than only its parent launcher. Cleanup
and output draining also have finite deadlines. On POSIX, owned process groups
are used. The runner does not stop unrelated processes by name or port.

Command exit codes distinguish the final result: `0` means a completed,
Kane-verified repair; `1` means a blocked baseline, undetected fault, or exhausted
repair attempts; `2` means a human repair handoff is waiting; `3` means an
infrastructure error or unknown state. The final battle state is also printed.
