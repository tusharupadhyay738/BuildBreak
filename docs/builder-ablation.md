# Builder comparison: requirements without Kane feedback

The normal Builder already receives explicit written pricing requirements,
including the expected amounts. We have not measured how much Kane's failure
feedback adds to repair success. This option supports that comparison; it does
not establish a causal benefit by itself.

To run the experiment yourself, use a fresh invocation with a validated cached
fault, preferably the same fault and baseline used by a normal comparison run:

```powershell
.\.venv\Scripts\python.exe battle_runner.py --breaker cached --cached-fault "instance/fault-cache/CACHE_ID.json" --builder codex --ablate-kane-feedback
```

```sh
.venv/bin/python battle_runner.py --breaker cached --cached-fault instance/fault-cache/CACHE_ID.json --builder codex --ablate-kane-feedback
```

This is a real run when invoked: Kane and Codex use their authenticated services
and allowances. Cached mode calls no Gemini API. No live ablation was run during
implementation. All ablation tests used mocked agents and browser results.

The option forces exactly one Builder attempt. Healthy and broken verification
still run normally. A confirmed application failure is still required before
repair begins. The Builder gets only broken source plus the normal written
requirements, with Kane failure text withheld. It receives no fault patch,
description or healthy source. A repaired pass still requires automated tests,
the selected direct invariant and the unchanged Kane acceptance test.

Each invocation gets its own history record marked
`experiment=builder_without_kane`, an explicit dashboard label and no scored
drill outcome. Experiments are excluded from detection and repair counts even
if their verification passes. No normal record or historical verdict is changed.
An escape starts no repair; infrastructure problems remain distinct.

Compare the normal and experimental records by baseline, cache identity,
protected test hash, actual attempt count and verification results. Different
generated faults or baselines are not a matched comparison. A single pair can
illustrate behavior; repeated matched runs would be needed for a reliable rate.
