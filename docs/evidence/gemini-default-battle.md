# Live drill with Gemini as the default Breaker

Battle `20261117T113343-478afb99` completed on November 17, 2026, in state
`completed` (caught and repaired). The user launched it from a configured
PowerShell terminal using the project virtual environment:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --builder codex --max-attempts 3
```

No `--breaker` flag was supplied. The recorded baseline was commit
`7e85d989dddc3f54b52ff9b6d816aa4ca0ce0163` plus explicit snapshot
`435472b81b50`. The recorded producer was live Gemini, model
`gemini-3.5-flash-lite`. No controlled fallback or cached proposal was used.

## Proposals and independent validation

The recorded event was: "Gemini proposals requested: 2; rejected by Arena: 1;
accepted: 1." The first proposal was rejected because the edit did not stay
inside one supported fault family. The second passed validation in the
`pricing` family, violating the `saved_checkout_amounts` invariant.

The healthy fixture passed all eight relevant shop tests. The faulted copy
still booted; five shop tests passed and three assertions failed, with no test
errors or skips. Separate direct checks recorded these saved-order amounts:

| Fixture | Subtotal | Discount | Total |
| --- | --- | --- | --- |
| Healthy | $44.97 | $4.50 | $40.47 |
| Faulted | $44.97 | $6.75 | $38.22 |
| Repaired | $44.97 | $4.50 | $40.47 |

## Kane and Codex results

| Phase | Kane execution identifier | Recorded result |
| --- | --- | --- |
| Healthy baseline | `c3833d27-7371-4a32-9831-ae1103b81302` | Passed all 5 steps |
| Faulted app | `6e7173e6-da52-4437-ad31-4f1681212da2` | 2 passed, 1 failed, 2 skipped |
| After repair attempt 1 | `f5fa9792-00d4-46e8-9f7e-5ee1e0ba9704` | Passed all 5 steps |

Kane recorded a $6.75 discount instead of $4.50 and stopped before checkout.
There was no saved order in that faulted browser phase. The $38.22 saved total
in the table comes from Arena's independent direct fixture, not Kane's checkout.

A fresh Codex Builder received the broken source and genuine failure feedback.
Its first repair passed all 11 isolated app/dashboard tests and restored the
independent invariant. Kane then passed the unchanged checkout and confirmation
reload test. The repaired browser phase saved $44.97 / $4.50 / $40.47.
The repaired executable AST matched the healthy source, and main's app was
unchanged.

All three archived pack hashes, execution identities, sealed results and target
identities were checked against the saved records. Their test hash matched the
unchanged protected checkout definition:
`cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`.

## Scope and limits

This is another live execution of the pricing case: its faulted executable AST
matches the [first Gemini drill](gemini-first-battle.md). It demonstrates the
new default, rejection/retry counts and the complete repair loop; it does not
add a distinct bug or establish broader coverage. A live quantity-family drill
and a Builder feedback ablation remain unverified.

The user initiated the command; Arena coordinated the subsequent agent and
verification steps. This was deliberate fault injection on BreakShop, not an
unknown production vulnerability. Raw evidence, databases, fault proposals and
agent artifacts remain local and Git-ignored. This account contains only
sanitized recorded findings.
