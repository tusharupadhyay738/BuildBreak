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
Install updated dependencies with the project Python (`python -m pip install -r requirements.txt`).
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

## Genuine live browser view

Arena launches a fresh Chrome profile for this session and passes its loopback
CDP endpoint to Kane using the supported `--cdp-endpoint` flag. Kane controls that
browser; the dashboard observes its actual viewport. No personal browser profile,
whole-desktop recording, screen-sharing service or paid streaming API is used.
The optional pop-up checkbox controls whether the same Chrome is also visible on
the desktop. The embedded view works with headed or headless Chrome.

A read-only capture loop samples JPEG viewports, with a half-second delay between
captures (roughly up to two frames per second, lower when capture is slower).
This is a live viewport feed, not a 30/60 fps video or an interactive remote
browser. Live frames are not sealed evidence and cannot establish a pass.

Only pages on the configured local demo origin are captured. Origin is checked
before and after capture. Navigation elsewhere pauses the feed. Malformed frames,
old frames and disconnected targets are not presented as a working live view.
The frontend labels the feed **LIVE - observer view, not a verdict**. After the run,
it switches to **RECORDED - verified evidence** if a genuine verified pack image
is available. Otherwise no replacement sample is shown.

The local, session-bound `/api/kane/live-view` endpoint returns only an MJPEG image
stream. It exposes no CDP address, browser-control commands, arbitrary URLs or file
paths. Multiple viewers share one capture loop and receive the newest frame,
without an accumulating frame queue. Only the latest frame is kept in memory;
live frames are not written to files or uploaded. Chrome's temporary profile stays
in Git-ignored session storage. Closing a viewer stops that viewer's connection;
the run continues. Finishing or failing the run closes only the owned Chrome tree.

The existing screenshot endpoint still serves only a recorded screenshot from
the verified evidence pack. Live viewing and final evidence verification remain
separate.

Implementation references: [Kane's external Chrome flag](https://www.testmuai.com/docs/kane-cli-testmd-running),
[Chrome Page.captureScreenshot](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot).

This standalone check is separate from scored battle history. Its private logs
and evidence remain local, and its state survives only for the current server
process. Reloading reconnects to that process's current session. Restarting the
server clears the monitor. Normal battle history remains in the existing SQLite
archive.

Regression tests use clearly offline fixtures. Real smoke tests and Kane executions
are documented separately under `docs/evidence/`; mocked outcomes never count as
live verification.
