---
assurance:
  id: t-1
  base: sha256:d3142ccff8fd8a8a120acb4778e4add2a0b3436beb03584a492ba404e73eebc9
---
# BreakShop SAVE10 checkout and same-confirmation reload

> On a fresh local BreakShop fixture, start a new order, inspect the empty cart and catalog, buy two Arena T-shirts and one Sticker pack with SAVE10 and the specified fictional details, place the order once without real payment, then reload its same confirmation URL without resubmitting.

## Step 1

At the run-supplied BreakShop entry URL {{start_url}} on the fresh local fixture, open the shop catalog for a fictional demo order.

## Step 2

In BreakShop's catalog and cart, put one Sticker pack into the previous cart and apply SAVE10, leaving this as the previous cart and coupon without placing an order.

## Step 3 @verifies ac-1, ac-2, ac-3, ac-4, ac-5

In BreakShop, start a new order from that populated previous cart, then assert the previous cart contents are absent, the previous coupon is absent, and the empty cart shows subtotal $0.00, discount $0.00, and total $0.00.

## Step 4 @verifies ac-6, ac-7

In the BreakShop catalog for the new order, inspect the named products, then assert Arena T-shirt is listed at $19.99 and Sticker pack is listed at $4.99.

## Step 5 @verifies ac-8

In the BreakShop cart for the new order, add two Arena T-shirts and one Sticker pack, then assert the subtotal is $44.97, independently computed as 1999 * 2 + 499 = 4497 cents.

## Step 6 @verifies ac-9, ac-10

In the BreakShop cart summary for that $44.97 subtotal, apply SAVE10, then assert the discount is $4.50 after half-up rounding to cents and the total is $40.47.

## Step 7 @verifies ac-11, ac-12, ac-13, ac-14

At BreakShop checkout, enter fictional name Arena Tester, email arena@example.com, street 123 Test Lane, and city Demo City; place the order once without attempting real payment, then assert the confirmation displays an order number, subtotal $44.97, discount $4.50, and total $40.47. Store the displayed order number as original_order_number and the confirmation URL as original_confirmation_url.

## Step 8 @verifies ac-15, ac-16, ac-17, ac-18

At BreakShop's original_confirmation_url, reload that same confirmation URL without resubmitting checkout, then assert its displayed order number equals the stored original_order_number, its subtotal is $44.97, its discount is $4.50, and its total is $40.47.
