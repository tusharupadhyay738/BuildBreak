# SeatPilot catalog test design

Kane CLI designed one proposed browser regression test from the human-approved use case `uc-1`, “Browse and filter Featured Events.” The design session `design-20261124T104647-8c2d3ebd` completed with exit code 0. Its final cumulative usage event reported 12.62 credits.

The proposed file is `chamber-music-filters-featured-events-without-booking_test.md`. Its SHA-256 at design time was `be75b3d2c3bd5ec344db246e6f516ae0d638a2edd22a60ee32045aac40b2b496`.

The first step opens the target. The second selects Chamber Music and checks that the Nocturne Symphony card is visible and the film and architecture cards are absent within Featured Events. It scopes the assertion to event cards and requires no booking, attendee details or credentials.

The proposal omits the initial three-card count and the return to All Programs described in the [catalog requirements](../specs/seatpilot-catalog-regression.md). At this checkpoint, the proposal awaits human approval and both healthy browser runs. The design session ID identifies generation only.
