# Gemini pricing battle - November 18, 2026

Battle `20261118T090037-f46311d1` completed as **Caught and repaired**.
This was a genuine, human-launched CLI battle with a live Gemini proposal,
independent Arena validation, Kane verification and a fresh Codex Builder repair.
It was not a cached replay or a scripted fault.

## Recorded sequence

1. Arena's independent healthy checkout check passed.
2. Kane passed the healthy baseline.
3. Gemini supplied one proposal. Arena rejected zero and accepted one, in the
   **pricing** family, after independent fault validation. No fallback was used.
4. Kane confirmed a verification failure on the broken isolated copy.
5. Codex repair attempt **1 of 3** restored the independent invariant and passed
   the automated app tests.
6. Kane passed the repaired checkout and confirmation reload with the unchanged
   protected acceptance test. Arena recorded **Caught and repaired**.

| Phase | Kane execution | Recorded verdict |
| --- | --- | --- |
| Healthy baseline | `f7e3c86e-681a-4511-a736-808dadc67c0c` | `passed` |
| Gemini-faulted copy | `a9649462-5417-4dd7-9474-189bf536c2e3` | `verification_failed` |
| After Codex repair | `05dfee93-b73f-4174-802a-57fb8916fc72` | `passed` |

## Recorded amounts

The dashboard's verified pack observations show a **$44.97 subtotal**. The healthy
reference discount was **$4.50**, while the broken run recorded **$5.40**. After
repair, Kane recorded **$4.50 discount** and **$40.47 total**. The broken run's total
was not available in the dashboard's recognized observations and is not inferred.

All three recorded phases reference protected test SHA-256
`cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`.
The main app source and protected test were unchanged in the main repository;
fault injection and repair happened in the isolated battle workspace.

## Scope and presentation limits

These results establish the exercised checkout consistency scenario, not full-app
correctness or general vulnerability discovery. Gemini generated a fault under
explicit structural and behavioral validation. Codex repaired from its permitted
context; Kane supplied browser evidence and re-verification.

This CLI battle used the requested visible Chrome mode. The embedded live-view
panel currently belongs to standalone Kane checks; it did not stream this whole
battle. This run is not claimed as verification of full-battle embedded streaming.

This account uses the dashboard's sanitized records and protected-test references.
Raw evidence, generated output, credentials, databases and local caches remain
Git-ignored. No live service was rerun while documenting this completed result.
