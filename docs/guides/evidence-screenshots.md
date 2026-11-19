# Recorded screenshots in Arena

The dashboard shows two local evidence cards for the selected runner battle:
after fault injection and after the latest repair verification. Images appear
after a run completes, when the archived pack is available and matches the
recorded SHA-256, execution identity, test hash and compatible verdict. This is
recorded evidence, not a live video feed. The page refreshes every three seconds.

For a confirmed failure, the image must belong to a step with a failure record.
Another step's screenshot is never substituted. For a pass, Arena displays the
last supported recorded screenshot. The caption identifies the captured action.
A screenshot is a viewport, and it may not show every value used by an assertion.

Recognized currency observations are displayed separately from the image. Only
the known cart/confirmation subtotal, discount and total fields are accepted,
and their values must have the form `$12.34`. Unrecognized keys, prose, network
logs, cookies, request headers and agent prompts are not returned by this view.
Some runs may have images but no recognized amount fields.

## Access and unavailable evidence

`ARENA_ARTIFACTS` defaults to the local `instance/battles` directory. Each image
request is bound to an existing verification row and its fixed battle/phase/
attempt location. Archive paths are never extracted. Directory links, duplicate
archive entries, unsupported image types, large files and hash/identity mismatches
are rejected. Supported images are original JPEG and PNG screenshot members.

The image route serves only the selected bytes with an image content type,
`nosniff` and `no-store`. There is no arbitrary-file or raw-pack download route.
Missing evidence produces "Screenshot unavailable" while preserving the recorded
verdict. Failed/incomplete infrastructure runs do not gain an image-backed pass.

The app is a local demonstration, not a hosted multi-user evidence service.
Screenshots can contain what was on screen; use fictional demo data. Nothing
automatically publishes local images to GitHub. The small set of public images
in `docs/images` was explicitly selected and visually reviewed.

## Included public images

The November 19 Chrome captures show the interface at commit `a65b7ca`. The
dashboard read a temporary backup of genuine local history. The pricing battle
was already complete when the views were captured. [November 18 run account](../evidence/gemini-pricing-battle-2026-11-18.md).

| Public image | What it shows |
| --- | --- |
| [Arena dashboard](../images/arena-dashboard.png) | Local project selection, prerequisites and approval with execution disabled for this capture. |
| [Workflow timeline](../images/arena-timeline.png) | The final recorded stage of BreakShop battle `20261118T090037-f46311d1`. |
| [Expected and actual](../images/arena-comparison.png) | The same battle's observed $5.40 discount and its verified $4.50 value after repair. |
| [SeatPilot](../images/seatpilot-booking.png) | The booking home page rendered by the bundled adapter against a fresh local database. This capture shows the interface only. |

The two older Kane frames below are historical records of a different battle,
cached replay `20261115T051420-5ba874b2`. They remain attached to [that replay's account](../evidence/cached-replay.md).

| Original Kane frame | Execution | Captured action |
| --- | --- | --- |
| `kane-failure.jpg` | `3bb786e9-4dce-4cfe-a473-603b6502714d` | 29, failed assertion checkpoint |
| `kane-repaired.jpg` | `a60b4704-7ca6-445e-9b4f-a2b92d0af544` | 50, last recorded viewport |

These two JPEG files are unmodified copies from their recorded sealed packs.
Their hashes and the source pack hashes are listed in
[the image manifest](../images/sources.json). The failure viewport shows the top
of the shop; the wrong discount was read in Kane's action log, outside the
visible viewport. The dashboard therefore shows the recorded `$6.75` observation
separately. The repaired image shows the `$40.47` confirmation.

All displayed names and addresses are fictional demo data. The banner SVG is
an original branding graphic, not run evidence. Raw packs, logs and databases
remain local and Git-ignored.
