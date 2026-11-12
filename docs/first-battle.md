# First BuildBreak Arena challenge: discount regression

This completed challenge used a human-triggered workflow. The user directed creation of an isolated challenge, deliberate fault injection, Kane browser testing, repair, and a follow-up test. The assistant edited the code and inspected the saved results. The bug was deliberately seeded, and the workflow did not involve an autonomous two-agent battle.

## Baseline and seeded fault

The challenge started from baseline commit `219a3e006221296cb0158ce85b66e3280a0bb02a` on branch `challenge/discount-regression` in an isolated Git worktree. The baseline app used port 5000 and the challenge app used port 5001, with separate local databases.

The only seeded code change was in `app.py`, inside `pricing()`:

```diff
- Decimal("0.10")
+ Decimal("0.05")
```

This changed SAVE10 from a 10% discount to a 5% discount while retaining the existing rounding and total calculation.

## Acceptance criterion

The original `BreakShopDiscountBaseline_test.md` definition remained unchanged from the baseline. Its instruction was to add a product, set quantity to 2, apply SAVE10, and verify that the final total equals the subtotal minus a 10 percent discount. Both preserved reports contain the same instruction checksum, `530c7c4e9300de12c37f7804211860c6`.

Both runs targeted the challenge on port 5001 and used two Arena T-shirts. The subtotal was $39.98. A 10% discount rounds to $4.00, giving an expected total of $35.98.

## Recorded results

| Run | Execution identifier | Subtotal | Expected total | Actual total | Result |
| --- | --- | --- | --- | --- | --- |
| DiscountRegressionBeforeRepair | `ea871c21-3aa2-4da0-961e-0a08935a09eb` | $39.98 | $35.98 | $37.98 | Failed |
| DiscountRegressionAfterRepair | `e511b086-513a-4e30-b31d-8ce0e567da08` | $39.98 | $35.98 | $35.98 | Passed |

The failed action log recorded a calculated discount of `5.00`, compared with an expected `10.00`. The failed report described the cart as "undiscounted." That wording is inaccurate: the recorded amounts show a $2.00 discount, consistent with the seeded 5% multiplier.

The passing action log used the displayed $39.98 subtotal and $35.98 total to calculate the difference, in cents, between the actual total and the expected total after 10% off. It returned `0`, and the final assertion passed.

## Repair and differences between runs

The repair restored `Decimal("0.10")` in the challenge's `pricing()` function. It reversed the single seeded change. The repaired app matches the baseline, and all six automated Python tests passed after the repair. The challenge server was restarted before the passing browser run.

The test definition and acceptance criterion stayed the same, but Kane generated different action sequences. Before repair, it entered quantity 2 and then clicked Add to cart. After repair, it clicked Add to cart, entered quantity 2, and clicked Update cart. Both runs then entered SAVE10 and clicked Apply discount. The failed run compared the calculated percentage with 10%, while the passing run checked for a zero-cent difference from the expected discounted total.

## Evidence and verification scope

This account was checked against the separately preserved `Result.md`, metadata, and `actions.ndjson` files for each execution. The failed and passing evidence packs and output folders remain preserved locally under Git-ignored evidence storage. This public document includes only the execution identifiers and summarized findings.

The passing run verifies the exercised two-T-shirt SAVE10 flow on port 5001. Checkout, order persistence, duplicate-order protection, other product and quantity combinations, and full-app correctness are outside the scope of that browser result.
