# BreakShop

Small Flask + SQLite demo shop with HTML, CSS, and vanilla JavaScript. Prices are USD; integer cents and decimal half-up discount rounding keep totals accurate. SAVE10 deducts 10%; no tax or shipping is charged. No real payment is collected.

## Windows PowerShell setup

Open PowerShell in your downloaded or cloned BuildBreak folder, then run these commands.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m unittest -v
.\.venv\Scripts\python.exe app.py
```

Open http://127.0.0.1:5000. Stop with Ctrl+C. No environment activation is needed.

Products have labeled quantities (1-99); set zero or use Remove to remove an item. Apply SAVE10, enter checkout details, and place an order. Use Start a new order on the confirmation page to shop again.

Orders persist in instance/shop.sqlite3. Each checkout session has a unique token; a database uniqueness constraint prevents repeat submissions from creating duplicate orders. Confirmation access requires the same browser session. A random development session secret is generated on startup, so restarting clears access to previous sessions. Optionally set $env:SECRET_KEY to a private random value before launching for session continuity. Never commit secrets. This local demo uses Flask's development server.

Tests use temporary databases inside this folder and cover pricing/rounding, cart changes, invalid quantities, checkout validation, discounts, duplicate submissions, server-authoritative totals, and confirmation access.

The Kane BuildBreakSetupCheck passed against example.com (Example Domain).

The Kane BreakShopDiscountBaseline passed against the local BreakShop app. It added two Arena T-shirts, observed a $39.98 subtotal, applied SAVE10, and verified a $35.98 final total. This verifies only that tested flow. Checkout, saved orders, duplicate-order protection, and other cart combinations were outside that browser test.

Useful Kane test definitions are included in .testmuai/tests/. Evidence archives and generated run outputs are preserved locally and excluded from Git.
