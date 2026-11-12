from contextlib import closing
import os
import sqlite3
import tempfile
import unittest
from app import create_app, pricing

class ShopTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=".")
        self.database = os.path.join(self.temp.name, "test.sqlite3")
        self.app = create_app({"TESTING": True, "SECRET_KEY": "test", "DATABASE": self.database})
        self.client = self.app.test_client()
        self.client.get("/")
        with self.client.session_transaction() as session:
            self.token = session["checkout_token"]
    def tearDown(self):
        self.temp.cleanup()
    def post(self, path, **data):
        return self.client.post(path, data={"token": self.token, **data})
    def count(self):
        with closing(sqlite3.connect(self.database)) as connection:
            return connection.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    def test_prices_and_rounding(self):
        self.assertEqual(pricing({"1": 2, "3": 1}, "SAVE10"), (4497, 450, 4047))
        self.assertEqual(pricing({"3": 5}, "SAVE10"), (2495, 250, 2245))
        self.assertEqual(pricing({}), (0, 0, 0))
    def test_cart_updates_and_removal(self):
        self.post("/cart", product="1", quantity="3")
        with self.client.session_transaction() as session:
            self.assertEqual(session["cart"], {"1": 3})
        self.post("/cart", product="1", quantity="0")
        with self.client.session_transaction() as session:
            self.assertEqual(session["cart"], {})
    def test_invalid_cart(self):
        for quantity in ("-1", "100", "abc", "1.5"):
            self.assertEqual(self.post("/cart", product="1", quantity=quantity).status_code, 400)
        self.assertEqual(self.post("/cart", product="unknown", quantity="1").status_code, 400)
    def test_checkout_validation(self):
        self.post("/checkout", name="A", email="a@b.com", address="Home")
        self.assertEqual(self.count(), 0)
        self.post("/cart", product="2", quantity="1")
        for fields in ({"name": "", "email": "a@b.com", "address": "Home"}, {"name": "A", "email": "bad", "address": "Home"}, {"name": "A", "email": "a@b.com", "address": " "}):
            self.post("/checkout", **fields)
        self.assertEqual(self.count(), 0)
    def test_saved_order_duplicate_and_server_total(self):
        self.post("/cart", product="1", quantity="2")
        self.post("/coupon", coupon="SAVE10")
        data = dict(name="Builder", email="a@b.com", address="123 Main Street", total="1")
        first = self.post("/checkout", **data)
        second = self.post("/checkout", **data)
        self.assertEqual(first.location, second.location)
        self.assertEqual(self.count(), 1)
        with closing(sqlite3.connect(self.database)) as connection:
            self.assertEqual(connection.execute("SELECT subtotal,discount,total FROM orders").fetchone(), (3998, 400, 3598))
        self.assertIn(b"Order confirmed", self.client.get(first.location).data)
        self.assertEqual(self.app.test_client().get(first.location).status_code, 404)
    def test_coupon_and_token(self):
        self.post("/coupon", coupon="WRONG")
        with self.client.session_transaction() as session:
            self.assertNotIn("coupon", session)
        self.assertEqual(self.client.post("/checkout", data={"token": "wrong"}).status_code, 400)

if __name__ == "__main__":
    unittest.main()
