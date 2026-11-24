# SeatPilot catalog regression

A visitor browses the fictional events in the Featured Events section of SeatPilot. The visitor can narrow the catalog to chamber music and return to the full program. This is one read-only use case.

In the healthy demo, All Programs shows three event cards. Chamber Music shows the Nocturne Symphony: Glass & Strings card and hides the film and architecture cards. Choosing All Programs again restores the film and architecture cards. Check the cards in Featured Events so a title that also appears in the booking form cannot satisfy the check.

Use the disposable local site and its fictional catalog. The visitor can finish this flow without entering attendee information, making a booking or providing account credentials.

## Basis for review

Kane observed the catalog tabs on the entry page in exploration run `01a20d19-664c-7229-a560-99a5abce911e`. Its single read-only lease completed zero flows. The filter outcomes above come from the healthy catalog fixture and filter implementation and await browser verification. They describe a regression baseline.
