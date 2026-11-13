---
mode: testing
max_steps: 60
timeout: 300
target: chrome
---

# Checkout consistency

## Step 1
Open the supplied BreakShop URL. Click Start a new order to clear this browser's previous cart and coupon. Verify the subtotal, discount, and total are all $0.00. This is a local demo; no real payment is involved.

## Step 2
Read the Arena T-shirt and Sticker pack unit prices from their product cards. Assert only that these unit prices are $19.99 and $4.99 respectively. The cart is still empty at this stage; do not assert purchase totals until products have been added in Step 3.

## Step 3
Set Arena T-shirt quantity to 2 and add it to the cart. Set Sticker pack quantity to 1 and add it to the cart. Calculate the expected subtotal independently from the product-card unit prices in integer cents: 1999 * 2 + 499 = 4497 cents. Verify those quantities and that the cart subtotal is $44.97. Apply SAVE10. Calculate 10 percent of 4497 cents, rounded half up to 450 cents, and subtract it to obtain 4047 cents. Assert the displayed order summary subtotal, discount, and total are $44.97, $4.50, and $40.47. Do not derive expected amounts from the displayed summary. An incorrect amount is a product failure; do not change the expected values to match it.

## Step 4
Complete checkout using fictional data only: Full name Arena Tester, Email arena@example.com, Delivery address 123 Test Lane, Demo City. Click Place order once. Verify Order confirmed is shown, capture the displayed order number, and assert the saved confirmation subtotal is $44.97, discount is $4.50, and total is $40.47.

## Step 5
Reload the same confirmation URL using browser reload or navigation to the current URL, without resubmitting the checkout form. Verify the same order number and the same subtotal $44.97, discount $4.50, and total $40.47 are still displayed. This checks the persisted confirmation visible to this browser, not direct database contents or all possible checkout flows.
