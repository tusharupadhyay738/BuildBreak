---
assurance:
  id: t-1
  base: sha256:94f93353676b8d4522e77badca063217b6e0ac84e098b4f9da7543680a09fae7
---
# SeatPilot Featured Events category filter and reset

> At three separate browser checkpoints, compare the unordered visible Featured Events article h3 heading sets on initial All Programs, Chamber Music, and restored All Programs; under Chamber Music establish that the two known nonmatching cards are absent.

## Step 1 @verifies ac-1, ac-2

Open {{start_url}} in a fresh browser session for the disposable SeatPilot instance and locate the Featured Events catalog with All Programs selected; read only visible level-three headings inside its event-card articles, then assert their unordered set is exactly {Nocturne Symphony: Glass & Strings, Solstice Film & Sound Retrospective, Kinetica Architecture & Light Forum}, with no booking-form title counted.

## Step 2 @verifies ac-1, ac-3, ac-4

In the Featured Events catalog tabs, select Chamber Music and read only visible level-three headings inside Featured Events event-card articles, then assert their unordered set is exactly {Nocturne Symphony: Glass & Strings} and neither Solstice Film & Sound Retrospective nor Kinetica Architecture & Light Forum exists among those visible card headings.

## Step 3 @verifies ac-1, ac-5

In the Featured Events catalog tabs, restore All Programs and read only visible level-three headings inside Featured Events event-card articles, then assert their unordered set is exactly {Nocturne Symphony: Glass & Strings, Solstice Film & Sound Retrospective, Kinetica Architecture & Light Forum}, excluding any booking-form title.
