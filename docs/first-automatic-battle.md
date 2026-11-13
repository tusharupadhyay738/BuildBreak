# First automatic BuildBreak battle

On November 13, 2026, one locally launched runner invocation completed battle
`20261113T064610-8b63e1aa` without human message-passing between the roles.

The source baseline was Git commit
`47c993be7ac9c977501c586e50d0a815cdca3739` plus the explicitly recorded
working-tree snapshot `448c01134913`. Uncommitted additions were not falsely
attributed to that commit. Main's `app.py` was not changed.

| Phase | Evidence execution identifier | Actual outcome |
| --- | --- | --- |
| Healthy baseline | `a935d774-186d-4e33-b10f-5ee077dab68b` | Passed all five checkout steps |
| Broken application | `4c423ea3-8400-4915-866a-0555694865bb` | Failed confirmation-total assertion |
| Repair attempt 1 | `61c2be26-7d21-4513-b0ac-66601d59884a` | Passed all five steps, including reload |

The Codex Breaker chose the saved-order-total consistency fault from a
two-entry controlled fault library. The runner applied it only in the
isolated app. The correct cart subtotal was $44.97, discount $4.50, and
total $40.47; the faulty confirmation instead showed total $44.97.

A separate fresh Codex Builder session received the broken app and genuine
failure summary. Its context folder contained only `app.py`; the fault
selection, original app, runner implementation, and prior conversation were
not supplied. Session logs contain only an agent-message result, with no
tool calls. It proposed restoring the calculated discounted total as the
saved value. This is evidence of a separated repair context in this run,
not a guarantee of secrecy against deliberate filesystem inspection.

The runner applied the candidate after syntax and route checks. All 11 app
tests passed, then Kane independently verified order #3 with subtotal $44.97,
discount $4.50 and total $40.47. Reload retained order #3 and these amounts.
The current sealed pack action logs record those observations directly.

All three runs used the unchanged test SHA-256
`cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`.
Adaptive healing was disabled. The post-repair test replayed all five steps;
the baseline initially authored them. The repair succeeded on attempt 1
of the maximum 3. The owned challenge server stopped when the runner exited.

## Evidence handling

Each phase retains its own raw event stream and sealed evidence pack in
Git-ignored private storage. Pack hashes were checked against the source
copies; run identity, verdict, test hash and isolated target were cross-checked
against sealed metadata. Arena's records and timeline were written by the
runner, and the browser page showed the completed battle without a manual
historical import.

Kane's replay retained an older authoring `Result.md` in its generated output
folder (`artifacts.replaced` was false for the failed and repaired replay).
That cached document is not the current replay's report. The actual per-run
event stream and sealed pack are authoritative. Private provenance notes
identify this distinction; the runner labels future cached copies explicitly.

## Scope

This is a real local automatic feedback loop with human initiation. It is
not open-ended vulnerability discovery: the Breaker selected a controlled
fault, and both roles used Codex in separate sessions. No multi-vendor agent
comparison, formal source-safety proof, payment processing, retroactive bad
order repair, or full-app correctness is claimed. The 18-test project suite
also passes, including runner verdict and evidence-integrity checks.
