# Local Kane monitor

The new dashboard panel retains its supplied layout and styling. It is a monitor
for one checkout acceptance run, not the complete Gemini/Codex battle loop.
Opening `/arena` or its event stream never starts Kane or spends credits.

Launch is disabled by default. To opt in for a local demo, restart the main app
from PowerShell with:

```powershell
Set-Location .\BuildBreak
$env:ARENA_ENABLE_LIVE_KANE = "1"
.\.venv\Scripts\python.exe app.py
```

On macOS/Linux: `ARENA_ENABLE_LIVE_KANE=1 .venv/bin/python app.py`.
Use localhost, fake demo data, and your existing authenticated Kane CLI session.
Click **Run Kane Live Test** only when you intend to run that test. Watch Chrome
without clicking inside it; operator interactions can invalidate the test.

Only an HTTP localhost/127.0.0.1 URL with an explicit non-privileged port and the
unchanged `.testmuai/tests/CheckoutConsistency_test.md` are accepted. Remote
clients, cross-origin launches, alternate files and overlapping runs are rejected.
Kane replay files are written in ignored `instance/kane-live/`, not over the
repository's generated test output. Child processes strip Gemini/Google API keys,
have a wall-clock deadline and own only their subprocess tree.

The panel streams numbered Kane steps and allowlisted status values, not raw CLI
logs, objectives, paths, cookies or credentials. The final verdict uses the same
summary/done/exit-code, protected-hash and sealed-evidence checks as the battle
runner. An intermediate step pass or exit code zero alone is not a verified pass.
Login, browser, CLI and evidence problems appear as errors; there is no automatic
simulation or replacement with sample screenshots.

The image is a recorded screenshot made available **after** its evidence pack is
verified. This is not live video or a guaranteed per-action image feed. The server
serves only verified image bytes for the current session's opaque reference; no
file path endpoint exists. An unavailable image remains unavailable.

This standalone check is separate from scored battle history. Its private logs
and evidence remain local, and its state survives only for the current server
process. Reloading reconnects to that process's current session. Restarting the
server clears the monitor. Normal battle history remains in the existing SQLite
archive.

Validation for this change is offline: regression tests and the frontend build.
Mocked test outcomes are fixtures, not new live Kane runs. A new authenticated
live run has not been claimed.
