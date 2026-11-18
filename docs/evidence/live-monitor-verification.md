# Genuine live Kane monitor verification

This was a standalone healthy BreakShop checkout acceptance run launched through
the dashboard's Run Kane Live Test button. It was not a fault-injection battle,
and no Gemini proposal or Codex repair was involved.

- Monitor session: `20261118T081916-19fa917a`
- Kane execution: `253ff076-0c66-4067-9a73-be9019786550`
- Target: `http://127.0.0.1:5000`
- Recorded result: **passed**, 5 passed / 0 failed / 0 skipped.
- Recorded Kane duration: 260 seconds.
- Process exit: 0; no process timeout.
- Protected checkout test SHA-256:
  `cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`
- Preserved sealed pack SHA-256:
  `d75e8aa4230199977e5be9b71f013ac070000a5bb2abb2640e33cafa7b121a6c`

The dashboard displayed the genuine numbered step transitions, retained them
through archive refreshes, and displayed PASSED after the runner's final evidence
checks. The screenshot endpoint returned HTTP 200 with a 42,113-byte JPEG from
the verified pack. This is a recorded viewport after verification, not live video.

The event summary records five authoring decisions and zero replay decisions;
this standalone workspace authored the flow, rather than replaying generated code
from an earlier battle. No credit consumption figure was recorded.

The pack, process logs, generated replay files and verified image remain in
Git-ignored local monitor storage. This document contains sanitized identifiers
and recorded results only. The main application source and protected test were
unchanged. The result covers the exercised checkout flow, not full application
correctness, arbitrary-site support or the complete Breaker/Builder loop.
