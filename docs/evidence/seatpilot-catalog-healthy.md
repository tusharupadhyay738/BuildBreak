# SeatPilot catalog regression on the healthy app

The owner approved the two-step Chamber Music filter proposal from the [design session](seatpilot-catalog-design.md). Arena copied the reviewed bytes to the [generated suite](../../.testmuai/tests/generated/seatpilot/manifest.json). Each Kane run used a fresh local SeatPilot copy and database, a run-specific start URL and the same approved test digest. The runner verified the execution ID, target, test hash and verdict against each sealed evidence pack.

| Healthy run | Kane execution ID | Passed steps | Verdict |
| --- | --- | --- | --- |
| 1 | `6e05080b-7f68-4863-8964-a8cdb0f890ef` | 1 of 2 | Failed |
| 2 | `0f6a6eb7-cc21-4dc0-a6c6-2ec2b624fa8b` | 2 of 2 | Passed |

In the first run, Kane reported that Chamber Music appeared selected and one card remained. It could not establish the target title and both exclusions inside Featured Events. The second run passed the same assertion. Arena consequently classified the proposal as **unstable or failing on healthy app**. It remains available for audit. The eligible suite has zero tests and the runs contribute zero defect detections.

Kane's balance decreased by approximately 62.55 credits across the two browser checks and their measurement window. This is an account-level estimate. The earlier exploration and context extraction reported about 6.24 credits combined and the single design run reported 12.62.

Open `/arena` for the recorded qualification counts. The dashboard describes a regression baseline for observed behavior. The authored flow leaves initial card count and reset to All Programs untested. The curated demo still selects its existing protected test.

## Second attempt, awaiting use-case review

A local Playwright inspection read the event-card headings inside Featured Events on a disposable SeatPilot database. With only local GET requests permitted, Chrome showed all three catalog titles, then only Nocturne Symphony after selecting Chamber Music, then the original three titles after choosing All Programs. This independently checks the [revised requirements](../specs/seatpilot-catalog-round-trip.md). The browser inspection does not qualify a Kane test.

Kane ingested the revised requirements in a separate local context. Extraction reported 2.08 credits and queued one derived use case, `uc-1`, “Filter Featured Events and restore all programs.” There was no new exploration, test-design call or Kane browser run in this attempt before human review.

## Revised test qualification

After review, Arena locked the generated three-checkpoint definition at SHA-256 `f11498a9728ff6cdb6a40e92cae584685b67374ab8da6bcd2c9e3878202a048a`. Healthy runs `1cdc5b1b-949b-4958-b525-9fa6547a89fa` and `8b3e4501-81ff-45d8-93c1-fff5c1eb5158` both passed on fresh disposable copies. Arena checked the sealed packs against the target URLs and definition digest. The revised test is **kept**. The account balance decreased by about 128.42 credits across that measurement window. The first, dropped proposal remains archived separately.
