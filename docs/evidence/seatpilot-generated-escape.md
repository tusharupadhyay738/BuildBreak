# A passing catalog test missed the wrong ticket price

Dashboard battle `20261124T151404-6db82d63` recorded an **escape**. This run used a scripted pricing change on an isolated SeatPilot app. It used Kane's approved, three-step catalog regression and made zero Builder attempts.

| Quote for two tickets with EARLY15 | Healthy copy | Changed copy |
| --- | ---: | ---: |
| Subtotal | $136.00 | $136.00 |
| Discount | $20.40 | $6.80 |
| Total | $115.60 | $129.20 |

The observations came from the local quote API. The locked test checks the visible catalog headings before filtering, after selecting Chamber Music, and after resetting to All Programs. It has no pricing assertion.

| Phase | Kane execution | Verdict |
| --- | --- | --- |
| Healthy battle baseline | `d0e8352a-4267-4651-9d1d-a449d51edf98` | Passed |
| Changed pricing | `c38cdd2d-b082-4d27-a034-68d844c8fb28` | Passed |

Both packs were checked against the app URL and the approved test digest. Earlier [healthy qualification](seatpilot-catalog-healthy.md) used two additional runs. Arena preserved the pricing difference, source fingerprints, and a follow-up requirements note in the ignored battle folder. Follow-up tests require owner review and verification against both app versions. [Generated suite guide](../guides/generated-seatpilot.md).

Kane extracted the follow-up use case `uc-1`, “Inspect a discounted ticket quote,” for owner review (4.52 reported credits). Across the revised test qualification, this dashboard battle and context extraction, the account balance decreased by approximately 189.11 credits. This is an account-level estimate.
