# BuildBreak Arena: three-minute demo guide

Target length: 3:00. The spoken draft below is approximately 330 words; rehearse
at a comfortable pace and keep the strongest evidence ahead of extra detail.
Record the real app, real run history, and genuine evidence viewer. Clearly
label cuts or time compression. Do not imply a prerecorded battle is live.

## Before recording

- Choose a genuine completed automatic battle in Arena, not a unit-test fixture
  or an earlier interrupted run. Check all three execution references.
- This spoken draft matches the live Gemini discount drill
  `20261114T181556-024e132e`, documented in `gemini-first-battle.md`. A cached
  replay must be labeled as cached; do not present it as live Gemini generation.
- Before recording submission footage, confirm the public repository contains
  the reviewed implementation being shown. Local uncommitted work is not yet
  available for judges to reproduce.
- Open its failed and passing sealed evidence packs privately using Kane's
  evidence viewer. Keep the serving process running so the links remain usable.
- Use fictional checkout data. Hide account identifiers, cookies, terminal
  secrets, local private paths, and provider share tokens from the recording.
- Keep raw evidence off the public repository. Show the relevant result and
  browser trace, not unfiltered network logs.
- Prepare the runner command and README. Judges need their own authenticated
  Kane and Codex CLI installations to reproduce a new battle.

## 0:00–0:25 | The problem

Show: Arena's headline and the three role cards.

Say:

"AI can write a fix quickly. But a coding agent saying 'fixed' is not proof
that a user can complete the flow. BuildBreak Arena makes that claim testable.
A Breaker challenges an application, a Builder proposes a repair, and Kane
independently checks what happens in a real browser."

## 0:25–0:50 | Establish trust

Show: the completed battle and its healthy-baseline result.

Say:

"Our test application is BreakShop, a small local checkout. The runner first
verifies the healthy application before introducing a defect. Two T-shirts
and a sticker pack cost $44.97. SAVE10 should deduct $4.50, leaving $40.47.
The expected values are independent of the application's displayed total."

## 0:50–1:25 | Show the actual failure

Show: the broken-application result, then its genuine browser evidence.

Say:

"Gemini proposed changing SAVE10 to fifteen percent off. Arena validated the
small patch in a separate copy. Kane caught a $6.75 discount instead of $4.50
and stopped before checkout. Separately, Arena's direct check confirmed a
wrong saved total of $38.22. These are distinct evidence sources. A browser
or infrastructure failure does not count as a caught application defect."

## 1:25–2:05 | Explain the feedback loop

Show: the timeline's Builder attempt and unit-test event.

Say:

"The runner passes the genuine failure to a fresh Codex Builder session.
Its supplied context contains the broken source and failure evidence,
without the selected fault or original source. The Builder returns a repair
proposal. The runner rejects invalid code or changed routes, protects the
acceptance test, and runs the app tests. It allows at most three repair
attempts before asking for human review."

## 2:05–2:35 | Show independent proof

Show: passing evidence, including confirmation reload, then Arena's three checks.

Say:

"The Builder's answer still does not count as a win. Kane runs the unchanged
acceptance test again. In this battle, the first repair succeeds: checkout
shows $40.47, and reloading retains the same order and amounts. The runner
archives the evidence, checks its identity and test hash, and updates Arena
automatically. No one manually changes a failure into a pass."

## 2:35–3:00 | Reproduction and limits

Show: README runner command and the method-and-limitations panel.

Say:

"Developers can evaluate their testing and repair workflow before shipping.
Arena supports validated Gemini faults, cached replay and controlled fallbacks.
Judges need their own logins; cached replay needs no Gemini call. This supports
one checkout scenario, not arbitrary websites or vulnerability discovery.
Context separation is a guardrail, and one passing drill is not full-app proof."

## Questions to practise

**Why a shopping app?** It provides a familiar, measurable target. Arena is
the product; the checkout is deliberately small so the repair loop is clear.

**Does Kane fix the source code?** Codex proposes the code repair. Kane checks
the browser behavior. Kane's test-healing capability is a separate concept;
adaptive healing is disabled in these battles.

**Is this fully autonomous?** A person launches the local command. After that,
the runner can coordinate generation or controlled selection, detection, repair and
verification without manual message-passing. It can stop for errors or human
review, and its supported mutation scope is explicit.

**Can the agents cheat by changing the tests?** The runner checks protected-file
hashes and does not apply test edits from the Builder. This is a practical
guardrail, not a formal security proof.

**What if a run fails for the wrong reason?** It remains an interrupted or
unresolved result. The fresh-checkout checks already exposed a replay-format
case and a captured order-number issue; both were investigated and documented
rather than relabeled as application successes.
