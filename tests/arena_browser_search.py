"""Browser regression for clearing and restoring the Arena battle selection."""
from pathlib import Path
import tempfile
import unittest

from playwright.sync_api import expect, sync_playwright

from app import create_app


class ArenaSearchTest(unittest.TestCase):
    def test_unmatched_search_hides_details_and_reset_restores_them(self):
        with tempfile.TemporaryDirectory() as tmp, sync_playwright() as playwright:
            root = Path(tmp)
            app = create_app({
                "TESTING": True, "DATABASE": str(root / "shop.sqlite3"),
                "ARENA_DATABASE": str(root / "arena.sqlite3"), "ARENA_PROJECTS": str(root / "projects"),
                "ARENA_ENABLE_LIVE_KANE": False,
            })
            client = app.test_client()

            def serve_local_page(route):
                if not route.request.url.startswith("http://localhost/") or route.request.method != "GET":
                    return route.abort()
                with client.get(route.request.url.removeprefix("http://localhost")) as response:
                    route.fulfill(status=response.status_code, content_type=response.content_type,
                                  body=response.get_data())

            with playwright.chromium.launch(channel="chrome") as browser:
                page = browser.new_page()
                page.route("**/*", serve_local_page)
                page.goto("http://localhost/arena")
                page.get_by_role("button", name="Historical Demo", exact=True).click()
                search = page.locator("#battle-search")
                expect(page.locator("#comparison")).to_be_visible()
                search.fill("no-battle-matches-this")
                expect(page.get_by_text("No battles match", exact=False)).to_be_visible()
                expect(search).to_be_focused()
                for selector in ("#overview", "#comparison", "#verification"):
                    expect(page.locator(selector)).to_have_count(0)
                page.get_by_role("button", name="Reset table filters").click()
                expect(page.locator("#comparison")).to_be_visible()
                expect(search).to_have_value("")


if __name__ == "__main__":
    unittest.main()
