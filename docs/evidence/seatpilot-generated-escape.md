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

## Follow-up proposal

After the owner approved the use case, Kane designed one three-step proposal, `read-the-early15-quote-for-two-nocturne-symphony-tickets_test.md`. Session `design-20261125T084259-116b2e9a` completed with exit code 0 and reported 14.02 credits. The reviewed proposal digest is `acb44e4b6cf897e2957467ad8f03d62db1258715c994eef7d487b844cb0d9a4d`.

The test selects two Nocturne Symphony tickets, applies EARLY15 and checks the displayed subtotal ($136.00), discount ($20.40) and total ($115.60). Its last step inspects browser network activity for a booking submission. At design time it had zero browser runs. Qualification requires a pricing-related failure on the preserved changed copy and two passes on fresh healthy copies.

## Broken-copy verification

Execution `fa073c79-bfb1-4814-9517-20bfda7aedc2` failed at step 2 on the changed copy. Kane recorded the $6.80 discount and $129.20 total and confirmed an application defect. Step 3 was skipped. Arena initially recorded this as an infrastructure error because its classifier required an assertion event, while this authoring run emitted a confirmed bug verdict instead.

The classifier now also recognizes a confirmed application-issue verdict tied to a failed test step. Rechecking the saved stream classified this run as a verification failure, and the sealed pack passed the existing identifier, test-hash, URL and verdict validation. The original receipt and evidence remain unchanged. This recheck did not run Kane again or consume new browser credits. Two healthy-copy passes remain pending; the follow-up suite has not been promoted.
