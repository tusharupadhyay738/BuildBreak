# Kane test design prototype

`buildbreak/kane_test_design.py` is an offline-tested orchestration path for
the version 1 LOCAL static-data contract. It writes a short requirements note
from `arena.json`, ingests it into a fresh private Kane workspace, extracts one
use-case, reads its actual ID from `context list --json`, and requests at most
one designed scenario with `--allow-unreviewed`. It locates the test file Kane
saved and returns its SHA-256. There is no human test-review step.

The judge launch remains disabled. Mocked command results prove the sequence
and fail-closed handling, not that the installed CLI produces a suitable test.
A real output must pass Arena's target/action/assertion checks and two fresh
healthy browser runs before it may be given to Gemini. The human review is for
Gemini's fault. The design gate now rejects a conditional required click and a
missing exact result assertion. A text gate alone cannot prove browser behavior.

## Live Museum attempt, 26 November 2026

One Kane extraction produced use case `uc-1`. One design call produced test
`t-1` for criterion `ac-1`. The user approved that criterion. The generated
test told Kane to activate `show-entry-price` **if present**, which made a
required action optional. The test is retained only in ignored local storage;
it is not a qualified suite.

The first healthy run failed after the start URL was supplied in the wrong
variable format. A corrected invocation followed the repo's variables-file
format. Kane still warned that `start_url` was unresolved. Its first run
reported pass, but Kane's own summary says it stayed on the LambdaTest
playground and did not exercise the Museum page. Its second run failed because
Kane skipped the price-reveal click. The failed verdict called
this an automation misstep, not an application defect. Neither result qualifies
the test; no fault injection or repair followed.

The recorded balance fell from 8,516.0687 to 8,468.3320 credits across design
and these health checks (about 47.74 credits). This includes the invalid first
check. The source test remained unchanged. Future qualification must verify the
actual target URL, required click and exact assertion from the trace, alongside
two passes, before counting a test as kept.

## Corrected design and healthy checks

A second, fresh design attempt produced a mandatory-click test. Two independent
healthy Kane runs reached the fictional Museum page, clicked the price control,
passed the exact `$18.00` assertion, and yielded validated sealed packs. Arena
bound the start URL into private test copies because Kane had navigated to the
literal placeholder in the first attempt. The original test was unchanged.
See [the recorded run account](../evidence/museum-generated-healthy.md) for
identifiers, credit use, and limits. The judge launch remains disabled until
the runtime binding and trace gate are integrated into that path.

The one capped live design invocation, after ingest and extraction yield a
single actual use-case ID, is:

```powershell
kane-cli.cmd design tests --use-case <actual-uc-id> --allow-unreviewed --mode override --max 1 --json
```

Run it from the fresh private context workspace. Replace `<actual-uc-id>` with
the `id` returned by `kane-cli.cmd context list --type usecase --undesigned --json`.
The CLI may still ask questions or refuse this mode; such a result blocks the
new workflow and must not be counted as a generated suite.
