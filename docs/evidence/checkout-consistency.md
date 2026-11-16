# Checkout consistency challenge

Status: stronger baseline implemented and verified by Kane on November 13,
2026. All five steps passed against an isolated local instance on port 5002
with its own shop database. A subsequent deliberately seeded fault in a
separate worktree was detected by the same Kane test, repaired, and verified
by a complete passing Kane retest.

Execution evidence identifier: `9f3f0f9f-16da-4ec5-ac76-4578846b3403`.
The recorded run took 246 seconds. It checked product prices, cart totals,
fictional checkout, and reload of confirmation for order #1 with subtotal
$44.97, discount $4.50, and total $40.47. Evidence and the report are preserved
locally in Git-ignored storage. All 11 Python tests passed.

The initial authoring attempt (`7c63c8ff-e435-44c9-9332-88cd430603e1`)
failed because it asserted purchase totals before adding the products.
Its evidence was preserved. This was a test-authoring problem, not a detected
application defect. Instructions were corrected before the baseline pass;
the required unit prices and expected purchase amounts were not changed.
Freeze this corrected test for the subsequent isolated fault and repair.

## Seeded challenge result

The isolated `challenge/checkout-consistency` worktree starts from commit
`47c993b`, with the uncommitted baseline additions copied explicitly: the
shop reset control, expanded unit tests, and corrected Kane test definition.
This is a commit plus a working-tree overlay, not a fully committed baseline.
The application fault changes only the value written into the saved order's
`total` column from the discounted total to the subtotal. Cart pricing is
unchanged. This was scripted fault injection, not autonomous discovery.

On November 13, 2026, execution evidence
`090208d3-a4f2-4272-b753-7a54cdd14d94` ran against isolated port 5003.
The reset, product prices, and cart checks passed. The cart showed subtotal
$44.97, discount $4.50, and total $40.47. Checkout confirmation instead showed
subtotal $44.97, discount $4.50, and total $44.97. Kane failed Step 4 and
identified an order confirmation total that ignores the saved discount.
Step 5 (reload) was skipped after the failure; it must not be claimed as
verified for the broken app.

The test definition has the same SHA-256 as the passing baseline:
`CBA82A4A759F3BCA8A2E79196D39107B061A87AED89465B4C9CAE16DBE4521F7`.
Both evidence packs and result folders remain private and locally preserved.
The failed pack's preserved copy was checked against its original SHA-256.
The main application's checkout implementation was not changed.

## Repair and independent retest

The Builder restored the discounted `total` as the value saved for an order,
reversing only the seeded `app.py` edit in the challenge worktree. All 11
automated tests passed. Only the challenge server on port 5003 was restarted.
Existing incorrect orders were not rewritten; the retest created a new order.

Kane execution evidence `7854c71a-9e3b-48ba-9231-d04e9a589063` passed all
five steps on November 13, 2026, in 132 seconds. Confirmation for order #2
showed subtotal $44.97, discount $4.50, and total $40.47; reloading the same
confirmation retained that identifier and those amounts. The test SHA-256
above remained unchanged. Adaptive healing was disabled and did not trigger.
Kane replayed three steps and authored two; identical browser actions across
the runs are not claimed.

The failed and passing packs and output folders are preserved separately in
private Git-ignored storage. Both preserved pack copies were verified by hash.
This demonstrates one manually orchestrated, deliberately seeded challenge
with a Kane-verified repair. The Builder already knew the seeded edit; this
is not a blind diagnosis or an autonomous two-agent battle. It verifies the
exercised new-order flow, not retroactive correction of existing bad orders
or full application correctness.

The browser test starts a new order and uses two Arena T-shirts ($19.99 each)
and one Sticker pack ($4.99). Expected subtotal: 4497 cents. SAVE10 discount:
450 cents (10 percent, rounded half up). Expected total: 4047 cents.
The test checks the cart, completes a fictional checkout, and reloads the
confirmation to check its order identifier and persisted displayed amounts.
It does not prove database integrity for every flow.

Run against a fresh instance of the current app, using your own Kane login:

```powershell
kane-cli.cmd testmd run .\.testmuai\tests\CheckoutConsistency_test.md --override-start-url http://127.0.0.1:5000 --target desktop --no-adaptive-heal --timeout 300 --name CheckoutConsistencyBaseline
```

The UI reset affects only the current browser session; existing saved orders
are retained. A challenge must use its own database and server port.

The isolated fault leaves cart pricing correct while storing an incorrect
order total. Keep the same test
and independent expectations. Preserve failure evidence before a repair or
retest can overwrite output. A future Builder handoff should include the
requirements and real failure evidence, without disclosing the seeded edit.
The current conversation already knows the proposed fault; it must not be
described as a blind diagnosis by an independent Builder.

A browser, authentication, or server error is not a confirmed pricing defect.
Only actual execution evidence can establish a challenge result. No automated
repair or autonomous two-agent battle is claimed at this stage.
