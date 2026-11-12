from contextlib import contextmanager
import os
import secrets
import sqlite3
from decimal import Decimal, ROUND_HALF_UP
from flask import Flask, render_template, request, session, redirect, url_for, abort

PRODUCTS = {"1": {"name": "Arena T-shirt", "price": 1999}, "2": {"name": "Build mug", "price": 1250}, "3": {"name": "Sticker pack", "price": 499}}

def pricing(cart, coupon=""):
    subtotal = sum(PRODUCTS[key]["price"] * quantity for key, quantity in cart.items())
    discount = int((Decimal(subtotal) * Decimal("0.10")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)) if coupon == "SAVE10" else 0
    return subtotal, discount, subtotal - discount

def create_app(config=None):
    app = Flask(__name__)
    app.config.update(SECRET_KEY=os.environ.get("SECRET_KEY") or secrets.token_hex(32), DATABASE=os.path.join(app.instance_path, "shop.sqlite3"))
    if config:
        app.config.update(config)
    os.makedirs(app.instance_path, exist_ok=True)
    @contextmanager
    def db():
        connection = sqlite3.connect(app.config["DATABASE"])
        connection.row_factory = sqlite3.Row
        try:
            with connection:
                yield connection
        finally:
            connection.close()
    with db() as connection:
        connection.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, token TEXT UNIQUE NOT NULL, name TEXT, email TEXT, address TEXT, subtotal INTEGER, discount INTEGER, total INTEGER, items TEXT)")
    app.jinja_env.filters["money"] = lambda cents: f"${cents / 100:.2f}"

    @app.route("/", methods=["GET"])
    def index():
        session.setdefault("checkout_token", secrets.token_hex(24))
        cart = session.get("cart", {})
        return render_template("shop.html", products=PRODUCTS, cart=cart, totals=pricing(cart, session.get("coupon", "")), error=request.args.get("error", ""))

    @app.post("/cart")
    def cart():
        if request.form.get("token") != session.get("checkout_token"):
            abort(400)
        key = request.form.get("product")
        try:
            quantity = int(request.form.get("quantity", ""))
        except ValueError:
            abort(400)
        if key not in PRODUCTS or not 0 <= quantity <= 99:
            abort(400)
        items = dict(session.get("cart", {}))
        if quantity:
            items[key] = quantity
        else:
            items.pop(key, None)
        session["cart"] = items
        return redirect(url_for("index"))

    @app.post("/coupon")
    def coupon():
        if request.form.get("token") != session.get("checkout_token"):
            abort(400)
        code = request.form.get("coupon", "").strip().upper()
        if code not in ("", "SAVE10"):
            return redirect(url_for("index", error="Unknown discount code."))
        session["coupon"] = code
        return redirect(url_for("index"))

    @app.post("/checkout")
    def checkout():
        token = request.form.get("token", "")
        if not token or token != session.get("checkout_token"):
            abort(400)
        with db() as connection:
            existing = connection.execute("SELECT id FROM orders WHERE token=?", (token,)).fetchone()
        if existing:
            return redirect(url_for("confirmation", order_id=existing["id"]))
        cart = session.get("cart", {})
        name, email, address = (request.form.get(field, "").strip() for field in ("name", "email", "address"))
        if not cart or not name or len(name) > 100 or len(email) > 254 or not __import__("re").fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or not address or len(address) > 500:
            return redirect(url_for("index", error="Add an item and enter a name, valid email, and delivery address."))
        subtotal, discount, total = pricing(cart, session.get("coupon", ""))
        import json
        with db() as connection:
            connection.execute("INSERT OR IGNORE INTO orders (token,name,email,address,subtotal,discount,total,items) VALUES (?,?,?,?,?,?,?,?)", (token,name,email,address,subtotal,discount,total,json.dumps(cart)))
            order_id = connection.execute("SELECT id FROM orders WHERE token=?", (token,)).fetchone()["id"]
        session["cart"] = {}
        return redirect(url_for("confirmation", order_id=order_id))

    @app.get("/orders/<int:order_id>")
    def confirmation(order_id):
        with db() as connection:
            order = connection.execute("SELECT * FROM orders WHERE id=? AND token=?", (order_id, session.get("checkout_token", ""))).fetchone()
        if not order:
            abort(404)
        return render_template("confirmation.html", order=order)

    @app.post("/new-cart")
    def new_cart():
        if request.form.get("token") != session.get("checkout_token"):
            abort(400)
        session.clear()
        return redirect(url_for("index"))
    from arena import register_arena
    register_arena(app)
    return app

if __name__ == "__main__":
    create_app().run()
