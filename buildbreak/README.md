# Implementation map

Start the app with `python app.py` or a battle with `python battle_runner.py` from
the repository root. This package contains their implementation.

| Area | Modules |
| --- | --- |
| Read-only dashboard | `arena.py`, `battle_history.py`, `evidence_images.py` |
| Battle coordination and owned subprocesses | `battle_runner.py`, `process_control.py` |
| Generated faults and independent validation | `gemini_breaker.py`, `fault_validator.py` |
| Cache creation and replay bindings | `cache_faults.py`, `fault_cache.py` |
| Explicit historical import tools | `import_battle.py`, `import_drill_history.py` |

The root `arena.py` is a compatibility import so the hash-bound BreakShop source
does not need to change. `battle_runner.py` at the root is a small CLI launcher.
Neither contains a second implementation.

Battle snapshots use an explicit allowlist. They copy the web modules needed by
the demo, not the runner, fault generators, repository history or private data.
The Builder's supplied context remains limited to broken `app.py` and feedback.

[Project overview](../README.md) · [Guides and genuine run accounts](../docs/README.md)
