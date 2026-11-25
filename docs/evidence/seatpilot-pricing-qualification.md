# SeatPilot pricing follow-up: qualification blocked

The reviewed Kane-designed pricing test was not promoted. Its first healthy run
failed during network inspection, so the second healthy run and the requested
Gemini battle were not started. No retry was made to obtain a better outcome.

Test SHA-256: `acb44e4b6cf897e2957467ad8f03d62db1258715c994eef7d487b844cb0d9a4d`.

| Check | Execution identifier | Recorded outcome |
| --- | --- | --- |
| Previously saved changed-copy run | `fa073c79-bfb1-4814-9517-20bfda7aedc2` | Step 2 confirmed the wrong discount; sealed evidence rechecked without rerunning Kane |
| First fresh healthy copy | `37c5412b-45f5-4ad3-a02d-60f0d4cf01e7` | Steps 1 and 2 passed; step 3 network inspection timed out |

On the healthy copy, Kane passed the displayed $136.00 subtotal, $20.40 discount
and $115.60 total check. The final step attempted to inspect network activity
and assert that no booking-submission request occurred. Kane classified that
failure as `automation_bug/timing_sync`, not a confirmed application defect.
Arena recorded `infrastructure_error` and stopped qualification.

The account balance went from 8,556.5774 to 8,516.0687 credits: a decrease of
**40.5087 credits** during this check. This is an account-level measurement,
not an independently itemized invoice. No Gemini or Codex battle was run.

The prior broken-run receipt and both evidence packs remain local and unchanged.
A separate local recheck receipt records the classifier correction. The pricing
proposal remains unqualified; the existing catalog suite and curated acceptance
tests remain unchanged. The catalog suite is still the sole qualified generated
suite. The failed healthy run is not counted as a detection.

Next work requires investigating Kane's network-capture failure or reviewing a
new proposal. The existing approved test must not be silently weakened, and any
new or revised proposal needs its own review and qualification.
