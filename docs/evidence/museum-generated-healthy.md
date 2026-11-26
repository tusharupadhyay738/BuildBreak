# Kane-generated Museum test: two healthy browser passes

On 26 November 2026, Kane designed one new test for the fictional local Museum
Exhibit Price Card. Its source test has SHA-256
`48d785e530d687c20d8a47059b65d0c5f51a6b18e8c0beffc37a177a0b9587ae`.
The instruction requires opening the fresh local site, activating
`show-entry-price` once, and asserting that visible `entry-price` reads exactly
`$18.00`. Unlike the first rejected proposal, the action is mandatory.

Arena bound `{{start_url}}` to each disposable copy's loopback URL in a private
runtime copy. The Kane-authored source bytes stayed unchanged. Each run used a
separate healthy copy. Kane's events and sealed packs were validated locally:
navigation reached the Museum origin, the required click succeeded, the exact
price assertion passed, and the pack matched the run and bound test.

| Healthy copy | Kane evidence ID | Recorded result |
| --- | --- | --- |
| First | `97990341-2d67-4c1f-900c-319e19c6b6c8` | Passed; target, click, assertion and pack verified |
| Second | `2c607668-47a9-4a98-8817-9f74af8abc8a` | Passed; target, click, assertion and pack verified |

The account balance fell from 8,408.6152 to 8,360.7227 during the new design
and two healthy runs, a decrease of about 47.89 credits. This is an account
balance measurement, not an itemized invoice. The private packs, action logs,
runtime-bound test copies and qualification helper remain under Git-ignored
`instance/targets/local-museum/design-attempt-02/`.

This verifies one browser regression on the fictional Museum app. It does not
prove that the expected $18.00 is a correct business requirement, that a fault
would be detected, or that the general judge workflow is integrated. No Gemini
fault, Codex repair or dashboard battle ran. The test is not promoted as an
active judge suite yet; the product runner still needs the same URL binding and
trace checks before it can safely use this test in a battle.
