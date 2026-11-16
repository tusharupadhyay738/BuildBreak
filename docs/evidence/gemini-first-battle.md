# First live Gemini-generated checkout drill

Battle `20261114T181556-024e132e` completed on November 14, 2026. A person launched
the runner. After that, Arena coordinated Gemini generation, mutation validation,
Kane browser verification, a fresh Codex Builder repair, and final verification.

Gemini `gemini-3.5-flash-lite` proposed changing SAVE10's discount multiplier from
`0.10` to `0.15`. Its first proposal passed the validator. No controlled fallback
was used. This is deliberately generated fault injection, not discovery of a
previously unknown vulnerability in an independently developed production app.

The baseline source was recorded as commit
`60aaed7ec0bce5c666f52173c9acdb154129ba07` plus an explicit working-tree snapshot,
not as a claim that all runner changes were committed at that revision.

## Independently established behavior

The approved fixture buys two $19.99 T-shirts and one $4.99 sticker pack.
Its independently calculated expected subtotal, discount and total are
$44.97, $4.50 and $40.47.

The healthy app passed all eight relevant shop tests and the independent saved
order check. On the mutated copy, five shop tests passed and three assertions
failed with no test errors. The app still booted. The direct check read
$44.97 subtotal, $6.75 discount and $38.22 total from the new order database.

## Genuine Kane results

| Phase | Execution identifier | Result |
| --- | --- | --- |
| Healthy baseline | `ac900d92-96a2-47e3-88b0-6e35b7187f91` | Passed |
| Mutated application | `0af5d894-7553-4af8-b727-d3d727ee7741` | Failed |
| After Codex repair | `90318872-8e97-4fd1-9c8e-0a40ef183447` | Passed |

The failing Kane action log recorded the $6.75 discount instead of the required
$4.50. It stopped at the cart discount assertion before checkout. Therefore,
there was no order in that browser phase's database. The $38.22 persisted total
above comes from the separate direct-check fixture, not an invented Kane checkout.

Codex repaired the app on its first attempt. Its supplied context folder contained
only the broken `app.py`; its prompt contained the requirements and real failure
feedback, without the Gemini patch, description or healthy source. The saved Codex
event stream recorded a completed agent message and no completed tool calls.
Context separation is a practical guardrail, not a confidentiality boundary.

All 11 isolated app/dashboard tests passed after repair. The direct fixture then
read $44.97 / $4.50 / $40.47, and Kane passed the unchanged checkout and confirmation
reload test. The repaired executable source matched the healthy source.

All three packs were preserved and their hashes and sealed metadata verified.
All three runs used the same protected test SHA-256:
`cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`.
The original main app was unchanged. Raw evidence, databases and private source
snapshots remain local and Git-ignored.

## What this does and does not establish

This is one caught-and-repaired generated discount regression on one supported
checkout flow. It does not establish arbitrary-app support, general fault coverage,
production safety or a statistical detection/repair rate.

An earlier run, `20261114T174449-ec143664`, encountered three Gemini API errors
and completed using a controlled saved-order-total fallback. It remains labeled
as a fallback. A separate Gemini 3.8 Flash diagnostic timed out; a later 3.5
Flash-Lite diagnostic succeeded. These observations do not establish the exact
cause of the 3.8 failures, and are not relabeled as Gemini-generated successes.
