# Visible-browser baseline interruption and verified retry

The watch-through `20261117T150501-7a005187` stopped at `baseline_blocked`:
four healthy steps passed and the confirmation-reload step was not achievable.
Checkout had reached `/orders/1` successfully. The server then recorded a POST
to `/new-cart` before the final reload. The operator confirmed interacting with
the page. Starting a new order intentionally clears the checkout session, so
this run is not evidence that confirmation persistence was defective.

The interrupted execution remains preserved as
`e9b436f6-3007-47dd-aa12-d7582791b240`. No fault or repair was attempted in it.

The watch-only retry `20261117T151941-74c868a4` used the same app, protected
test and globally installed Kane CLI 0.10.2:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker scripted --builder codex --max-attempts 3 --show-browser
```

| Phase | Execution identifier | Recorded result |
| --- | --- | --- |
| Healthy baseline | `00670782-d4c1-4375-bdd8-a27e172bd91d` | All 5 steps passed |
| Controlled fault | `09d7af87-8fc4-4615-8444-3038c4a552df` | 3 passed, 1 failed, 1 skipped |
| After repair 1 | `3bb92295-18e8-4dc1-87ba-730245da4360` | All 5 steps passed |

The retry completed. This was a scripted saved-order-total fault, not a
Gemini-generated fault. Codex repaired it on attempt 1, all 11 isolated tests
passed, and Kane verified checkout and confirmation reload. The repaired AST
matched the healthy source; the main app was unchanged. All three saved pack
hashes and execution/test identities were checked against the recorded rows.
The protected test SHA-256 remained
`cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`.

No app or acceptance-test change was needed for the interrupted baseline.
The runner now supports optional visible Chrome; headless remains the default.
Watch Kane's window without interacting with it, and use a separate dashboard
tab. A newer CLI was downloaded into ignored local diagnostic storage during
investigation but was not selected for this retry or installed globally.
Raw packs, logs and local runtime files remain Git-ignored. These observations
cover this checkout drill, not general app correctness or a new fault family.
