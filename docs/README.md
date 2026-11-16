# BuildBreak Arena documentation

Choose a path through the project. Guides explain how to use the current code;
evidence accounts describe what actually ran, including failures and limits.

| I want to… | Start here |
| --- | --- |
| Understand the product and start the app | [Main README](../README.md) |
| Run a controlled or agent-driven battle | [Runner guide](guides/replayable-battles.md) |
| Configure optional Gemini or replay a cache | [Gemini and cache setup](guides/gemini-breaker.md) |
| See a genuine generated fault and repair | [First Gemini drill](evidence/gemini-first-battle.md) |
| Inspect the successful cached replay | [Cached replay](evidence/cached-replay.md) |
| Read a result without running agents | [Clearly labeled sample report](evidence/sample-report.md) |
| Understand screenshot provenance | [Recorded screenshots](guides/evidence-screenshots.md) |
| Rehearse the presentation | [Demo guide](demo/demo-guide.md) |
| Understand source and environment safeguards | [Execution boundary](guides/execution-boundary.md) |
| Compare the Builder with and without feedback | [Unscored ablation](guides/builder-ablation.md) |
| Find the checkout fixture's requirements | [BreakShop requirements](specs/breakshop-requirements.md) |
| Import the first human-triggered experiment | [Historical import guide](guides/historical-dashboard.md) |

## Folder guide

- **`guides/`** — current setup, commands and implementation limits.
- **`evidence/`** — sanitized run accounts, feasibility results and the sample report.
- **`demo/`** — presentation notes and rehearsal material.
- **`specs/`** — requirements used for the demonstration.
- **`images/`** — reviewed public screenshots, original banner and image hashes.

Raw packs, databases, local configuration, caches and the generated video remain
private under Git-ignored storage. Historical accounts retain the command names
used at the time; use the current guides for today's package paths.
