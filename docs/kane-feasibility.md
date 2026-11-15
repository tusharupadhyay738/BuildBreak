# Kane feasibility gate: local BreakShop

Checked November 15, 2026 against installed Kane CLI version `0.10.2` using the
requested `explore run --help`, `design tests --help` and `cover --help` commands.

## Confirmed capability

Exploration defaults to remote HyperExecute, but this CLI supports
`--local-orchestration --browser local`. A public URL or LT tunnel is therefore
not required to reach local BreakShop in that mode. Remote-browser localhost
access is a different path and was not tested.

## One bounded real attempt

A fresh isolated copy used an empty demo database and an empty Arena history.
The exact scope was prompt `explore cart and checkout`, policy `read_only`,
one parallel browser, one lease, and depth caps `0:3,1:1`. Local Chrome was
headless. No authentication data was supplied in the app, and no real payment
or personal checkout data was used.

Exploration identifier: `01a1de61-4c31-7d09-8da8-9793f79e9be3`.
Run identifier: `01a1de61-4dd0-75bf-bbe9-a9c5b9a92e8b`.

The command exited 0 and the local server recorded HTTP 200. The final event
reported 1 junction, 12 candidate controls, 7 observations, 0 completed flows,
0 findings, and `complete: false`, with stop reason `budget_leases`. This is a
partial entry map, not completion of cart/checkout exploration. Read-only policy
does not authorize the cart and checkout POST writes.

The before/after balance changed from 9931.7387 to 9930.2473: approximately
1.4914 Kane credits during the measurement window. The run's own `credits.total`
reported 1.49145. Its separate `credits_consumed` field reported 0; the estimate
above uses the measured balance difference and agrees with `credits.total`.

No exploration retry was performed. Raw CLI output, map/session data, balances,
screenshots and databases remain private, excluded from Git.

## Requirements-based fallback

Because this bounded read-only attempt completed no cart/checkout flows, use
`breakshop-requirements.md` as the explicit source for a separately generated
happy-path test. The intended sequence is context ingest, extract with explicit
headless mode, human context review, then design tests and one healthy-app run.
Review must not be bypassed through `--allow-unreviewed` or automatic approval.

Requirements ingestion succeeded in a separate local context store under ignored
feasibility storage. Extraction with explicit `--mode override --trust hold`
paused with one held proposal, temporary reference `n1`: "Place a discounted
order and revisit its confirmation." Its seven criteria cover the fake/local
fixture, empty cart reset, catalog prices, 2-shirt/1-sticker subtotal, SAVE10
rounding, one fictional checkout, and same-order confirmation reload. The
extraction stream reported 2.56 additional credits, separate from exploration.

`context review --mode agent --json` refused with `TTY_REQUIRED`, explaining that
verdict queues need a terminal or an explicit verdicts file. An attempted resume
with `--trust auto` was rejected by automatic
approval review before execution because it could save/promote held items before
the owner's approval. That command did not run.

The owner subsequently authorized proceeding with the exact held proposal.
Extraction resumed in agent mode for that proposal only, producing `uc-1`.
Its title and seven criteria were compared with the held proposal. Explicit
verdict files approved that use case and the 18 acceptance criteria derived
within its scope. No `--allow-unreviewed` option was used.

`design tests --use-case uc-1 --max 1 --strength pairwise --mode override --json`
produced one eight-step checkout test. The local context store and its variable
file remain private; this is a generated happy path, not a comprehensive suite.

## One generated healthy-app run

The generated definition is saved separately as
`.testmuai/tests/KaneGeneratedCheckout_test.md`. It was run once with `testmd run`,
headless desktop testing, no adaptive healing, a fresh isolated database and a
run-supplied local start URL. The result exited 0: eight of eight steps passed.
Execution identifier: `34493b75-4a13-49fe-ae22-0d65879e25f3`.

The saved sealed pack was copied byte-for-byte and checked for execution
identity, passed verdict, definition hash and isolated target URL. It stays
Git-ignored. Definition SHA-256:
`f91cd2b2529ad147210ce7483401af360edf281d9078bd398af39aed40a15d7d`.

This run exercised cart/coupon reset, catalog prices, the two-shirt/one-sticker
SAVE10 order, and the same confirmation after reload. It does not establish
quantity boundaries, concurrent submissions, all checkout combinations or
full-app correctness. Kane's reported criterion coverage applies only to the
18 generated criteria. It does not measure application-wide coverage.

The existing protected `CheckoutConsistency_test.md`, its hash protection and
the battle runner's choice of acceptance test remain unchanged. The additional
generated test is not substituted into normal battles.
