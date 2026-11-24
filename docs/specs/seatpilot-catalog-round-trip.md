# SeatPilot catalog filter and reset

A visitor filters the fictional Featured Events catalog to Chamber Music, then returns to All Programs. The visitor uses a fresh disposable SeatPilot instance and only interacts with the catalog tabs.

Capture three separate browser checkpoints for this single use case. At each checkpoint, read the visible headings of event cards inside Featured Events. The page exposes each card as an article with a level-three heading. The list of headings is the evidence for both the count and the identities of the visible cards.

| Selected tab | Expected visible card headings |
| --- | --- |
| All Programs on entry | Nocturne Symphony: Glass & Strings, Solstice Film & Sound Retrospective, Kinetica Architecture & Light Forum |
| Chamber Music | Nocturne Symphony: Glass & Strings |
| All Programs after reset | The same three headings as on entry |

These expectations come from the demo catalog and filter implementation. Use the names as a set; card order is outside the check. A title in the separate booking form cannot satisfy a catalog assertion. Booking, attendee details and account login are outside this flow.
