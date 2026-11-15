# Verified cached Gemini replay

Battle `20261115T051420-5ba874b2` completed on November 15, 2026. Arena replayed
the validated 15% SAVE10 mutation originally proposed by Gemini 3.5 Flash-Lite
in battle `20261114T181556-024e132e`. No Gemini API call was made during replay.
Kane and Codex still used their authenticated services and allowances.

Cache identity:
`a5b0bd9e5d93cc2ecd4e2875f68a4a542118ef7013b5750e1837619e64f7df02`.
The cache was tied to the healthy app and protected shop/browser test hashes.
The runtime validator booted a new copy, confirmed partial assertion failures
without test errors, and independently read the wrong persisted checkout values
of $44.97 subtotal, $6.75 discount and $38.22 total. Expected values remained
$44.97, $4.50 and $40.47.

| Phase | Execution identifier | Verified result |
| --- | --- | --- |
| Healthy baseline | `452da195-dbf2-4b69-b186-4869fec0d74f` | Passed |
| Cached mutation | `3bb786e9-4dce-4cfe-a473-603b6502714d` | Failed |
| After repair | `a60b4704-7ca6-445e-9b4f-a2b92d0af544` | Passed |

The failed Kane log recorded a $6.75 discount where the unchanged assertion
required $4.50. It stopped before checkout. The wrong saved total above comes
from Arena's separate direct fixture, not a claimed Kane checkout.

Codex repaired the app on attempt one. Its supplied context folder held only
the broken `app.py`; the cached patch, description and original source were not
supplied. All 11 isolated app/dashboard tests passed, followed by the direct
check and Kane checkout/reload verification. The repaired executable source
matched the healthy source. The main app stayed unchanged.

All three sealed packs were archived and independently checked against their
recorded hashes, identities, target and verdict. The protected test SHA-256 was
unchanged across all phases:
`cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`.
Raw packs, generated outputs, databases and cache files remain local and ignored.

## Earlier attempts remain unscored

- `20261114T183357-2fc34206` ended during the mutated browser phase without final
  completion metadata and a sealed pack. It remains an infrastructure error.
- `20261115T050609-0753b74c` completed all five healthy browser steps, but cloud
  upload failed and the runner initially missed the reported local session pack.
  That pack was subsequently validated and copied to separate diagnostic storage.
  The original baseline-blocked state and verification rows were not rewritten.

The runner now accepts a reported pack from its known local session directory
when the session UUID, sealed identity, test hash, target, verdict, final events
and process result all match. Arbitrary paths and incomplete streams are rejected.
The four dedicated tests cover this behavior, and the genuinely recovered pack
also passed metadata validation. The successful replay above used normal workspace
ingestion for its three packs; it does not claim that a cloud failure occurred
during that successful execution.

Arena records the successful outcome as `caught_and_repaired`, producer `gemini`,
source `cached`, with the cache identity and original model. Recent measurements
exclude unfinished, interrupted and unvalidated rows. Repeating a cached patch
does not demonstrate another distinct generated fault or general website coverage.
