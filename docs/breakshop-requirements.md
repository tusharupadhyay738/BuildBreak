# BreakShop checkout requirements

This note is an explicit requirements source for Kane test design. It is not a
report that these requirements passed. It supplements a budget-limited read-only
exploration that reached the entry page but completed no flows.

## Scope

One happy-path checkout on a fresh local BreakShop fixture. Use fictional demo
data only. There is no payment provider and no real payment should be attempted.
Use the entry URL supplied for the run; do not assume a public deployment.

## Use-case: discounted cart to persisted confirmation

1. Start a new order to clear the browser's previous cart and coupon. The empty
   cart shows subtotal, discount and total of $0.00.
2. The catalog lists Arena T-shirt at $19.99 and Sticker pack at $4.99.
3. Add two Arena T-shirts and one Sticker pack. The subtotal must be $44.97,
   calculated independently as 1999 * 2 + 499 = 4497 cents.
4. Apply SAVE10. It discounts the subtotal by 10 percent, rounded half up to
   whole cents: 4497 * 10% rounds to 450 cents. The summary must show subtotal
   $44.97, discount $4.50 and total $40.47. Do not adopt a wrong displayed amount
   as the expected amount.
5. Enter fictional details: Arena Tester, arena@example.com, 123 Test Lane,
   Demo City. Place the order once. A confirmation must show an order number
   and the same three amounts.
6. Capture the displayed order number, then reload that same confirmation URL
   without resubmitting checkout. The same order number and amounts must remain.

## Design and reporting constraints

Draft a NEW, separately named Kane test for this use-case. Do not modify or import
the protected `.testmuai/tests/CheckoutConsistency_test.md`. Do not change the
app or expected values to make a generated test pass. A test must actually run
before its result is claimed; authoring a test or mapping a screen is not a pass.

This use-case does not establish correctness for every product, quantity, coupon,
duplicate submission, other browser sessions, or the whole application. Those
behaviors are outside this generated happy-path check's scope.
