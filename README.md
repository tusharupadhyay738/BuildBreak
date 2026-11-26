# BuildBreak Arena

AI writes your tests. Arena shows which real bugs they would miss.

## Recorded escape

| Recorded quote for two tickets with EARLY15 | Healthy copy | Changed copy |
| --- | ---: | ---: |
| Subtotal | $136.00 | $136.00 |
| Discount | $20.40 | $6.80 |
| Total | $115.60 | $129.20 |
| Recorded dashboard battle ID | `20261124T151404-6db82d63` | |

The change was a scripted pricing change on an isolated SeatPilot copy. Kane's approved catalog test passed on the changed copy, so Arena exposed a coverage gap, and Kane then designed a pricing test for it. [Read the recorded evidence](docs/evidence/seatpilot-generated-escape.md).

## Why separate roles

- Kane proposes generated tests and runs approved checks; protected curated demo tests are separate.
- Gemini sees the locked test and proposes a bounded fault for it; it cannot edit the test.
- Codex repairs from failure evidence.
- Approved tests are hash-locked so a repair cannot weaken them.

The agent that writes the code shouldn't be the one grading it.

## Using it on your own app

- Supported demos today: bundled BreakShop and SeatPilot.
- Generated testing today: one qualified suite and pricing edits only.
- A new app needs a reviewed adapter and a repeatable observation.
- The LOCAL judge path accepts a versioned static-data site contract; it does not run arbitrary server code.
- Generated tests describe current behavior; they are regression tests, not proof of correctness.
- Arena complements mutation testing and chaos engineering; it does not replace them.

**Roadmap — NOT implemented:** a CI step, more apps, and more fault types.

![Recorded BreakShop battle: Kane caught a $5.40 discount on a $44.97 cart and verified $4.50 after one repair.](docs/images/arena-checkout-banner.svg)

[Try Arena locally](#quickstart) · [Inspect a recorded repair](#see-the-evidence) · [Launch a battle](#launch-through-the-dashboard) · [Explore the code](#repository-map)

## Why we built it

A checkout can look fine and still charge the wrong amount. When we built BreakShop, we wanted to answer two questions before shipping. Would our browser test notice a wrong discount? If it did, could a coding agent use that failure to repair the app and pass the **same test**?

Arena lets a developer rehearse that incident on a disposable copy. Give it a supported app and an acceptance test you trust. Arena checks the healthy flow, puts one measurable bug in the copy and follows it through detection and repair. You get a record of what the browser saw, how many repair attempts the Builder needed and which checks passed afterward. A proven bug that slips through the browser test is recorded as an **escape**.

## See the evidence

In one recorded BreakShop run, the cart subtotal was **$44.97**. The discount should have been **$4.50**. After Gemini's change, Kane read **$5.40** in the browser. A fresh Codex session repaired the app on its first attempt. Kane then read **$4.50** and a **$40.47** total using the original test. The broken run stopped before it recorded a final total. [Read the November 18 run account](docs/evidence/gemini-pricing-battle-2026-11-18.md).

![Arena's comparison table for the recorded BreakShop battle. The discount moves from $5.40 before repair to the expected $4.50 after repair.](docs/images/arena-comparison.png)

### The repair loop

![The five stages of the recorded BreakShop run, ending with Kane verifying the repair.](docs/images/arena-timeline.png)

```mermaid
flowchart TD
    START["Choose a supported app and test scenario"] --> APPROVE["Developer reviews and approves the selected test"]
    APPROVE --> LOCK["Lock the approved test hash"]
    LOCK --> BASE["Kane runs the test on a healthy isolated copy"]
    BASE --> FAULT["Breaker proposes or selects a bounded fault"]
    FAULT --> VALIDATE["Arena validates the change and independently checks its impact"]
    VALIDATE --> BROKEN["Kane runs the approved test on the changed copy"]
    BROKEN --> DETECT{"Does the test detect the verified fault?"}
    DETECT -->|No| ESCAPE["Record an escape and coverage gap"]
    DETECT -->|Yes: failure evidence| REPAIR["Codex repairs from source, requirements, and failure evidence"]
    REPAIR --> CHECK["Arena checks the repair and reruns relevant automated checks"]
    CHECK -->|Checks pass| VERIFY["Kane reruns the same approved test"]
    CHECK -->|Checks fail; attempts remain| REPAIR
    CHECK -->|Three attempts exhausted| HUMAN["Route to human review"]
    VERIFY --> PASS{"Does the same test pass?"}
    PASS -->|Yes| DONE["Record the verified repair"]
    PASS -->|No; attempts remain| REPAIR
    PASS -->|Three attempts exhausted| HUMAN
```

| When you run a battle | What happens |
| --- | --- |
| **You approve the check** | Arena shows the acceptance test, protects its hash and runs the healthy baseline on an isolated copy with its own database. |
| **The Breaker proposes a fault** | Gemini proposes a bounded code edit. Arena validates the edit and checks its effect independently, for example by reading a saved order. |
| **Kane exercises the broken app** | Kane uses Chrome to run the approved test. A confirmed application failure sends evidence to the Builder. A pass despite a directly verified fault records an escape. |
| **Codex repairs from evidence** | A fresh Builder receives the broken source, written requirements and failure feedback. Arena checks the proposed repair and reruns the relevant automated checks. |
| **Kane verifies again** | The same browser test decides whether the exercised flow passes after repair. After three unsuccessful repair attempts, the battle goes to human review. Browser or infrastructure issues are tracked separately. |

## Quickstart

**Browse the shop and console locally without an account.** No hosted public build is linked in this repository; from a clone, run the commands for your platform.

```sh
git clone https://github.com/tusharupadhyay738/BuildBreak.git
cd BuildBreak
```

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

**macOS or Linux**

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app.py
```

Open the [Arena dashboard](http://127.0.0.1:5000/arena) or try two shirts, one sticker pack and SAVE10 in [BreakShop](http://127.0.0.1:5000). Use fictional checkout details. A fresh clone starts with empty battle history; the dashboard shows a clearly labeled fictional UI demo until recorded results are available. That demo is not Kane evidence and does not count toward battle totals. For genuine historical results, open the [recorded battle](docs/evidence/dashboard-project-battle.md) or the [labeled sample report](docs/evidence/sample-report.md).

### Try the Kane-generated judge workflow locally

This path currently supports the included fictional Museum site and ZIPs that
match the [LOCAL static-data contract](docs/guides/local-adapter-contract.md).
You can browse the dashboard without agent accounts; a live battle needs Kane
CLI and Codex CLI signed in, Chrome, Playwright from `requirements.txt`, Kane
credits, and a Gemini API key on a free-tier project with billing disabled.
Keep the key in the launching terminal only. [Free-tier setup](docs/guides/gemini-breaker.md).

1. In that terminal, confirm `kane-cli.cmd whoami` on Windows (or `kane-cli whoami` elsewhere) shows a valid token and `codex` is available. Configure Gemini using the linked guide. Set `ARENA_ENABLE_LIVE_KANE=1` and start `app.py` from the same terminal.
2. Open `http://127.0.0.1:5000/arena`. Choose **Museum Exhibit Price Card** or import a compatible LOCAL ZIP, then open its preflight. The text shown there is a **requirements preview**, not a pre-approved test.
3. Click **Start judge workflow**. Kane designs one test from the contract. Arena rejects optional required actions, binds the start URL only in disposable test copies, locks the source hash, and requires two verified healthy browser passes. A failed or unstable baseline stops the battle.
4. Review the exact Gemini fault and diff when the dashboard asks. Approve or reject it within two minutes. If approved, Arena checks the changed behavior, Kane tests the broken copy, Codex repairs from failure evidence, and Kane re-verifies. Watch the progress and inspect the saved verdict.

Each Arena server process permits one judge workflow; restart the local server
for another attempt. Imported scripts and servers are never executed. The
Museum test has [two recorded healthy Kane passes](docs/evidence/museum-generated-healthy.md);
a [controlled changed-copy Kane check](docs/evidence/museum-generated-healthy.md)
also failed the unchanged test as expected. A complete live Gemini–Codex
battle through this new dashboard path has **not**
yet been recorded. Treat an untested judge ZIP or CLI failure as a stopped run,
not as a verified repair.

## Launch through the dashboard

![Current Arena console showing the two demos, source ZIP import, local prerequisite checks and the test approval control.](docs/images/arena-dashboard.png)

1. **Enable local execution.** Install Chrome and authenticate the Kane and Codex CLIs. For Gemini, configure its free-tier model and key in the shell that starts Arena. Stop the preview server first. In PowerShell set `$env:ARENA_ENABLE_LIVE_KANE = "1"`, then run the same app launch command. On macOS or Linux run `ARENA_ENABLE_LIVE_KANE=1 .venv/bin/python app.py`. [Setup guide](docs/guides/self-service.md) · [Gemini configuration](docs/guides/gemini-breaker.md).
2. **Choose a project.** Select **Use built-in BreakShop**, **Try SeatPilot ticket booking**, or import a supported source ZIP. Review the preflight checks and the acceptance test, then approve the test.
3. **Start full battle.** Select Gemini or the scripted demo. Watch the progress and Kane's isolated Chrome viewport. The feed is read-only while Kane drives the browser. [Live monitor guide](docs/guides/live-kane-monitor.md).
4. **Inspect the result.** Review expected and observed values, step through the timeline, open available verified screenshots and copy the battle summary. The live viewport shows activity. The verdict comes from the recorded verification. [Dashboard-launched BreakShop run](docs/evidence/dashboard-project-battle.md).

### Try the SeatPilot booking demo

![SeatPilot's event-booking home page served by its local Flask API, with three fictional cultural events and booking lookup.](docs/images/seatpilot-booking.png)

SeatPilot is a second application with a different question to test. When someone reserves tickets, do the saved booking and remaining inventory agree? The adapter pairs the AI Studio React design with a local Flask API and a separate protected booking test. It requires Node.js and npm to build the frontend. The image shows the running website. Live Kane repair evidence published here covers BreakShop. [Supported imports and adapter limits](docs/guides/self-service.md).

Choose **SeatPilot generated suite** to run the human-approved catalog filter and reset regression. It is separate from SeatPilot's protected curated booking test and passed twice on fresh healthy copies. That qualifies its observed catalog behavior only; it does not make the test generally trusted or show that it catches faults. In a separate recorded battle, the unchanged catalog test passed on a changed copy after Arena's independent quote check confirmed a pricing fault, so that fault escaped. Dashboard states keep healthy qualification separate from confirmed-fault results; missing results are not recorded. [Generated-suite guide](docs/guides/generated-seatpilot.md) · [Recorded pricing escape](docs/evidence/seatpilot-generated-escape.md).

**Generated-mode scope:** bundled SeatPilot only, one qualified test in each selected suite, and numeric edits inside `pricing()` only. The dashboard currently selects the qualified catalog suite. A follow-up pricing test is eligible only after two fresh healthy passes; its separate CLI route requires the suite name and exact approved SHA-256. This is regression testing against observed healthy behavior, not general website support or proof of correctness. [Qualification and CLI instructions](docs/guides/generated-seatpilot.md).

The catalog suite remains the only qualified generated suite. The pricing follow-up passed its healthy price assertion but hit a network-inspection timeout; it was not promoted and no follow-up Gemini battle was run. [Qualification failure and credits](docs/evidence/seatpilot-pricing-qualification.md).

## Run a real battle from the CLI

The default command starts a Gemini battle with a fresh Codex Builder and up to three repair attempts.

```powershell
.\.venv\Scripts\python.exe battle_runner.py --builder codex --max-attempts 3
```

On macOS or Linux use `.venv/bin/python battle_runner.py --builder codex --max-attempts 3`.

| Breaker option | When to use it |
| --- | --- |
| `--breaker gemini` (default) | Generate a bounded logic fault. Requires an environment-only API key, an available free model and explicit free-tier confirmation. |
| `--breaker scripted` | Use a prepared fault for a reproducible demo without a Gemini call. |
| `--breaker cached --cached-fault <file>` | Revalidate a privately saved Gemini proposal and replay it without a new Gemini call. |
| `--breaker codex` | Have Codex choose between two controlled faults. |

Missing Gemini configuration stops the run. If configured proposals fail validation or requests fail, the runner can use a validated controlled fallback and records the actual producer. **Offline fault selection** with scripted or cached mode still requires Kane access for browser verification and Codex access when using the Codex Builder. [Runner prerequisites](docs/guides/replayable-battles.md) · [Genuine cached replay](docs/evidence/cached-replay.md).

## What is proven?

| Question | Evidence and scope |
| --- | --- |
| Did the loop catch and repair a generated bug? | The November 18 BreakShop run recorded a healthy pass, a failure on the broken copy and a pass after one Codex repair. [Run account](docs/evidence/gemini-pricing-battle-2026-11-18.md). |
| Can a developer watch Kane use a site? | A standalone checkout verification showed changing Chrome frames inside Arena. A separate dashboard-launched BreakShop drill followed the baseline, failure and repair. [Viewport verification](docs/evidence/live-browser-view.md) · [Dashboard run](docs/evidence/dashboard-project-battle.md). |
| Which projects can run? | BreakShop and the reviewed SeatPilot export have explicit adapters. Other uploads receive a compatibility inspection. An arbitrary public URL provides insufficient source to inject and repair a fault. |
| How far does a pass generalize? | It covers the exercised flow. The dashboard summarizes eligible executions among the ten most recent records. Replaying a fault adds an execution. Broader coverage, a live SeatPilot repair and the effect of Kane feedback alone remain open questions. |

The Builder gets written requirements as well as failure evidence. The original healthy source, hidden patch and Git history stay outside its repair context. Generated repairs undergo code and environment checks. Run the tool locally with fictional data. Raw evidence, cookies, databases and fault caches stay local. [Execution boundary](docs/guides/execution-boundary.md) · [Unscored Builder feedback comparison](docs/guides/builder-ablation.md) · [Screenshot provenance](docs/guides/evidence-screenshots.md).

## Repository map

| Area | Where to look |
| --- | --- |
| App and CLI entry points | [app.py](app.py) · [battle_runner.py](battle_runner.py) |
| Runner, agents and validators | [buildbreak/](buildbreak/) |
| Dashboard design and Flask views | [frontend/](frontend/) · [templates/](templates/) |
| Ticket booking adapter and demo | [examples/seatpilot/](examples/seatpilot/) |
| Protected browser checks and offline tests | [.testmuai/tests/](.testmuai/tests/) · [tests/](tests/) |
| Recorded results and demo walkthrough | [Evidence accounts](docs/evidence/) · [Three-minute demo guide](docs/demo/demo-guide.md) |

Run the offline suite with `.\.venv\Scripts\python.exe -m unittest discover -s tests -t .` on Windows, or `.venv/bin/python -m unittest discover -s tests -t .` on macOS or Linux. Mocked tests exercise runner behavior. Published live results link to separate run accounts.

[Full documentation index](docs/README.md)

[Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)
