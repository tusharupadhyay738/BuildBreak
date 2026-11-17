# Original AI Studio console integration

The dashboard uses the original interface from the user-supplied
`buildbreak-arena.zip`. The source HTML, CSS and sound engine are preserved;
all renderer class attributes and original controls remain. Data bindings
replace hard-coded SAMPLE labels when showing genuine archive records.

The original stage inspector/replay, table search and filters, side-by-side
and Overlay Wipe comparison, screenshot modal, copy, JSON export, keyboard
shortcuts, optional sound and integration-contract modal remain available.
Stage replay animates recorded steps; it never starts agents or replays Kane.

`/arena` injects a sanitized payload from local SQLite records. `/arena/data`
refreshes that archive without substituting samples when a request fails.
Export JSON downloads that sanitized view, not raw logs, cookies, proposals,
source snapshots or file paths. Unknown values and identifiers stay unrecorded.
Expected comparison values come from the same battle's verified healthy Kane
observations; missing pre-repair values are not inferred from direct checks.

The original Historical Demo, Empty, Loading, Missing Evidence and Infra Error
previews remain separate SAMPLE states. Their generated screenshots and values
are design examples, never live-run evidence. An empty fresh installation
opens the empty real archive; sample data is shown only when a preview is chosen.

## Run and rebuild

Normal use still needs only the Python dependencies: `python app.py` then
open `/arena`. Compiled frontend assets are included. Google Fonts requests
are preserved from the original design and fall back to system fonts offline.

Only when modifying the frontend sources:

```powershell
npm.cmd --prefix frontend ci --ignore-scripts
npm.cmd --prefix frontend run build
.\.venv\Scripts\python.exe frontend/export_flask.py
```

macOS/Linux: use `npm` in place of `npm.cmd` and `.venv/bin/python`.
No Gemini API or paid service is needed for the dashboard. The Vite/Tailwind
build dependencies replace the ZIP's unused React/Gemini/server dependencies.

The original server-rendered archive remains as a no-JavaScript fallback and
at `/arena/live`. Battle snapshots include the payload adapter, so existing
cache bindings can legitimately become stale; do not rewrite cache hashes.
The shop source and protected Kane checkout test remain unchanged. No new
live Kane result is claimed for this UI integration.
