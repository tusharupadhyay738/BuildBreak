"""Local Chrome regression. Run with python -m tests.seatpilot_browser_retry."""
from contextlib import closing
import importlib.util
import logging
from pathlib import Path
import sqlite3
import tempfile
from threading import Thread
import unittest

from playwright.sync_api import expect, sync_playwright
from werkzeug.serving import make_server

from buildbreak.seatpilot_adapter import prepare_runtime


class BookingRetryBrowserTest(unittest.TestCase):
    def test_reload_after_lost_booking_response(self):
        logging.getLogger("werkzeug").setLevel(logging.ERROR)
        with tempfile.TemporaryDirectory() as tmp, sync_playwright() as playwright:
            folder = prepare_runtime(Path(tmp) / "demo", build=True)
            spec = importlib.util.spec_from_file_location("seatpilot_demo", folder / "app.py")
            demo = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(demo)
            database = Path(tmp) / "bookings.sqlite3"
            app = demo.create_app({"DATABASE": str(database)})
            with make_server("127.0.0.1", 0, app, threaded=True) as server:
                thread = Thread(target=server.serve_forever, daemon=True)
                thread.start()
                try:
                    with playwright.chromium.launch(channel="chrome") as browser:
                        self.exercise_retry(browser, f"http://127.0.0.1:{server.server_port}")
                finally:
                    server.shutdown()
                    thread.join()
            with closing(sqlite3.connect(database)) as connection:
                self.assertEqual(connection.execute("SELECT COUNT(*) FROM bookings").fetchone()[0], 1)
                remaining = connection.execute("SELECT remaining FROM inventory WHERE event_id=?",
                                               ("evt-nocturne-symphony",)).fetchone()[0]
                self.assertEqual(remaining, 40)

    def exercise_retry(self, browser, url):
        page = browser.new_page(reduced_motion="reduce")
        attempts = []

        def simulate_lost_confirmation(route):
            if not route.request.url.startswith(url + "/"):
                return route.abort()
            if route.request.url != url + "/api/bookings" or route.request.method != "POST":
                return route.continue_()
            response = route.fetch()
            attempts.append((response.status, response.json()["id"]))
            if len(attempts) == 1:
                return route.abort()  # The real API already saved the reservation.
            return route.fulfill(response=response)

        page.route("**/*", simulate_lost_confirmation)
        page.goto(url)
        self.book_two_tickets(page)
        expect(page.get_by_text("Booking confirmation did not arrive.", exact=False)).to_be_visible()
        page.reload()
        self.book_two_tickets(page)
        expect(page.locator("#confirmation")).to_contain_text(attempts[0][1])
        expect(page.locator("#confirmation")).to_contain_text("$115.60")
        self.assertEqual(attempts, [(201, attempts[0][1]), (200, attempts[0][1])])

    def book_two_tickets(self, page):
        page.locator("#checkout-event-select").select_option("evt-nocturne-symphony")
        page.locator("#discount-code-input").fill("EARLY15")
        page.get_by_role("button", name="Apply Code", exact=True).click()
        expect(page.locator("#checkout aside")).to_contain_text("$115.60")
        for field, value in [("name", "Arena Tester"), ("email", "arena@example.com"), ("phone", "312-555-0148")]:
            page.locator("#attendee-" + field).fill(value)
        page.get_by_role("button", name="Confirm Fictional Booking").click()


if __name__ == "__main__":
    unittest.main()
