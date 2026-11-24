# SeatPilot catalog test design

Kane CLI designed one proposed browser regression test from the human-approved use case `uc-1`, “Browse and filter Featured Events.” The design session `design-20261124T104647-8c2d3ebd` completed with exit code 0. Its final cumulative usage event reported 12.62 credits.

The proposed file is `chamber-music-filters-featured-events-without-booking_test.md`. Its SHA-256 at design time was `be75b3d2c3bd5ec344db246e6f516ae0d638a2edd22a60ee32045aac40b2b496`.

The first step opens the target. The second selects Chamber Music and checks that the Nocturne Symphony card is visible and the film and architecture cards are absent within Featured Events. It scopes the assertion to event cards and requires no booking, attendee details or credentials.

The proposal omits the initial three-card count and the return to All Programs described in the [catalog requirements](../specs/seatpilot-catalog-regression.md). At this checkpoint, the proposal awaits human approval and both healthy browser runs. The design session ID identifies generation only.

## Second proposal, filter and reset

After the owner approved the revised use case, Kane completed one design run for the [round-trip requirements](../specs/seatpilot-catalog-round-trip.md). Session `design-20261124T112130-4c76320c` exited 0 and reported 10.63 credits.

Kane produced `seatpilot-featured-events-category-filter-and-reset_test.md`, SHA-256 `f11498a9728ff6cdb6a40e92cae584685b67374ab8da6bcd2c9e3878202a048a`. Its three steps inspect the visible level-three headings inside Featured Events cards. They assert the exact set of three catalog titles on entry, the single Nocturne Symphony title under Chamber Music, and the original three-title set after restoring All Programs. The set comparison ignores ordering and does not independently assert a count of duplicate cards with identical titles.

At design time the proposal awaited separate human approval and had zero healthy browser runs.
