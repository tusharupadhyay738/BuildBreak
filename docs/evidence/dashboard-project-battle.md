# Dashboard import and full-battle verification

Battle `20261118T093418-46c39eed` completed as **Caught and repaired** after one
Codex repair attempt. This was a genuine dashboard-launched battle on an imported
source ZIP of the existing supported BreakShop demo. It was **not** a new AI Studio
site, a Gemini proposal, a cached replay or an offline unit-test fixture.

## UI sequence actually exercised

1. Imported a source-only ZIP containing the existing app, shop and confirmation
   templates and shop stylesheet through the dashboard file picker.
2. Compatibility preflight accepted the known BreakShop application logic. The
   UI showed Chrome, Kane and Codex found; Gemini was not configured in this Arena
   server process. No key was entered into or returned by the dashboard.
3. Opened and reviewed the canonical five-step acceptance test and its hash.
4. Explicitly selected **Scripted (controlled demo fault)** and approved the test.
5. Clicked **Start full battle**. The runner made a separate prepared project and
   isolated battle workspace, using the main Arena history and evidence storage.
6. Kane passed baseline, detected the controlled saved-order defect, and Codex's
   first repair passed automated tests. Kane passed the repaired flow.
7. The embedded viewport and numbered progress followed the baseline, broken and
   repaired phases. Final UI status was PASSED with RECORDED - verified evidence.

| Phase | Kane execution | Recorded result |
| --- | --- | --- |
| baseline | `8e724065-2f9a-4309-8a2c-9af0be44d115` | `passed` |
| before | `fd09813b-2c4e-4190-8fb0-fecc20378c35` | `verification_failed` |
| after | `5d3e0716-f234-476f-bd03-1be0a647ed5b` | `passed` |

All phases reference the unchanged protected test SHA-256 `cba82a4a759f3bca8a2e79196d39107b061a87aed89465b4c9cae16dbe4521f7`.
The main application and protected acceptance test were not modified.
Raw packs, uploaded/prepared source, browser profiles, databases and logs remain
ignored local artifacts. This document uses only sanitized dashboard records.

## Other checks and limits

The offline suite and Vite production build passed. Separate renderer checks
confirmed import, approval and live controls are present with empty history.
ZIP tests cover unsafe paths, links, duplicate names, exclusions, immutable source
checks and unsupported React imports. Imported server-side template logic must
match the known adapter; uploaded tests and other templates are not trusted.

New AI Studio React projects remain **inspection-only** until their real source
export is supplied and a startup adapter, fault validator, independent invariant
and acceptance test are implemented and verified. No live React battle or
arbitrary-project support is claimed. Gemini launch requires environment variables
in the Arena server itself; the passing run above intentionally used scripted mode.
