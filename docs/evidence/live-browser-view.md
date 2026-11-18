# Genuine embedded live browser verification

This was a standalone healthy BreakShop checkout test, launched from the updated
Arena panel. It was not a Gemini/Builder battle or a simulated run.

- Monitor session: `20261118T084759-b05cf098`
- Kane execution: `46d9318a-3691-455d-b3f8-e8330d7fcfad`
- Target: `http://127.0.0.1:5000`
- Recorded result: **passed**, 5 passed / 0 failed / 0 skipped.
- Recorded Kane duration: 267 seconds; process exit 0.
- Protected checkout test SHA-256: `cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`
- Preserved sealed evidence SHA-256: `5c22fc4a12ee76e83cc251d03d32fbf07894f972c99eb930d482686524efd6ec`

Arena started a fresh isolated Chrome and supplied its loopback CDP endpoint to
Kane. The embedded MJPEG view loaded successfully while the status was RUNNING.
Browser inspection confirmed a visible 2400 x 1350 source image, labeled LIVE.
The viewport visibly changed from shopping/cart to the order confirmation as
Kane progressed. Two direct samples from the running image stream returned
HTTP 200, JPEG images of 62,075 and 61,080 bytes, with different SHA-256 hashes.
The local frame comparison confirms changing frames, not a cached sample image.

After all five steps passed and evidence checks completed, the dashboard showed
PASSED and switched to RECORDED - verified evidence. Its image source changed
from the live-view route to the existing verified screenshot route. The isolated
Chrome debugging endpoint was closed, and requesting the finished live-view
route returned HTTP 404. No live frame recording was persisted by the feed.
Manual dashboard proof screenshots were retained locally for this review only.

Validation also included 130 passing unit tests, the Vite production build, and
a separate real-Chrome smoke check that delivered three consecutive frames without
calling Kane. Unit-test outcomes remain offline fixtures. The live Kane summary
records five authoring decisions and zero replay decisions. No credit-consumption
figure was recorded.

Raw evidence, logs, temporary browser profiles, databases and frame-comparison
metadata remain in ignored local storage. The protected acceptance test and main
app source were unchanged. This verifies the embedded observer feed and the
exercised checkout scenario, not high-frame-rate video, arbitrary-site support,
full-app correctness or live viewing throughout a complete Breaker/Builder battle.
