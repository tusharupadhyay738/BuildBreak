# Contributing

Run the unit tests from the repository root:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -t .
```

Live battles require Kane CLI, Codex, and a free Gemini key.

The supported scope is the bundled SeatPilot app and the BreakShop demo.

For dashboard browser tests, install `requirements-dev.txt`. Local tests use
installed Google Chrome by default. To use Playwright Chromium instead, run
`python -m playwright install chromium` and set `ARENA_TEST_BROWSER=chromium`.
Set `ARENA_REQUIRE_BROWSER_TESTS=1` to fail rather than skip if the browser or
Playwright is unavailable. The Linux PR workflow installs Chromium and requires
these tests. Browser fixtures are synthetic and make no live Kane calls.
