# Offline project tests

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -v
```

```sh
.venv/bin/python -m unittest discover -v
```

| Area | Tests |
| --- | --- |
| Shop and dashboard | `test_app.py`, `test_arena.py`, `test_evidence_images.py` |
| Runner and history | `test_battle_runner.py`, `test_battle_history.py`, `test_local_evidence.py` |
| Faults, cache and independent probes | `test_fault_validator.py`, `test_fault_cache.py`, `test_quantity_fault.py` |
| Agent contracts and comparison | `test_gemini_breaker.py`, `test_gemini_runner.py`, `test_builder_ablation.py` |
| Environment, code guards and layout | `test_process_control.py`, `test_repository_layout.py` |

Mocked agent/browser results are synthetic fixtures, never live battle evidence.
The real Kane Markdown definitions remain in `.testmuai/tests/`; the protected
checkout definition and its hash protection are unchanged.

The runner copies the app tests into isolated snapshots using their original
`test_app.py` and `test_arena.py` names. This preserves strict cache bindings and
the existing app-test subprocess contract while keeping the repository tidy.

## SeatPilot booking retries

With Chrome, Node.js, npm and the optional Python package `playwright` installed,
run `python -m tests.seatpilot_browser_retry` using the project environment.
This local Chrome test lets Flask save a two-ticket booking, drops the first
confirmation response, reloads the page and repeats the request. It checks
that the same reference returns and exactly two seats were reserved. It runs
against a temporary database and makes no Kane or model calls.
