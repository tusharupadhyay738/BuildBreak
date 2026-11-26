# Kane test design prototype

`buildbreak/kane_test_design.py` is an offline-tested orchestration path for
the version 1 LOCAL static-data contract. It writes a short requirements note
from `arena.json`, ingests it into a fresh private Kane workspace, extracts one
use-case, reads its actual ID from `context list --json`, and requests at most
one designed scenario with `--allow-unreviewed`. It locates the test file Kane
saved and returns its SHA-256. There is no human test-review step.

The judge launch remains disabled. Mocked command results prove the sequence
and fail-closed handling, not that the installed CLI produces a suitable test.
No Kane credits were used to verify this prototype. A real output must still
pass Arena's target/action/assertion checks and two fresh healthy browser runs
before it may be given to Gemini. The human review is for Gemini's fault.

The one capped live design invocation, after ingest and extraction yield a
single actual use-case ID, is:

```powershell
kane-cli.cmd design tests --use-case <actual-uc-id> --allow-unreviewed --mode override --max 1 --json
```

Run it from the fresh private context workspace. Replace `<actual-uc-id>` with
the `id` returned by `kane-cli.cmd context list --type usecase --undesigned --json`.
The CLI may still ask questions or refuse this mode; such a result blocks the
new workflow and must not be counted as a generated suite.
