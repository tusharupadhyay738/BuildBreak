---
mode: testing
max_steps: 60
timeout: 300
target: chrome
---

# SeatPilot server-backed booking consistency

## Step 1
Open the supplied SeatPilot URL in this fresh browser. Wait for the real event catalog. Verify the hero says Connected to Flask API, not Demo Fixture Preview. Verify the visible Nocturne Symphony: Glass & Strings event card has a $68.00 ticket price and 42 seats left. Use the actual interactive page, not the API contract code examples lower down. This is a fictional local booking demo with no real payment.

## Step 2
In Configure Tickets & Booking Details choose Nocturne Symphony: Glass & Strings in Selected event. Use the Increase ticket quantity / Decrease ticket quantity buttons if needed so quantity is exactly 2. With no discount applied, verify the visible Server-Validated Quote has subtotal $136.00, discount $0.00 and total $136.00. Compute 6800 cents times 2 independently; do not infer expected prices from the quote itself.

## Step 3
Enter EARLY15 in Discount code and click Apply Code. Wait for the server quote to finish updating. Independently calculate a 15 percent discount on 13600 cents, rounded half up to 2040 cents, leaving 11560 cents. Assert the visible quote subtotal is $136.00, discount is $20.40 and total is $115.60. Incorrect amounts are an application defect; do not change expectations to match them. If extracting amounts into named observations, use order_summary_subtotal_check, order_summary_discount_check and order_summary_total_check.

## Step 4
Fill Full name with Arena Tester, Email address with arena@example.com and Phone number with 312-555-0148. Click Confirm Fictional Booking once. In the visible confirmation section with id confirmation, verify Booking Confirmed, capture its actual new reference and verify it is loaded from the Flask Server, not a Demo Fixture. Assert confirmation subtotal $136.00, discount $20.40 and total $115.60. Verify the Nocturne event card now shows 40 seats left. Do not use the sample reference or API contract examples. If extracting saved amounts, use confirmation_subtotal_check, confirmation_discount_check and confirmation_total_check.

## Step 5
Reload the current URL, retaining its booking query parameter and actual new reference. Wait for the confirmation to restore from the real booking API. In the confirmation section assert the same reference, same quantity 2, subtotal $136.00, discount $20.40 and total $115.60, with the Flask Server source label. Verify Nocturne still has 40 seats left. Do not submit another booking. This checks saved confirmation and inventory for this scenario, not all event/coupon combinations or full-site correctness.
