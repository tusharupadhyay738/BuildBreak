---
assurance:
  id: t-1
  base: sha256:d2ee8702b784d0e6f5022c681bcd82d16caa07db536d6fcbd2fca44ad3c8def6
---
# Chamber Music filters Featured Events without booking

> Selecting Chamber Music in Featured Events shows the Nocturne Symphony: Glass & Strings card while excluding the film and architecture cards.

## Step 1

Open {{start_url}} in the browser and reach SeatPilot's entry page with its Featured Events catalog.

## Step 2 @verifies ac-1, ac-2, ac-3, ac-4, ac-5, ac-6, ac-7

In SeatPilot's Featured Events section, select Chamber Music from the catalog categories, then assert the Nocturne Symphony: Glass & Strings event card is visible inside Featured Events, the film event card and architecture event card are absent from Featured Events, and reaching this catalog state required no booking, attendee information, or account credentials; judge cards only inside Featured Events, never by a title in the booking form.
