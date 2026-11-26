(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`ready`,dataSourceLabel:`Fictional UI demo (SAMPLE)`,notice:`Fictional UI demo (SAMPLE), not recorded Kane evidence. Connect Flask + SQLite to inspect your own recorded battles.`,activeBattleId:`SAMPLE-BTL-001`,battles:[{id:`SAMPLE-BTL-001`,title:`Checkout order total renders NaN when tax rate is omitted`,targetApp:`SAMPLE Target · minimalist-shop`,recordedLabel:`SAMPLE · Historical record #1`,breaker:`Gemini (Fault Proposer)`,faultFamily:`State / NaN Arithmetic`,outcome:`Success`,outcomeTone:`success`,repairAttempts:1,maxAttempts:3,summary:`Injected an undefined taxRate property read inside calculateTotal(), causing checkout summary rendering to emit NaN and throw an unhandled TypeError.`,stages:[{key:`propose`,actor:`Gemini`,label:`Proposes fault`,state:`Completed`,note:`SAMPLE · Proposed missing nullish guard in checkout.ts`,traceSnippet:`SAMPLE diff: - const tax = summary.taxRate ?? 0;
SAMPLE diff: + const tax = summary.taxConfig.calculateTotal(); // fault injected`},{key:`validate`,actor:`Arena`,label:`Validates fault`,state:`Completed`,note:`SAMPLE · Patch applied cleanly on isolated workspace`,traceSnippet:`SAMPLE arena-validator: git apply --check PASSED · target compiles, baseline assertion broken`},{key:`kane_break`,actor:`Kane CLI`,label:`Checks broken app`,state:`Completed`,note:`SAMPLE · Reproduced failure & recorded pre-repair capture`,traceSnippet:`SAMPLE kane-cli: FAIL CHK-01 [data-testid="order-total"] -> "NaN" (exit 1)`},{key:`codex_repair`,actor:`Codex`,label:`Repairs fault`,state:`Completed`,note:`SAMPLE · Restored numeric fallback in 1 repair attempt`,traceSnippet:`SAMPLE codex-patch: + const rate = Number(summary.taxConfig?.rate ?? 0);
SAMPLE codex-patch: + return subtotal + shipping + rate;`},{key:`kane_verify`,actor:`Kane CLI`,label:`Verifies again`,state:`Completed`,note:`SAMPLE · Assertions passed & verification capture saved`,traceSnippet:`SAMPLE kane-cli: PASS CHK-01, CHK-02, CHK-03 · Total="$148.00" (exit 0)`}],comparisons:[{check:`Order summary total text`,expected:`$148.00`,actualPreRepair:`NaN`,actualPostRepair:`$148.00`,matched:!0},{check:`Console uncaught TypeError count`,expected:`0 errors`,actualPreRepair:`1 error (checkout.ts:145)`,actualPostRepair:`0 errors`,matched:!0},{check:`Primary submit button layout overlap`,expected:`0 px overlap with shipping input`,actualPreRepair:`14 px vertical overlap`,actualPostRepair:`0 px overlap`,matched:!0}],screenshots:{failure:{status:`available`,url:`/static/console/src/assets/images/sample_kane_failure_checkout_1794916696972.jpg`,caption:`Recorded Kane failure capture · SAMPLE (not live)`,artifactPath:`artifacts/SAMPLE-BTL-001/kane-failure.jpg`,alt:`Sample recorded Kane CLI failure screenshot showing NaN total and TypeError console bar on checkout page`},repair:{status:`available`,url:`/static/console/src/assets/images/sample_kane_repair_checkout_1794916697532.jpg`,caption:`Recorded Kane repair capture · SAMPLE (not live)`,artifactPath:`artifacts/SAMPLE-BTL-001/kane-verify.jpg`,alt:`Sample recorded Kane CLI verification screenshot showing repaired checkout page with $148.00 total`}},verification:{kaneExitCodeBefore:1,kaneExitCodeAfter:0,checksSummary:`SAMPLE · 3 assertions checked pre-repair (3 failed) and post-repair (3 passed)`,checks:[{id:`CHK-01`,command:`kane check --route /checkout --assert-no-nan`,result:`Pass after repair`,detail:`DOM selector [data-testid="order-total"] resolved to "$148.00".`},{id:`CHK-02`,command:`kane check --route /checkout --console-budget 0`,result:`Pass after repair`,detail:`Zero uncaught runtime exceptions observed during checkout flow.`},{id:`CHK-03`,command:`kane check --route /checkout --layout-overlap`,result:`Pass after repair`,detail:`Bounding box clearance confirmed between shipping textarea and submit control.`}],stdoutExcerpt:`[SAMPLE] kane-cli: verifying target /checkout (pre-repair)
[SAMPLE] FAIL CHK-01 expected "$148.00", got "NaN"
[SAMPLE] FAIL CHK-02 TypeError: Cannot read properties of undefined (reading 'calculateTotal')
[SAMPLE] codex-repair: applied patch SAMPLE-FIX-001 (attempt 1/3)
[SAMPLE] kane-cli: verifying target /checkout (post-repair)
[SAMPLE] PASS CHK-01, CHK-02, CHK-03 (exit 0)`,identifiers:{battleId:`SAMPLE-BTL-001`,geminiProposalId:`SAMPLE-GEM-901A`,arenaValidationId:`SAMPLE-ARN-402B`,kaneBreakRunId:`SAMPLE-KNE-710F`,codexRepairId:`SAMPLE-CDX-118R`,kaneVerifyRunId:`SAMPLE-KNE-711V`,sqliteRowKey:`battles.id = 1 (SAMPLE)`}}},{id:`SAMPLE-BTL-002`,title:`Invoices query duplicates rows and overflows pagination bar`,targetApp:`SAMPLE Target · billing-ledger`,recordedLabel:`SAMPLE · Historical record #2`,breaker:`Gemini (Fault Proposer)`,faultFamily:`SQLite / Duplicate Join`,outcome:`Success`,outcomeTone:`success`,repairAttempts:2,maxAttempts:3,summary:`Introduced an ungrouped LEFT JOIN on invoice_events alongside a fixed-height table wrapper, duplicating rows and clipping pagination controls.`,stages:[{key:`propose`,actor:`Gemini`,label:`Proposes fault`,state:`Completed`,note:`SAMPLE · Proposed ungrouped SQLite join + CSS overflow clip`,traceSnippet:`SAMPLE diff: SELECT invoices.* FROM invoices LEFT JOIN invoice_events ON ... -- missing GROUP BY`},{key:`validate`,actor:`Arena`,label:`Validates fault`,state:`Completed`,note:`SAMPLE · Confirmed HTTP 500 & row count mismatch`,traceSnippet:`SAMPLE arena-validator: expected 5 unique rows, observed duplicate #INV-4567`},{key:`kane_break`,actor:`Kane CLI`,label:`Checks broken app`,state:`Completed`,note:`SAMPLE · Captured HTTP 500 banner and duplicated #INV-4567 rows`,traceSnippet:`SAMPLE kane-cli: FAIL CHK-11 HTTP 500 · FAIL CHK-12 duplicate key #INV-4567`},{key:`codex_repair`,actor:`Codex`,label:`Repairs fault`,state:`Completed`,note:`SAMPLE · Attempt 1 fixed SQL DISTINCT; Attempt 2 fixed pagination layout`,traceSnippet:`SAMPLE codex-patch (attempt 2/3): GROUP BY invoices.id + .table-shell { overflow: visible; }`},{key:`kane_verify`,actor:`Kane CLI`,label:`Verifies again`,state:`Completed`,note:`SAMPLE · Verified 5 unique rows and visible pagination footer`,traceSnippet:`SAMPLE kane-cli: PASS CHK-11, CHK-12, CHK-13 · HTTP 200 (exit 0)`}],comparisons:[{check:`GET /api/invoices HTTP status`,expected:`200 OK`,actualPreRepair:`500 Internal Server Error`,actualPostRepair:`200 OK`,matched:!0},{check:`Unique invoice IDs per page`,expected:`5 distinct IDs`,actualPreRepair:`3 duplicated (#INV-4567 x3)`,actualPostRepair:`5 distinct IDs`,matched:!0},{check:`Pagination footer bottom clip`,expected:`0 px clipped`,actualPreRepair:`18 px clipped below fold`,actualPostRepair:`0 px clipped`,matched:!0}],screenshots:{failure:{status:`available`,url:`/static/console/src/assets/images/sample_kane_failure_ledger_1794916697795.jpg`,caption:`Recorded Kane failure capture · SAMPLE (not live)`,artifactPath:`artifacts/SAMPLE-BTL-002/kane-failure.jpg`,alt:`Sample recorded Kane CLI failure screenshot showing HTTP 500 banner and duplicate invoice rows`},repair:{status:`available`,url:`/static/console/src/assets/images/sample_kane_repair_ledger_1794916698122.jpg`,caption:`Recorded Kane repair capture · SAMPLE (not live)`,artifactPath:`artifacts/SAMPLE-BTL-002/kane-verify.jpg`,alt:`Sample recorded Kane CLI verification screenshot showing clean 5-row invoice table and pagination footer`}},verification:{kaneExitCodeBefore:1,kaneExitCodeAfter:0,checksSummary:`SAMPLE · 3 assertions checked; repaired after 2 Codex attempts`,checks:[{id:`CHK-11`,command:`kane check --route /invoices --http-status 200`,result:`Pass after repair`,detail:`Endpoint returned HTTP 200 with clean JSON payload.`},{id:`CHK-12`,command:`kane check --route /invoices --unique-row-keys`,result:`Pass after repair`,detail:`All 5 rendered rows carried distinct INV-* primary keys.`},{id:`CHK-13`,command:`kane check --route /invoices --visible-pagination`,result:`Pass after repair`,detail:`Pagination footer remained fully within viewport container.`}],stdoutExcerpt:`[SAMPLE] kane-cli: checking /invoices (pre-repair)
[SAMPLE] FAIL CHK-11 expected status 200, observed 500 banner
[SAMPLE] FAIL CHK-12 duplicate row key #INV-4567 detected
[SAMPLE] codex-repair: attempt 1/3 patched SQLite query
[SAMPLE] codex-repair: attempt 2/3 removed overflow-hidden clip on .table-shell
[SAMPLE] kane-cli: post-repair checks passed (exit 0)`,identifiers:{battleId:`SAMPLE-BTL-002`,geminiProposalId:`SAMPLE-GEM-904C`,arenaValidationId:`SAMPLE-ARN-409D`,kaneBreakRunId:`SAMPLE-KNE-722F`,codexRepairId:`SAMPLE-CDX-125R`,kaneVerifyRunId:`SAMPLE-KNE-724V`,sqliteRowKey:`battles.id = 2 (SAMPLE)`}}},{id:`SAMPLE-BTL-003`,title:`Session refresh triggers 302 redirect loop on /account`,targetApp:`SAMPLE Target · portal-auth`,recordedLabel:`SAMPLE · Historical record #3`,breaker:`Gemini (Fault Proposer)`,faultFamily:`Auth / Cookie Redirect Loop`,outcome:`Missing Evidence`,outcomeTone:`warning`,repairAttempts:1,maxAttempts:3,summary:`Codex submitted a middleware patch, and Kane exited cleanly on CLI assertions, but the post-repair PNG capture artifact was not written to disk.`,stages:[{key:`propose`,actor:`Gemini`,label:`Proposes fault`,state:`Completed`,note:`SAMPLE · Proposed stale cookie check on /account middleware`},{key:`validate`,actor:`Arena`,label:`Validates fault`,state:`Completed`,note:`SAMPLE · Confirmed ERR_TOO_MANY_REDIRECTS`},{key:`kane_break`,actor:`Kane CLI`,label:`Checks broken app`,state:`Completed`,note:`SAMPLE · Failure assertions and screenshot recorded`},{key:`codex_repair`,actor:`Codex`,label:`Repairs fault`,state:`Completed`,note:`SAMPLE · Updated session expiry guard in 1 attempt`},{key:`kane_verify`,actor:`Kane CLI`,label:`Verifies again`,state:`Missing`,note:`SAMPLE · CLI exit 0 recorded, screenshot artifact missing on disk`}],comparisons:[{check:`GET /account redirect hop count`,expected:`0 redirects`,actualPreRepair:`20+ redirects (aborted)`,actualPostRepair:`0 redirects (log only; image missing)`,matched:!0},{check:`Post-repair visual screenshot artifact`,expected:`kane-verify.jpg present`,actualPreRepair:`kane-failure.jpg present`,actualPostRepair:`Artifact not found (ENOENT)`,matched:!1}],screenshots:{failure:{status:`available`,url:`/static/console/src/assets/images/sample_kane_failure_ledger_1794916697795.jpg`,caption:`Recorded Kane failure capture · SAMPLE (not live)`,artifactPath:`artifacts/SAMPLE-BTL-003/kane-failure.jpg`,alt:`Sample recorded Kane CLI failure capture for redirect fault`},repair:{status:`missing`,url:``,caption:`Missing repair capture · SAMPLE`,artifactPath:`artifacts/SAMPLE-BTL-003/kane-verify.jpg`,missingReason:`Verification screenshot file was not found at artifacts/SAMPLE-BTL-003/kane-verify.jpg. Inspect stdout log or re-export evidence from Kane CLI.`}},verification:{kaneExitCodeBefore:1,kaneExitCodeAfter:0,checksSummary:`SAMPLE · Partial evidence: post-repair screenshot artifact absent`,checks:[{id:`CHK-21`,command:`kane check --route /account --max-redirects 2`,result:`Pass (text log only)`,detail:`HTTP 200 observed after Codex middleware update.`},{id:`CHK-22`,command:`kane artifact --verify-png`,result:`Missing artifact`,detail:`Expected screenshot file was not persisted by runner.`}],stdoutExcerpt:`[SAMPLE] kane-cli: checking /account (pre-repair)
[SAMPLE] FAIL CHK-21 exceeded max redirects (20)
[SAMPLE] codex-repair: patched session middleware (attempt 1/3)
[SAMPLE] kane-cli: HTTP 200 OK, but screenshot writer returned ENOENT`,identifiers:{battleId:`SAMPLE-BTL-003`,geminiProposalId:`SAMPLE-GEM-912E`,arenaValidationId:`SAMPLE-ARN-415G`,kaneBreakRunId:`SAMPLE-KNE-740F`,codexRepairId:`SAMPLE-CDX-131R`,kaneVerifyRunId:`SAMPLE-KNE-741V`,sqliteRowKey:`battles.id = 3 (SAMPLE)`}}},{id:`SAMPLE-BTL-004`,title:`SQLite cascade delete drops orphan audit rows on edit`,targetApp:`SAMPLE Target · ledger-core`,recordedLabel:`SAMPLE · Historical record #4`,breaker:`Gemini (Fault Proposer)`,faultFamily:`Schema / Cascade Integrity`,outcome:`Repair Failed`,outcomeTone:`danger`,repairAttempts:3,maxAttempts:3,summary:`Codex exhausted all 3 allowed repair attempts; Kane verification continued to observe missing audit trail rows after parent record update.`,stages:[{key:`propose`,actor:`Gemini`,label:`Proposes fault`,state:`Completed`,note:`SAMPLE · Proposed REPLACE INTO instead of UPDATE on SQLite table`},{key:`validate`,actor:`Arena`,label:`Validates fault`,state:`Completed`,note:`SAMPLE · Audit row count dropped from 4 to 0`},{key:`kane_break`,actor:`Kane CLI`,label:`Checks broken app`,state:`Completed`,note:`SAMPLE · Failure state confirmed and captured`},{key:`codex_repair`,actor:`Codex`,label:`Repairs fault`,state:`Failed`,note:`SAMPLE · Exhausted 3 / 3 repair attempts without resolving cascade`},{key:`kane_verify`,actor:`Kane CLI`,label:`Verifies again`,state:`Failed`,note:`SAMPLE · Verification assertion failed (exit code 1)`}],comparisons:[{check:`Retained audit_log rows after invoice edit`,expected:`4 rows preserved`,actualPreRepair:`0 rows (cascaded delete)`,actualPostRepair:`0 rows (unresolved after 3 attempts)`,matched:!1},{check:`SQLite foreign key integrity check`,expected:`PRAGMA foreign_key_check = empty`,actualPreRepair:`0 rows, history lost`,actualPostRepair:`History loss persists`,matched:!1}],screenshots:{failure:{status:`available`,url:`/static/console/src/assets/images/sample_kane_failure_checkout_1794916696972.jpg`,caption:`Recorded Kane failure capture · SAMPLE (not live)`,artifactPath:`artifacts/SAMPLE-BTL-004/kane-failure.jpg`,alt:`Sample recorded Kane CLI failure capture prior to repair`},repair:{status:`missing`,url:``,caption:`Post-repair capture unavailable · SAMPLE`,artifactPath:`artifacts/SAMPLE-BTL-004/kane-verify.jpg`,missingReason:`Verification failed on attempt 3/3 before post-repair clean capture could be finalized.`}},verification:{kaneExitCodeBefore:1,kaneExitCodeAfter:1,checksSummary:`SAMPLE · Verification failed after maximum 3 repair attempts`,checks:[{id:`CHK-31`,command:`kane check --sqlite-audit-preserve`,result:`Failed (exit 1)`,detail:`Expected 4 audit rows after PATCH /invoices/42, observed 0.`}],stdoutExcerpt:`[SAMPLE] kane-cli: verifying /invoices/42 audit retention
[SAMPLE] FAIL CHK-31 expected 4 audit rows, got 0
[SAMPLE] codex-repair: attempt 1/3, 2/3, 3/3 failed CHK-31
[SAMPLE] arena: battle marked Failed (max attempts reached)`,identifiers:{battleId:`SAMPLE-BTL-004`,geminiProposalId:`SAMPLE-GEM-919H`,arenaValidationId:`SAMPLE-ARN-422K`,kaneBreakRunId:`SAMPLE-KNE-755F`,codexRepairId:`SAMPLE-CDX-139R`,kaneVerifyRunId:`SAMPLE-KNE-758V`,sqliteRowKey:`battles.id = 4 (SAMPLE)`}}},{id:`SAMPLE-BTL-005`,title:`Webhook retry backoff resets to zero after transient 503 response`,targetApp:`SAMPLE Target · webhook-dispatcher`,recordedLabel:`SAMPLE · Historical record #5`,breaker:`Gemini (Fault Proposer)`,faultFamily:`Concurrency / Retry Backoff`,outcome:`Pending Inspection`,outcomeTone:`neutral`,repairAttempts:1,maxAttempts:3,summary:`Codex applied an exponential backoff fix after Kane reproduced tight-loop retries; post-repair verification results are queued for inspection.`,stages:[{key:`propose`,actor:`Gemini`,label:`Proposes fault`,state:`Completed`,note:`SAMPLE · Proposed resetting retryDelayMs on HTTP 503 handler`},{key:`validate`,actor:`Arena`,label:`Validates fault`,state:`Completed`,note:`SAMPLE · Reproduced rapid retry burst in test harness`},{key:`kane_break`,actor:`Kane CLI`,label:`Checks broken app`,state:`Completed`,note:`SAMPLE · Recorded failure assertions and pre-repair capture`},{key:`codex_repair`,actor:`Codex`,label:`Repairs fault`,state:`Completed`,note:`SAMPLE · Restored exponential backoff in 1 attempt`},{key:`kane_verify`,actor:`Kane CLI`,label:`Verifies again`,state:`Pending`,note:`SAMPLE · Post-repair verification awaiting final inspection`}],comparisons:[{check:`Retry delay after 2nd 503 response`,expected:`>= 4000 ms`,actualPreRepair:`0 ms (tight retry loop)`,actualPostRepair:`Pending verification`,matched:!1},{check:`Outbound requests within 5 s window`,expected:`<= 2 requests`,actualPreRepair:`19 requests`,actualPostRepair:`Pending verification`,matched:!1}],screenshots:{failure:{status:`available`,url:`/static/console/src/assets/images/sample_kane_failure_ledger_1794916697795.jpg`,caption:`Recorded Kane failure capture · SAMPLE (not live)`,artifactPath:`artifacts/SAMPLE-BTL-005/kane-failure.jpg`,alt:`Sample recorded Kane CLI failure capture for webhook retry fault`},repair:{status:`missing`,url:``,caption:`Post-repair capture pending · SAMPLE`,artifactPath:`artifacts/SAMPLE-BTL-005/kane-verify.jpg`,missingReason:`Battle is awaiting final Kane CLI verification and human inspection before post-repair capture is finalized.`}},verification:{kaneExitCodeBefore:1,kaneExitCodeAfter:`--`,checksSummary:`SAMPLE · Pre-repair failure recorded; post-repair inspection pending`,checks:[{id:`CHK-41`,command:`kane check --route /webhooks/status --assert-backoff`,result:`Pending inspection`,detail:`Codex patch SAMPLE-CDX-144R staged; verification sign-off pending.`}],stdoutExcerpt:`[SAMPLE] kane-cli: checking /webhooks/status (pre-repair)
[SAMPLE] FAIL CHK-41 expected retry delay >= 4000ms, observed 0ms
[SAMPLE] codex-repair: applied patch SAMPLE-CDX-144R (attempt 1/3)
[SAMPLE] arena: battle marked Pending Inspection`,identifiers:{battleId:`SAMPLE-BTL-005`,geminiProposalId:`SAMPLE-GEM-924M`,arenaValidationId:`SAMPLE-ARN-430P`,kaneBreakRunId:`SAMPLE-KNE-762F`,codexRepairId:`SAMPLE-CDX-144R`,kaneVerifyRunId:`Pending`,sqliteRowKey:`battles.id = 5 (SAMPLE)`}}}]},t={historical_demo:e,empty:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`empty`,dataSourceLabel:`SAMPLE empty state preview`,notice:`Empty State Preview (SAMPLE): Demonstrates how the console renders when SQLite contains zero recorded battles.`,activeBattleId:null,battles:[]},loading:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`loading`,dataSourceLabel:`SAMPLE loading state preview`,notice:`Loading State Preview (SAMPLE): Demonstrates skeleton placeholders while Flask queries SQLite battle records.`,activeBattleId:null,battles:[]},missing_evidence:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`ready`,dataSourceLabel:`SAMPLE missing-evidence preview`,notice:`Missing-Evidence State Preview (SAMPLE): Battle metadata exists in SQLite, but one or more Kane CLI capture files are absent.`,activeBattleId:`SAMPLE-BTL-003`,battles:[e.battles[2]]},infra_error:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`error`,dataSourceLabel:`SAMPLE infrastructure-error preview`,notice:`Infrastructure-Error State Preview (SAMPLE): Demonstrates backend or Kane CLI runner failure diagnostics.`,activeBattleId:null,battles:[],error:{code:`SAMPLE_SQLITE_READ_ERROR`,subsystem:`Flask / SQLite Store & Kane Artifact Index`,message:`Unable to read battle records from the configured SQLite database or locate the Kane artifact directory.`,detail:`SAMPLE diagnostic: sqlite3.OperationalError: no such table: arena_battles (or KANE_ARTIFACT_DIR unreachable).`,suggestion:`Verify the Flask database path, confirm migrations have run, and reload this console page.`}}},n=`Showing a fictional UI demo (SAMPLE), not recorded Kane evidence. Your own battles will appear here.`;function r(e){if(e?.mode!==`live_archive`||e.isSample===!0||e.status!==`empty`||Array.isArray(e.battles)&&e.battles.length>0)return e;let t=a(`historical_demo`);return t.notice=e.notice||`Showing a fictional UI demo (SAMPLE), not recorded Kane evidence. Your own battles will appear here.`,t.dataSourceLabel=`Fictional UI demo (SAMPLE)`,t.autoSample=!0,t.judgeWorkflows=Array.isArray(e.judgeWorkflows)?e.judgeWorkflows:[],t}function i(){let e=document.getElementById(`arena-payload`);if(e&&e.textContent&&e.textContent.trim().length>0)try{let t=JSON.parse(e.textContent);if(t&&typeof t==`object`)return r(t)}catch(e){return{schemaVersion:`1.0`,mode:`live_archive`,isSample:!1,status:`error`,dataSourceLabel:`Injected Jinja JSON payload`,notice:`Failed to parse server-injected JSON payload.`,activeBattleId:null,battles:[],error:{code:`PAYLOAD_PARSE_ERROR`,subsystem:`Jinja Template Serialization`,message:`The JSON embedded in #arena-payload could not be parsed.`,detail:e instanceof Error?e.message:String(e),suggestion:`Confirm Flask uses {{ arena_payload | tojson }} inside #arena-payload.`}}}return typeof window<`u`&&window.__ARENA_PAYLOAD__?r(window.__ARENA_PAYLOAD__):r({mode:`live_archive`,isSample:!1,status:`empty`,dataSourceLabel:`Local SQLite archive`,notice:n,battles:[],activeBattleId:null})}function a(n){let r=t[n]||e,i=structuredClone(r);for(let e of i.battles||[]){e.isSample=!0;for(let t of Object.values(e.screenshots||{}))t.isSample=!0}return i}function o(e){let t=String(e||``).trim().toLowerCase().replace(/\s+/g,`_`);return[`repaired`,`success`,`caught_and_repaired`,`repair_verified`].includes(t)?`success`:[`failed`,`repair_failed`,`caught;_human_review_needed`,`human_review`].includes(t)?`repair_failed`:t===`pending`||t===`pending_inspection`?`pending_inspection`:t===`missing_evidence`?`missing_evidence`:t}function s(e){let t=Array.isArray(e)?e.filter(e=>e.isSample!==!0):[],n={all:t.length,success:0,repair_failed:0,pending_inspection:0,missing_evidence:0};for(let e of t){let t=o(e.outcome);t in n&&(n[t]+=1),t!==`missing_evidence`&&(e.screenshots?.failure?.status!==`available`||e.screenshots?.repair?.status!==`available`)&&(n.missing_evidence+=1)}return n}function c(e,{outcomeFilter:t=`all`,searchQuery:n=``}={}){if(!Array.isArray(e))return[];let r=n.trim().toLowerCase();return e.filter(e=>{if(t===`missing_evidence`){if(e.screenshots?.failure?.status===`available`&&e.screenshots?.repair?.status===`available`)return!1}else if(t!==`all`&&o(e.outcome)!==t)return!1;return!r||[e.id,e.title,e.breaker,e.faultFamily,e.outcome,e.targetApp].filter(Boolean).join(` `).toLowerCase().includes(r)})}function l(e,t){if(!Array.isArray(e)||e.length===0)return null;if(t){let n=e.find(e=>e.id===t);if(n)return n}return e[0]}function u(e){return e==null?``:String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function d(e){return e===`success`||e===`Completed`?`<svg class="w-4 h-4 shrink-0 text-emerald-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.25 5.75L8.5 13.5L4.75 9.75"/></svg>`:e===`warning`||e===`Missing`?`<svg class="w-4 h-4 shrink-0 text-amber-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6.5v4m0 3h.01M8.6 3.6L2.4 14.3a1.5 1.5 0 001.3 2.25h12.6a1.5 1.5 0 001.3-2.25L11.4 3.6a1.6 1.6 0 00-2.8 0z"/></svg>`:e===`danger`||e===`Failed`?`<svg class="w-4 h-4 shrink-0 text-rose-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.25 6.25l7.5 7.5m0-7.5l-7.5 7.5"/></svg>`:`<svg class="w-4 h-4 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="10" cy="10" r="6.25"/></svg>`}function f(e){return e===`success`||e===`Completed`?`text-emerald-800`:e===`warning`||e===`Missing`?`text-amber-800`:e===`danger`||e===`Failed`?`text-rose-800`:`text-slate-700`}function p(e,t){return`
    <section aria-label="Workspace context and preview state" class="bg-white border border-slate-200 rounded-lg px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="space-y-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span class="font-semibold text-slate-900">${u(e.isSample?`Historical Demo · SAMPLE Data (Read-Only)`:`Recorded Archive (Read-Only)`)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>History is read-only; local Kane monitor requires opt-in</span>
          <span aria-hidden="true">&middot;</span>
          <span>${u(e.dataSourceLabel||`Flask + SQLite dataset`)}</span>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed">
          ${u(e.notice)}
        </p>
      </div>

      <div class="shrink-0">
        <details class="relative">
          <summary class="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">Advanced</summary>
          <div class="absolute right-0 top-full z-40 mt-2 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
            <div class="space-y-2">
              <span class="text-xs font-medium text-slate-500">Preview state:</span>
              <div role="group" aria-label="Console preview states" class="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
                ${[{key:`historical_demo`,label:`Historical Demo`},{key:`empty`,label:`Empty`},{key:`loading`,label:`Loading`},{key:`missing_evidence`,label:`Missing Evidence`},{key:`infra_error`,label:`Infra Error`}].map(e=>{let n=t===e.key;return`
                      <button
                        type="button"
                        data-preview-state="${u(e.key)}"
                        aria-pressed="${n?`true`:`false`}"
                        class="px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${n?`bg-white text-slate-900 shadow-xs border border-slate-200/80`:`text-slate-600 hover:text-slate-900`}"
                      >
                        ${u(e.label)}
                      </button>
                    `}).join(``)}
              </div>
              <button
                id="export-json-btn"
                type="button"
                class="w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Export JSON
              </button>
            </div>
          </div>
        </details>
      </div>
    </section>
  `}function m(){return`
    <section aria-label="Loading battle data" class="space-y-6">
      <div class="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-2">
            <div class="h-4 w-48 rounded arena-skeleton"></div>
            <div class="h-7 w-96 max-w-full rounded arena-skeleton"></div>
          </div>
          <div class="h-5 w-36 rounded arena-skeleton"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 border-t border-slate-200">
          ${Array.from({length:5}).map(()=>`
              <div class="p-3 border border-slate-200 rounded-md space-y-2">
                <div class="h-3 w-16 rounded arena-skeleton"></div>
                <div class="h-4 w-28 rounded arena-skeleton"></div>
                <div class="h-3 w-full rounded arena-skeleton"></div>
              </div>
            `).join(``)}
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div class="h-5 w-32 rounded arena-skeleton"></div>
          <div class="h-8 w-64 rounded arena-skeleton"></div>
        </div>
        <div class="divide-y divide-slate-200">
          ${Array.from({length:4}).map(()=>`
              <div class="px-6 py-3.5 grid grid-cols-6 gap-4 items-center">
                <div class="h-4 w-24 rounded arena-skeleton"></div>
                <div class="h-4 w-28 rounded arena-skeleton"></div>
                <div class="h-4 w-32 rounded arena-skeleton"></div>
                <div class="h-4 w-20 rounded arena-skeleton"></div>
                <div class="h-4 w-12 ml-auto rounded arena-skeleton"></div>
                <div class="h-4 w-20 ml-auto rounded arena-skeleton"></div>
              </div>
            `).join(``)}
        </div>
      </div>
    </section>
  `}function h(){return`
    <section aria-label="No battles recorded" class="bg-white border border-slate-200 rounded-lg p-10 sm:p-14 text-center">
      <div class="max-w-lg mx-auto space-y-4">
        <div class="w-10 h-10 mx-auto rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
          <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A1.5 1.5 0 015.5 4h9A1.5 1.5 0 0116 5.5v9a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 14.5v-9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 11.5h3.25l1.25 1.75h3l1.25-1.75H16"/>
          </svg>
        </div>
        <h2 class="font-display text-lg font-semibold text-slate-900">
          No recorded battles in the SQLite store
        </h2>
        <p class="text-sm text-slate-600 leading-relaxed">
          This console is read-only. Recorded fault proposals from Gemini, Arena validations, Codex repair attempts, and Kane CLI captures will appear here once your backend persists a completed battle.
        </p>
        <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            data-preview-state="historical_demo"
            class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            View Historical Demo (SAMPLE)
          </button>
          <button
            type="button"
            data-action="reload-payload"
            class="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Reload recorded data
          </button>
        </div>
      </div>
    </section>
  `}function g(e){let t=e||{code:`INFRASTRUCTURE_ERROR`,subsystem:`Backend Store / Runner`,message:`Unable to load battle history or verification artifacts.`,detail:`No additional error detail provided.`,suggestion:`Inspect Flask server logs and verify SQLite connectivity.`};return`
    <section aria-label="Infrastructure error" class="bg-white border border-rose-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 bg-rose-50/60 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 text-rose-900">
          ${d(`danger`)}
          <h2 class="font-display text-base font-semibold">
            Infrastructure Error: ${u(t.subsystem)}
          </h2>
        </div>
        <span class="font-mono text-xs font-medium text-rose-800 tabular-nums">
          ${u(t.code)}
        </span>
      </div>

      <div class="p-6 space-y-5">
        <p class="text-sm text-slate-700 leading-relaxed">
          ${u(t.message)}
        </p>

        <div class="bg-slate-900 text-slate-100 rounded-md p-4 font-mono text-xs overflow-x-auto leading-relaxed">
          ${u(t.detail)}
        </div>

        <p class="text-xs text-slate-600">
          <span class="font-semibold text-slate-800">Next step:</span> ${u(t.suggestion)}
        </p>

        <div class="pt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-action="reload-payload"
            class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Reload Console Data
          </button>
          <button
            type="button"
            data-preview-state="historical_demo"
            class="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Return to Historical Demo (SAMPLE)
          </button>
        </div>
      </div>
    </section>
  `}function _(e){let t=e.verification?.checks||[];return[`BuildBreak Arena | ${e.targetApp} | ${e.outcome}`,`Battle ${e.id}`,`Breaker: ${e.breaker}. Repair attempts: ${e.repairAttempts}.`,...t.map(e=>`Kane ${e.id}: ${e.result}`),e.summary].join(`
`)}function v(e,{selectedStageIndex:t=0,prevStageIndex:n=0,isReplayingStages:r=!1,animateBattleEnter:i=!0,recordedArchive:a=!1}={}){let o=Array.isArray(e.stages)?e.stages:[],s=o.filter(e=>e.state===`Completed`).length,c=o.length>0?Math.max(0,Math.min(t??0,o.length-1)):0,l=o.length>0?Math.max(0,Math.min(n??c,o.length-1)):0,p=o.length>0?(c+1)/o.length:0,m=o.length>0?(l+1)/o.length:0,h=o[c]||null;return`
    <section id="overview" aria-labelledby="overview-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden ${i?`arena-enter`:``}">
      <div class="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
            <button
              type="button"
              data-copy-text="${u(e.id)}"
              title="Copy Battle ID"
              class="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-slate-950 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
            >
              <span>${u(e.id)}</span>
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <rect x="6.5" y="6.5" width="9" height="9" rx="1.5"/>
                <path d="M4.5 12.5v-7a1 1 0 011-1h7"/>
              </svg>
            </button>
            <span aria-hidden="true">&middot;</span>
            <span>${u(e.targetApp)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${u(e.recordedLabel)}</span>
          </div>
          <h1 id="overview-heading" class="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ${u(e.title)}
          </h1>
          <p class="text-sm text-slate-600 max-w-3xl leading-relaxed">
            ${u(e.summary)}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0 pt-1">
          <div class="inline-flex items-center gap-1.5 text-sm font-semibold ${f(e.outcomeTone)}">
            ${d(e.outcomeTone)}
            <span>Outcome: ${u(e.outcome)}</span>
          </div>
          ${a&&e.isSample===!1&&e.verification?.checks?.length?`<button type="button" data-copy-label="Battle summary copied" data-copy-text="${u(_(e))}" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">Copy battle summary</button>`:``}
          <div class="text-xs text-slate-500 font-mono tabular-nums">
            Attempts: ${u(e.repairAttempts)} / ${u(e.maxAttempts)}
            <span aria-hidden="true">&middot;</span>
            Stages: ${s}/${o.length}
          </div>
        </div>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2.5">
              <h2 class="font-display text-sm font-semibold text-slate-900">
                Workflow Timeline
              </h2>
              <span class="font-mono text-[11px] text-slate-500 tabular-nums">
                Step ${c+1} / ${o.length||1}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Click any stage or step through the recorded sequence: Gemini &rarr; Arena &rarr; Kane CLI &rarr; Codex &rarr; Kane CLI
            </p>
          </div>

          <div class="inline-flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              data-stage-nav="prev"
              ${c<=0?`disabled`:``}
              class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              &larr; Prev
            </button>
            <button
              type="button"
              data-stage-replay="toggle"
              aria-pressed="${r?`true`:`false`}"
              class="px-3 py-1 text-xs font-medium rounded border transition-all active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${r?`bg-slate-900 text-white border-slate-900`:`bg-white text-slate-800 border-slate-300 hover:bg-slate-50`}"
            >
              ${r?`Pause replay`:`Step replay`}
            </button>
            <button
              type="button"
              data-stage-nav="next"
              ${c>=o.length-1?`disabled`:``}
              class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              Next &rarr;
            </button>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label="Workflow inspection progress"
          aria-valuemin="1"
          aria-valuemax="${Math.max(1,o.length)}"
          aria-valuenow="${c+1}"
          class="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden"
        >
          <div
            id="workflow-stage-progress-fill"
            data-target-scale="${p.toFixed(4)}"
            class="h-full w-full bg-slate-900 arena-progress-fill"
            style="transform: scaleX(${m.toFixed(4)});"
          ></div>
        </div>

        <ol class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          ${o.map((e,t)=>{let n=String(t+1).padStart(2,`0`),r=t===c,i=t<c;return`
                <li>
                  <button
                    type="button"
                    data-stage-index="${t}"
                    aria-pressed="${r?`true`:`false`}"
                    class="w-full h-full text-left border rounded-md p-3.5 flex flex-col justify-between gap-2.5 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${r?`border-slate-900 bg-white shadow-xs ring-1 ring-slate-900/10`:i?`border-slate-300 bg-white hover:border-slate-400`:`border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300`}"
                  >
                    <div class="space-y-1 w-full">
                      <div class="flex items-center justify-between gap-2 text-xs">
                        <span class="font-mono tabular-nums ${r||i?`text-slate-900 font-semibold`:`text-slate-500`}">${n} &middot; ${u(e.actor)}</span>
                        <span class="inline-flex items-center gap-1 font-medium ${f(e.state)}">
                          ${d(e.state)}
                          <span>${u(e.state)}</span>
                        </span>
                      </div>
                      <div class="font-display text-sm font-semibold text-slate-900">
                        ${u(e.label)}
                      </div>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">
                      ${u(e.note)}
                    </p>
                  </button>
                </li>
              `}).join(``)}
        </ol>

        ${h?`
            <div class="border border-slate-200 rounded-md bg-slate-50/70 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div class="space-y-0.5 min-w-0">
                <div class="text-xs font-semibold text-slate-900">
                  Recorded stage ${String(c+1).padStart(2,`0`)}: ${u(h.actor)} &mdash; ${u(h.label)}
                </div>
                <p class="text-xs text-slate-600">
                  ${u(h.note)}
                </p>
              </div>
              <pre class="font-mono text-[11px] bg-slate-900 text-slate-100 px-3.5 py-2 rounded overflow-x-auto leading-relaxed shrink-0 max-w-full lg:max-w-xl">${u(h.traceSnippet||`SAMPLE recorded trace: ${h.actor} (${h.state}) — ${h.note}`)}</pre>
            </div>
          `:``}
      </div>
    </section>
  `}function y(e,t,n,{outcomeFilter:r,searchQuery:i}){return`
    <section id="history" aria-labelledby="history-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="space-y-0.5">
          <h2 id="history-heading" class="font-display text-base font-semibold text-slate-900">
            Battle History
          </h2>
          <p class="text-xs text-slate-500">
            Showing <span class="font-mono tabular-nums text-slate-700">${t.length}</span> of <span class="font-mono tabular-nums text-slate-700">${e.length}</span> recorded battles. Select a row to inspect assertions and captures.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="relative">
            <label for="battle-search" class="sr-only">Filter battles by ID, fault family, or breaker</label>
            <input
              id="battle-search"
              type="search"
              value="${u(i)}"
              placeholder="Filter ID or fault family..."
              class="w-full sm:w-56 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div role="group" aria-label="Filter battles by outcome" class="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200 overflow-x-auto">
            ${[{key:`all`,label:`All`},{key:`success`,label:`Success`},{key:`repair_failed`,label:`Repair Failed`},{key:`pending_inspection`,label:`Pending Inspection`},{key:`missing_evidence`,label:`Missing Evidence`}].map(e=>{let t=r===e.key;return`
                  <button
                    type="button"
                    data-outcome-filter="${u(e.key)}"
                    aria-pressed="${t?`true`:`false`}"
                    class="px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${t?`bg-white text-slate-900 shadow-xs`:`text-slate-600 hover:text-slate-900`}"
                  >
                    ${u(e.label)}
                  </button>
                `}).join(``)}
          </div>
        </div>
      </div>

      ${t.length===0?`
          <div class="px-6 py-10 text-center space-y-3">
            <p class="text-sm text-slate-600">No battles match the current filter or search query.</p>
            <button
              type="button"
              data-action="clear-filters"
              class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Reset table filters
            </button>
          </div>
        `:`
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th scope="col" class="py-2.5 px-6 whitespace-nowrap">Battle ID</th>
                  <th scope="col" class="py-2.5 px-4 whitespace-nowrap">Breaker</th>
                  <th scope="col" class="py-2.5 px-4 whitespace-nowrap">Fault Family</th>
                  <th scope="col" class="py-2.5 px-4 whitespace-nowrap">Outcome</th>
                  <th scope="col" class="py-2.5 px-4 text-right whitespace-nowrap">Repair Attempts</th>
                  <th scope="col" class="py-2.5 px-6 text-right whitespace-nowrap">Captures</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-sm">
                ${t.map(e=>{let t=e.id===n,r=e.screenshots?.failure?.status===`available`,i=e.screenshots?.repair?.status===`available`,a=r&&i?`2 / 2 recorded`:r||i?`1 / 2 (missing)`:`0 / 2 recorded`;return`
                      <tr
                        data-battle-row="${u(e.id)}"
                        tabindex="0"
                        role="button"
                        aria-selected="${t?`true`:`false`}"
                        class="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 ${t?`bg-slate-100/90`:`hover:bg-slate-50`}"
                      >
                        <td class="py-3 px-6 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                          ${t?`<span aria-hidden="true" class="mr-1.5 text-slate-900">&rsaquo;</span>`:``}${u(e.id)}
                        </td>
                        <td class="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                          ${u(e.breaker)}
                        </td>
                        <td class="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                          ${u(e.faultFamily)}
                        </td>
                        <td class="py-3 px-4 text-xs whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 font-medium ${f(e.outcomeTone)}">
                            ${d(e.outcomeTone)}
                            <span>${u(e.outcome)}</span>
                          </span>
                        </td>
                        <td class="py-3 px-4 text-xs font-mono text-slate-800 text-right whitespace-nowrap tabular-nums">
                          ${u(e.repairAttempts)} / ${u(e.maxAttempts)}
                        </td>
                        <td class="py-3 px-6 text-xs font-mono text-slate-600 text-right whitespace-nowrap tabular-nums">
                          ${u(a)}
                        </td>
                      </tr>
                    `}).join(``)}
              </tbody>
            </table>
          </div>
        `}
    </section>
  `}function b(e){let t=Array.isArray(e.comparisons)?e.comparisons:[],n=e.escape,r=e=>[`subtotal`,`discount`,`total`].map(t=>`${t[0].toUpperCase()}${t.slice(1)}: ${u(e?.[t]||`Not recorded`)}`).join(` · `);return`
    <section id="comparison" aria-labelledby="comparison-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="comparison-heading" class="font-display text-base font-semibold text-slate-900">
            Battle Detail: Expected vs. Actual Values
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Recorded assertions for <span class="font-mono text-slate-700">${u(e.id)}</span> across Kane CLI pre-repair and post-repair runs.
          </p>
        </div>
        <span class="text-xs text-slate-500 font-mono tabular-nums">
          ${t.length} assertion${t.length===1?``:`s`}
        </span>
      </div>

      ${n?`
        <div class="mx-6 my-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3" aria-label="Recorded escape review">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">${u(n.heading||`Generated-test fault review`)}</h3>
            <p class="mt-1 text-xs text-amber-900">${u(n.faultStatus||`Not recorded`)}</p>
          </div>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div><dt class="font-medium text-slate-700">Healthy observation</dt><dd class="mt-1 font-mono text-slate-800">${r(n.healthyObservation)}</dd></div>
            <div><dt class="font-medium text-slate-700">Changed observation</dt><dd class="mt-1 font-mono text-slate-800">${r(n.changedObservation)}</dd></div>
          </dl>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <p><span class="font-medium text-slate-700">Unchanged browser test checked:</span> ${u(n.browserTestChecked||`Not recorded`)}</p>
            <p><span class="font-medium text-slate-700">It missed:</span> ${u(n.missed||`Not recorded`)}</p>
          </div>
          <p class="text-xs text-slate-700"><span class="font-medium">Follow-up:</span> ${u(n.followUp||`Not recorded`)}</p>
        </div>
      `:``}

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
              <th scope="col" class="py-2.5 px-6">Assertion</th>
              <th scope="col" class="py-2.5 px-4">Expected Value</th>
              <th scope="col" class="py-2.5 px-4">Actual (Pre-Repair)</th>
              <th scope="col" class="py-2.5 px-4">Verified (Post-Repair)</th>
              <th scope="col" class="py-2.5 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-xs">
            ${t.map(e=>{let t=e.matched?`success`:`danger`,n=e.matched?`Matched`:`Unresolved`;return`
                  <tr>
                    <td class="py-3.5 px-6 font-medium text-slate-900">
                      ${u(e.check)}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-slate-800 bg-slate-50/40">
                      ${u(e.expected)}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-rose-800">
                      ${u(e.actualPreRepair)}
                    </td>
                    <td class="py-3.5 px-4 font-mono ${e.matched?`text-emerald-800`:`text-amber-800`}">
                      ${u(e.actualPostRepair)}
                    </td>
                    <td class="py-3.5 px-6 text-right whitespace-nowrap">
                      <span class="inline-flex items-center justify-end gap-1.5 font-medium ${f(t)}">
                        ${d(t)}
                        <span>${n}</span>
                      </span>
                    </td>
                  </tr>
                `}).join(``)}
          </tbody>
        </table>
      </div>
    </section>
  `}function x(e,t,n){return!e||e.status!==`available`||!e.url?`
      <div class="border border-amber-200 bg-amber-50/40 rounded-md flex flex-col justify-between h-full">
        <div class="px-4 py-3 border-b border-amber-200/80 flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-slate-900">${u(t)}</span>
          <span class="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
            ${d(`warning`)}
            <span>Missing evidence</span>
          </span>
        </div>

        <div class="p-6 flex-1 flex flex-col items-center justify-center text-center min-h-[240px] space-y-3">
          <div class="w-10 h-10 rounded-md bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-800">
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.5 5.5A1.5 1.5 0 015 4h10a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 16H5a1.5 1.5 0 01-1.5-1.5v-9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.5 13l2.75-3.25 2.25 2.5 1.75-2 2.25 2.75"/>
            </svg>
          </div>
          <div class="space-y-1 max-w-sm">
            <p class="text-sm font-medium text-slate-900">Recorded screenshot artifact missing</p>
            <p class="text-xs text-slate-600 leading-relaxed">
              ${u(e?.missingReason||`Artifact file was not persisted by Kane CLI.`)}
            </p>
          </div>
          <code class="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
            ${u(e?.artifactPath||`artifacts/${n}/missing.jpg`)}
          </code>
        </div>

        <div class="px-4 py-2.5 border-t border-amber-200/80 text-xs text-slate-600">
          ${u(e?.caption||`Missing capture · SAMPLE (not live)`)}
        </div>
      </div>
    `:`
    <figure class="border border-slate-200 bg-slate-50/40 rounded-md flex flex-col justify-between h-full overflow-hidden">
      <figcaption class="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-900 truncate">${u(t)}</div>
          <div class="text-[11px] text-slate-500 truncate">${u(e.caption)}</div>
        </div>
        <button
          type="button"
          data-zoom-src="${u(e.url)}"
          data-zoom-title="${u(t)}"
          data-zoom-subtitle="${u(e.caption)} · ${u(e.artifactPath)}"
          data-zoom-alt="${u(e.alt)}"
          class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          Inspect
        </button>
      </figcaption>

      <div class="p-3 flex-1 flex items-center justify-center bg-slate-100/70">
        <img
          src="${u(e.url)}"
          alt="${u(e.alt)}"
          referrerpolicy="no-referrer"
          loading="lazy"
          data-fallback-path="${u(e.artifactPath)}"
          class="w-full aspect-[4/3] object-cover rounded border border-slate-200 bg-white"
        />
      </div>

      <div class="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
        <span class="truncate">${u(e.artifactPath)}</span>
        <span class="whitespace-nowrap shrink-0">Recorded · Not live</span>
      </div>
    </figure>
  `}function ee(e,t,n){let r=Math.max(0,Math.min(100,Number(n??50)));return`
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>Drag the divider or use the slider below to compare recorded failure vs. repair captures.</span>
        <span class="font-mono tabular-nums text-slate-800">Split position: ${Math.round(r)}%</span>
      </div>

      <div
        id="arena-wipe-stage"
        class="arena-wipe-stage relative w-full max-w-4xl mx-auto aspect-[4/3] rounded-md border border-slate-200 overflow-hidden bg-slate-100 cursor-ew-resize"
      >
        <!-- Bottom layer: Repaired screenshot -->
        <img
          src="${u(t.url)}"
          alt="${u(t.alt)}"
          referrerpolicy="no-referrer"
          draggable="false"
          class="absolute inset-0 w-full h-full object-cover select-none"
        />

        <!-- Top clipped layer: Failure screenshot -->
        <div
          id="arena-wipe-overlay"
          class="absolute inset-0 overflow-hidden"
          style="clip-path: inset(0 ${100-r}% 0 0);"
        >
          <img
            src="${u(e.url)}"
            alt="${u(e.alt)}"
            referrerpolicy="no-referrer"
            draggable="false"
            class="absolute inset-0 w-full h-full object-cover select-none"
          />
        </div>

        <!-- Vertical divider handle -->
        <div
          id="arena-wipe-handle"
          class="absolute top-0 bottom-0 w-0.5 bg-slate-900 pointer-events-none"
          style="left: ${r}%;"
        >
          <div class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-white shadow-md flex items-center justify-center">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 6l-3 4 3 4m6-8l3 4-3 4"/>
            </svg>
          </div>
        </div>

        <!-- Corner labels (unboxed text scrim) -->
        <div class="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-slate-900/85 text-white text-[11px] font-medium pointer-events-none">
          Failure capture &middot; ${e.isSample?`SAMPLE (not live)`:`Recorded (not live)`}
        </div>
        <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-slate-900/85 text-white text-[11px] font-medium pointer-events-none">
          Repair capture &middot; ${t.isSample?`SAMPLE (not live)`:`Recorded (not live)`}
        </div>
      </div>

      <div class="max-w-4xl mx-auto flex items-center gap-3">
        <span class="text-[11px] font-mono text-slate-500 whitespace-nowrap">Failure</span>
        <label for="arena-wipe-range" class="sr-only">Adjust recorded failure vs. repair wipe position</label>
        <input
          id="arena-wipe-range"
          type="range"
          min="0"
          max="100"
          value="${Math.round(r)}"
          class="w-full accent-slate-900 cursor-pointer"
        />
        <span class="text-[11px] font-mono text-slate-500 whitespace-nowrap">Repaired</span>
      </div>
    </div>
  `}function S(e,{screenshotCompareMode:t=`side_by_side`,wipePercent:n=50}={}){let r=e.screenshots?.failure,i=e.screenshots?.repair,a=r?.status===`available`&&!!r?.url&&i?.status===`available`&&!!i?.url,o=a?t:`side_by_side`;return`
    <section aria-labelledby="screenshots-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 id="screenshots-heading" class="font-display text-base font-semibold text-slate-900">
            Side-by-Side Recorded Kane Screenshots
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Static recorded artifacts from Kane CLI runs for <span class="font-mono text-slate-700">${u(e.id)}</span>. Captures are historical records, not live streams.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          ${a?`
              <div role="group" aria-label="Screenshot comparison mode" class="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
                <button
                  type="button"
                  data-compare-mode="side_by_side"
                  aria-pressed="${o===`side_by_side`?`true`:`false`}"
                  class="px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${o===`side_by_side`?`bg-white text-slate-900 shadow-xs`:`text-slate-600 hover:text-slate-900`}"
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  data-compare-mode="wipe"
                  aria-pressed="${o===`wipe`?`true`:`false`}"
                  class="px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${o===`wipe`?`bg-white text-slate-900 shadow-xs`:`text-slate-600 hover:text-slate-900`}"
                >
                  Overlay Wipe
                </button>
              </div>
            `:`<span class="text-xs font-medium text-slate-600 whitespace-nowrap">Recorded captures &middot; ${e.isSample?`SAMPLE`:`Archive`}</span>`}
        </div>
      </div>

      <div class="p-6">
        ${o===`wipe`?ee(r,i,n):`
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              ${x(r,`1. Kane Failure Capture (Pre-Repair)`,e.id)}
              ${x(i,`2. Kane Verification Capture (Post-Repair)`,e.id)}
            </div>
          `}
      </div>
    </section>
  `}function te(e){let t=e.verification||{},n=Array.isArray(t.checks)?t.checks:[],r=t.identifiers||{},i=[[`Battle ID`,r.battleId],[`Gemini Proposal ID`,r.geminiProposalId],[`Arena Validation ID`,r.arenaValidationId],[`Kane Failure Run ID`,r.kaneBreakRunId],[`Codex Repair Patch ID`,r.codexRepairId],[`Kane Verify Run ID`,r.kaneVerifyRunId],[`SQLite Row Key`,r.sqliteRowKey]];return`
    <section id="verification" aria-labelledby="verification-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
      <div class="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="verification-heading" class="font-display text-base font-semibold text-slate-900">
            Verification Details &amp; Execution Identifiers
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            ${u(t.checksSummary||`Expand sections below to inspect Kane CLI assertions, logs, and execution identifiers.`)}
          </p>
        </div>
        <div class="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
          Exit codes: before ${u(t.kaneExitCodeBefore)} &rarr; after ${u(t.kaneExitCodeAfter)}
        </div>
      </div>

      <details class="group" open>
        <summary class="px-6 py-3.5 cursor-pointer select-none flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4 text-slate-500 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 5l5 5-5 5"/>
            </svg>
            <span class="text-sm font-semibold text-slate-900">Kane CLI Assertions &amp; Recorded Output</span>
          </div>
          <span class="text-xs font-mono text-slate-500 tabular-nums">${n.length} checks</span>
        </summary>

        <div class="px-6 pb-5 pt-2 space-y-4">
          <div class="border border-slate-200 rounded-md overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th scope="col" class="py-2 px-4 font-semibold">Check ID</th>
                  <th scope="col" class="py-2 px-4 font-semibold">Kane Command</th>
                  <th scope="col" class="py-2 px-4 font-semibold">Outcome</th>
                  <th scope="col" class="py-2 px-4 font-semibold">Recorded Detail</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${n.map(e=>`
                    <tr>
                      <td class="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">${u(e.id)}</td>
                      <td class="py-2.5 px-4 font-mono text-slate-700">
                        <div class="flex items-center justify-between gap-2">
                          <span>${u(e.command)}</span>
                          <button
                            type="button"
                            data-copy-text="${u(e.command)}"
                            class="px-2 py-0.5 text-[11px] font-sans font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td class="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">${u(e.result)}</td>
                      <td class="py-2.5 px-4 text-slate-600">${u(e.detail)}</td>
                    </tr>
                  `).join(``)}
              </tbody>
            </table>
          </div>

          <div class="space-y-1.5">
            <div class="text-xs font-medium text-slate-700">${e.isSample?`Illustrative stdout excerpt (SAMPLE)`:`Sanitized recorded event summary`}</div>
            <pre class="font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto leading-relaxed">${u(t.stdoutExcerpt||`No stdout recorded.`)}</pre>
          </div>
        </div>
      </details>

      <details class="group">
        <summary class="px-6 py-3.5 cursor-pointer select-none flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4 text-slate-500 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 5l5 5-5 5"/>
            </svg>
            <span class="text-sm font-semibold text-slate-900">Execution Identifiers &amp; SQLite Trace Keys</span>
          </div>
          <span class="text-xs font-mono text-slate-500 tabular-nums">${i.length} identifiers</span>
        </summary>

        <div class="px-6 pb-5 pt-2">
          <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 border border-slate-200 rounded-md p-4 bg-slate-50/50">
            ${i.map(([e,t])=>`
                <div class="space-y-0.5 min-w-0">
                  <dt class="text-xs text-slate-500">${u(e)}</dt>
                  <dd class="flex items-center justify-between gap-2 font-mono text-xs font-medium text-slate-900 tabular-nums">
                    <span class="truncate">${u(t||`—`)}</span>
                    ${t?`<button type="button" data-copy-text="${u(t)}" class="px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded transition-colors shrink-0">Copy</button>`:``}
                  </dd>
                </div>
              `).join(``)}
          </dl>
        </div>
      </details>
    </section>
  `}function ne({payload:e,outcomeFilter:t,counts:n,filteredCount:r}){let i=e.status===`ready`&&Array.isArray(e.battles)&&e.battles.length>0,a=[{key:`all`,label:`All`,count:n.all},{key:`success`,label:`Success`,count:n.success},{key:`repair_failed`,label:`Repair Failed`,count:n.repair_failed},{key:`pending_inspection`,label:`Pending Inspection`,count:n.pending_inspection}],o=a.find(e=>e.key===t),s=i?e.isSample?`SAMPLE replay · not included in real battle counts`:o?`Showing ${r} of ${n.all} battles (${o.label})`:`Showing ${r} of ${n.all} battles`:`Battle history filters unavailable in current state`;return`
    <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-xs font-medium text-slate-600 whitespace-nowrap">Battle history view:</span>
        <div role="group" aria-label="Toggle battle history view" class="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
          ${a.map(e=>{let n=t===e.key;return`
                <button
                  type="button"
                  data-outcome-filter="${u(e.key)}"
                  aria-pressed="${n?`true`:`false`}"
                  ${i?``:`disabled`}
                  class="px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${i?n?`bg-white text-slate-900 shadow-xs border border-slate-200/80`:`text-slate-600 hover:text-slate-900`:`text-slate-400 cursor-not-allowed`}"
                >
                  <span>${u(e.label)}</span>
                  <span class="ml-1.5 font-mono text-[11px] tabular-nums ${n?`text-slate-700`:`text-slate-500`}">${e.count}</span>
                </button>
              `}).join(``)}
        </div>
      </div>

      <div class="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
        ${u(s)}
      </div>
    </div>
  `}function re(e){let t=(Array.isArray(e)?e.slice(0,10):[]).map(e=>{let t=Array.isArray(e.events)?e.events:[],n=Array.isArray(e.executions)?e.executions:[];return`<article class="rounded border border-slate-200 p-3 space-y-2" data-judge-workflow="${u(e.id||``)}">
      <div class="flex flex-wrap justify-between gap-2 text-xs">
        <strong>${u(e.result||e.state||`unknown`)}</strong>
        <span>${u(e.adapter||`unknown adapter`)}</span>
      </div>
      <p class="break-all font-mono text-[10px] text-slate-500">Test SHA-256: ${u(e.test_sha256||`not recorded`)}</p>
      <ol class="list-decimal pl-5 text-xs text-slate-600 space-y-1">
        ${t.map(e=>`<li><strong>${u(e.state||`stage`)}</strong>: ${u(e.message||``)}</li>`).join(``)}
      </ol>
      <ul class="space-y-1 text-xs text-slate-600">
        ${n.map(e=>`<li>Kane ${u(e.stage||`execution`)} ${u(e.attempt||``)}: ${u(e.result||`unknown`)}
          · Execution ID: ${u(e.execution_id||`not recorded`)}
          · Evidence SHA-256: ${u(e.evidence_ref||`not recorded`)}</li>`).join(``)}
      </ul>
    </article>`});return`<section id="judge-history" class="rounded-lg border border-slate-200 bg-white p-4 space-y-2" aria-label="Persistent judge workflow history">
    <h3 class="text-sm font-semibold text-slate-900">Judge workflow history</h3>
    ${t.length?t.join(``):`<p class="text-xs text-slate-600">No judge workflow results recorded.</p>`}
  </section>`}function C(e=[]){return`<section id="project-setup-panel" class="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
    <h2 class="font-display text-lg font-semibold text-slate-900">Start a full battle</h2>
    <p class="text-sm text-slate-600">Choose a demo to see what Kane will check, or import a supported source ZIP.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs" aria-label="Demo test review">
      <article class="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
        <h3 class="font-semibold text-slate-900">BreakShop · protected curated test</h3>
        <p><span class="font-medium">Flow:</span> Reset the cart, add two shirts and one sticker, apply SAVE10, place the order, then reload its confirmation.</p>
        <p><span class="font-medium">Expected:</span> $44.97 subtotal, $4.50 discount and $40.47 total, including after reload.</p>
        <p><span class="font-medium">Limit:</span> One checkout scenario; other quantities, coupons and checkout paths are not covered.</p>
      </article>
      <article class="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
        <h3 class="font-semibold text-slate-900">SeatPilot · protected curated test</h3>
        <p><span class="font-medium">Flow:</span> Book two Nocturne Symphony tickets with EARLY15, confirm the booking, then reload it.</p>
        <p><span class="font-medium">Expected:</span> $136.00 subtotal, $20.40 discount, $115.60 total and inventory reduced from 42 to 40.</p>
        <p><span class="font-medium">Limit:</span> This event and coupon scenario only; it does not cover every event, coupon or concurrent booking.</p>
      </article>
    </div>
    <p class="text-xs text-slate-500">The protected curated tests are separate from generated proposals. Review and explicitly approve the selected test below.</p>
    <div class="flex flex-wrap items-center gap-3">
      <button id="project-seatpilot" type="button" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">Try SeatPilot ticket booking</button>
      <button id="project-generated" type="button" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">SeatPilot generated suite</button>
      <button id="project-builtin" type="button" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">Use built-in BreakShop</button>
      <button id="project-local-sample" type="button" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">Try LOCAL contract example</button>
      <input id="project-zip" type="file" accept=".zip,application/zip" aria-label="Project source ZIP" class="text-sm text-slate-700">
      <button id="project-import" type="button" class="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Import ZIP</button>
    </div>
    <p class="text-xs text-slate-500">ZIP import requires the local Flask API. If this static preview cannot import, open <a class="underline underline-offset-2" href="http://127.0.0.1:5000/arena">http://127.0.0.1:5000/arena</a>.</p>
    <p id="project-status" role="status" class="text-sm text-slate-600">Checking local setup...</p>
    <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2" aria-label="Setup">
      <h3 class="text-sm font-semibold text-slate-900">Setup</h3>
      <p class="text-sm text-slate-700">Ready to replay. Connect Kane CLI, Codex and a Gemini key to run live.</p>
      <details class="pt-1">
        <summary class="cursor-pointer text-xs font-medium text-slate-600 underline underline-offset-2">Show setup details</summary>
        <dl class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="flex justify-between gap-3"><dt>Local execution</dt><dd id="setup-local-execution">Checking</dd></div>
          <div class="flex justify-between gap-3"><dt>Chrome</dt><dd id="setup-chrome">Checking</dd></div>
          <div class="flex justify-between gap-3"><dt>Kane CLI</dt><dd id="setup-kane">Checking</dd></div>
          <div class="flex justify-between gap-3"><dt>Codex</dt><dd id="setup-codex">Checking</dd></div>
          <div class="flex justify-between gap-3"><dt>Gemini key</dt><dd id="setup-gemini">Checking</dd></div>
          <div class="flex justify-between gap-3"><dt>SeatPilot Node/npm</dt><dd id="setup-node">Checking</dd></div>
        </dl>
      </details>
    </div>
    <details class="rounded border border-slate-200 p-3">
      <summary class="cursor-pointer text-sm font-medium">Review the acceptance test before approval</summary>
      <p id="project-test-origin" class="mt-3 text-xs text-slate-500"></p>
      <pre id="project-test" class="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-700"></pre>
      <p id="project-test-hash" class="mt-2 break-all font-mono text-[10px] text-slate-500"></p>
    </details>
    <div class="flex flex-wrap items-center gap-4 text-sm">
      <label>Breaker <select id="project-breaker" class="rounded border border-slate-300 p-1"><option value="gemini">Gemini (free-tier setup required)</option><option value="scripted">Scripted (controlled demo fault)</option></select></label>
      <label class="inline-flex items-center gap-2"><input id="project-approve" type="checkbox">I reviewed and approve this test for an isolated demo with fictional data.</label>
      <button id="project-start" type="button" disabled class="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Start full battle</button>
    </div>
    <p id="project-next" aria-live="polite" class="text-sm text-slate-600"></p>
    <p class="text-xs text-slate-500">Baseline → Gemini/controlled fault → Arena validation → Kane → Codex (up to 3 attempts) → Kane. Imported code never runs before approval. Source exports, keys and evidence stay local. CLI authentication and credit availability are checked during execution.</p>
    <div class="rounded-lg border border-slate-300 p-4 space-y-3" aria-labelledby="judge-workflow-heading">
      <div>
        <h3 id="judge-workflow-heading" class="text-sm font-semibold text-slate-900">Test-targeted judge workflow</h3>
        <p class="mt-1 text-xs text-slate-600">Choose a LOCAL static-data site. Kane designs its browser test from the site contract; Arena locks the definition and requires two verified healthy runs. Gemini then proposes one data-field fault for your review. Approve that fault to continue to Kane detection, Codex repair and Kane reverification. This path needs local CLI setup and uses credits.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button id="judge-start" type="button" disabled class="rounded bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Start judge workflow</button>
        <span id="judge-project-label" class="text-xs text-slate-600">Selected app: BreakShop</span>
      </div>
      <p id="judge-status" role="status" aria-live="polite" class="text-sm text-slate-700">Select a supported app and check local setup to begin.</p>
      <div aria-label="Live judge workflow progress" class="space-y-1">
        <div class="flex justify-between text-xs text-slate-600"><span>Judge workflow progress</span><span id="judge-progress-label">Waiting to start</span></div>
        <div id="judge-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" class="h-2 overflow-hidden rounded bg-slate-200">
          <div id="judge-progress-fill" class="h-full bg-indigo-600 transition-all duration-500" style="width:0%"></div>
        </div>
      </div>
      <ol id="judge-events" class="list-decimal pl-5 text-xs text-slate-600 space-y-1"></ol>
      <div id="judge-proposal" hidden class="rounded border border-amber-300 bg-amber-50 p-3 space-y-2">
        <h4 class="text-sm font-semibold text-amber-950">Operator decision required · no fault applied yet</h4>
        <p id="judge-fault-description" class="text-sm text-slate-800"></p>
        <pre id="judge-fault-diff" class="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-white p-3 font-mono text-xs text-slate-800"></pre>
        <div class="flex flex-wrap gap-2">
          <button id="judge-approve-fault" type="button" class="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Approve fault</button>
          <button id="judge-reject-fault" type="button" class="rounded border border-slate-400 px-3 py-2 text-xs font-semibold text-slate-800">Reject fault</button>
        </div>
      </div>
    </div>
    ${re(e)}
  </section>`}function ie(){return`        <!-- Live Kane Execution & Chrome Demo Window Panel -->
        <div id="live-kane-panel" class="border border-slate-300 bg-slate-900 text-slate-100 rounded-lg p-5 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="relative flex h-2.5 w-2.5">
                <span id="live-status-pulse" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 hidden"></span>
                <span id="live-status-dot" class="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
              </span>
              <h2 class="font-display text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                Live Kane CLI & Chrome Runner
                <span id="live-status-badge" class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">Ready</span>
              </h2>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <label class="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                <input id="live-show-browser" type="checkbox" checked class="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400">
                <span>Pop-up Chrome Window</span>
              </label>
              <button
                id="btn-run-kane-live"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-colors shadow-xs"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
                <span>Run Kane Live Test</span>
              </button>
            </div>
          </div>

          <!-- Configuration Inputs for Judges / Alternative Demos -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Standalone check URL (BreakShop)</label>
              <input id="live-target-url" type="text" value="http://127.0.0.1:5000" class="w-full font-mono text-xs bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Acceptance suite for the current run</label>
              <input id="live-test-path" type="text" readonly value=".testmuai/tests/CheckoutConsistency_test.md" class="w-full font-mono text-xs bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500">
            </div>
          </div>

          <!-- Live Visual Stream & Step Terminal -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <!-- Left: Browser Viewport Stream -->
            <div class="lg:col-span-7 bg-slate-950 rounded border border-slate-800 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden group">
              <span id="live-view-label" class="absolute top-2 left-2 z-10 rounded bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-slate-300">Waiting for a live run</span>
              <img id="live-stream-img" src="" alt="Verified Kane evidence screenshot" class="w-full h-auto max-h-[260px] object-contain hidden">
              <div id="live-stream-placeholder" class="flex flex-col items-center text-center p-6 space-y-2 text-slate-500">
                <svg class="w-8 h-8 opacity-40 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <p class="text-xs">The same isolated Chrome that Kane controls appears here live</p>
                <span class="text-[11px] text-slate-600">Read-only viewport feed. Do not interact with the pop-up Chrome.</span>
              </div>
              <div id="live-step-pill" class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono text-slate-300 border border-slate-700 hidden">
                Waiting for Kane steps
              </div>
            </div>

            <!-- Right: Real-time Step Log Terminal -->
            <div class="lg:col-span-5 bg-slate-950 rounded border border-slate-800 flex flex-col p-3 text-xs min-h-[220px] max-h-[260px]">
              <div class="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <span>EXECUTION LOG</span>
                <span id="live-timer" class="text-slate-500 tabular-nums">00:00</span>
              </div>
              <div id="live-console-feed" class="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300 leading-snug pr-1">
                <div class="text-slate-500 italic">Ready. Run Kane Live Test starts a standalone check. Start full battle above runs the full loop after approval.</div>
              </div>
            </div>
          </div>
        </div>

`}function ae(e){let{payload:t,activePreviewKey:n,filteredBattles:r,selectedBattle:i,outcomeFilter:a,searchQuery:o,selectedStageIndex:s,prevStageIndex:c,animateBattleEnter:l,isReplayingStages:u,screenshotCompareMode:d,wipePercent:f}=e,_=[p(t,n),...n===`archive`||t.autoSample?[C(t.judgeWorkflows)]:[],...n===`archive`||t.autoSample?[ie()]:[]];if(t.status===`loading`)return _.push(m()),_.join(`
`);if(t.status===`error`)return _.push(g(t.error)),_.join(`
`);if(t.status===`empty`||!Array.isArray(t.battles)||t.battles.length===0)return _.push(h()),_.join(`
`);if(!i)return _.push(y(t.battles,r,null,{outcomeFilter:a,searchQuery:o})),_.join(`
`);let x=i;return _.push(v(x,{recordedArchive:n===`archive`&&t.mode===`live_archive`&&t.isSample===!1,selectedStageIndex:s,prevStageIndex:c,isReplayingStages:u,animateBattleEnter:l})),_.push(y(t.battles,r,x.id,{outcomeFilter:a,searchQuery:o})),_.push(b(x)),_.push(S(x,{screenshotCompareMode:d,wipePercent:f})),_.push(te(x)),_.join(`
`)}function oe(){let e=!1,t=null;function n(){if(typeof window>`u`)return null;if(!t){let e=window.AudioContext||window.webkitAudioContext;if(!e)return null;t=new e({latencyHint:`interactive`})}return t.state===`suspended`&&t.resume().catch(()=>{}),t}function r({freqStart:e,freqEnd:t,durationSec:r,gainPeak:i,type:a=`sine`,delaySec:o=0}){let s=n();if(!s)return;let c=s.currentTime+o,l=s.createOscillator(),u=s.createGain();l.type=a,l.frequency.setValueAtTime(e,c),t&&t!==e&&l.frequency.exponentialRampToValueAtTime(t,c+r),u.gain.setValueAtTime(1e-4,c),u.gain.exponentialRampToValueAtTime(i,c+.006),u.gain.exponentialRampToValueAtTime(1e-4,c+r),l.connect(u),u.connect(s.destination),l.start(c),l.stop(c+r+.01)}function i(t=`nav`){e&&(t===`nav`?r({freqStart:520,freqEnd:610,durationSec:.032,gainPeak:.025,type:`sine`}):t===`filter`?r({freqStart:440,freqEnd:540,durationSec:.038,gainPeak:.028,type:`triangle`}):t===`copy`?(r({freqStart:620,freqEnd:620,durationSec:.028,gainPeak:.022,type:`sine`}),r({freqStart:830,freqEnd:830,durationSec:.04,gainPeak:.024,type:`sine`,delaySec:.03})):t===`error`?r({freqStart:240,freqEnd:185,durationSec:.06,gainPeak:.03,type:`triangle`}):t===`toggleOn`&&r({freqStart:480,freqEnd:640,durationSec:.045,gainPeak:.028,type:`sine`}))}function a(){return e}function o(){return e=!e,e&&(n(),i(`toggleOn`)),e}return{isEnabled:a,toggle:o,play:i}}function w(){let e=document.getElementById(`battle-filter-bar`),t=document.getElementById(`arena-main`),n=document.getElementById(`footer-data-source`),o=document.getElementById(`arena-toast`),d=document.getElementById(`footer-sound-toggle`),f=document.getElementById(`footer-sound-icon-off`),p=document.getElementById(`footer-sound-icon-on`),m=document.getElementById(`footer-sound-label`),h=document.getElementById(`footer-schema-toggle`),g=document.getElementById(`schema-modal`),_=document.getElementById(`schema-modal-close`),v=document.getElementById(`footer-shortcuts-toggle`),y=document.getElementById(`shortcuts-modal`),b=document.getElementById(`shortcuts-modal-close`),x=document.getElementById(`screenshot-modal`),ee=document.getElementById(`screenshot-modal-close`),S=document.getElementById(`screenshot-modal-img`),te=document.getElementById(`screenshot-modal-title`),re=document.getElementById(`screenshot-modal-subtitle`);if(!t)return;let C=oe();function ie(){if(!d)return;let e=C.isEnabled();d.setAttribute(`aria-pressed`,e?`true`:`false`),m&&(m.textContent=e?`Sound: On`:`Sound: Muted`),f&&f.classList.toggle(`hidden`,e),p&&p.classList.toggle(`hidden`,!e),d.classList.toggle(`text-slate-900`,e),d.classList.toggle(`font-medium`,e),d.classList.toggle(`text-slate-600`,!e)}let w={payload:i(),activePreviewKey:null,selectedBattleId:null,outcomeFilter:`all`,searchQuery:``,selectedStageIndex:0,isReplayingStages:!1,screenshotCompareMode:`side_by_side`,wipePercent:50};w.activePreviewKey=w.payload.isSample?`historical_demo`:`archive`,w.selectedBattleId=w.payload.activeBattleId||null;let T=null,E=null,D=!1,se=null,ce=0;function O(e){o&&(o.textContent=e,o.classList.remove(`hidden`),E&&clearTimeout(E),E=setTimeout(()=>{o.classList.add(`hidden`)},1800))}function k(){T&&=(clearInterval(T),null),w.isReplayingStages=!1}function le(){return l(c(w.payload.battles,{outcomeFilter:w.outcomeFilter,searchQuery:w.searchQuery}),w.selectedBattleId)}function ue(){if(w.isReplayingStages){k(),j();return}let e=le()?.stages?.length||0;e<=1||(w.isReplayingStages=!0,w.selectedStageIndex>=e-1&&(w.selectedStageIndex=0),j(),T=setInterval(()=>{let e=le(),t=e?.stages?.length||0;!e||w.selectedStageIndex>=t-1?(k(),j()):(w.selectedStageIndex+=1,C.play(`nav`),j())},1400))}function de(e){let t=Math.max(0,Math.min(100,e));w.wipePercent=t;let n=document.getElementById(`arena-wipe-overlay`),r=document.getElementById(`arena-wipe-handle`),i=document.getElementById(`arena-wipe-range`),a=document.getElementById(`arena-wipe-stage`);if(n&&(n.style.clipPath=`inset(0 ${100-t}% 0 0)`),r&&(r.style.left=`${t}%`),i instanceof HTMLInputElement&&(i.value=String(Math.round(t))),a&&a.previousElementSibling){let e=a.previousElementSibling.querySelector(`.font-mono`);e&&(e.textContent=`Split position: ${Math.round(t)}%`)}}function A(e){k(),e!==w.outcomeFilter&&C.play(`filter`),w.outcomeFilter=e;let t=c(w.payload.battles,{outcomeFilter:w.outcomeFilter,searchQuery:w.searchQuery});t.length>0&&!t.some(e=>e.id===w.selectedBattleId)&&(w.selectedBattleId=t[0].id,w.selectedStageIndex=0),j()}function fe(e){e&&e!==w.selectedBattleId&&(k(),C.play(`nav`),w.selectedBattleId=e,w.selectedStageIndex=0,j())}function j(){let r=c(w.payload.battles,{outcomeFilter:w.outcomeFilter,searchQuery:w.searchQuery}),i=s(w.payload.battles);r.length>0&&w.selectedBattleId&&!r.some(e=>e.id===w.selectedBattleId)&&(w.selectedBattleId=r[0].id,w.selectedStageIndex=0);let a=l(r,w.selectedBattleId);e&&(e.innerHTML=ne({payload:w.payload,outcomeFilter:w.outcomeFilter,counts:i,filteredCount:r.length}));let o=document.activeElement,d=o&&o.id===`battle-search`,f=d?o.selectionStart:null,p=d?o.selectionEnd:null,m=a?a.id:null,h=m!==null&&m===se,g=h?ce:0,_=document.getElementById(`live-kane-panel`),v=document.getElementById(`project-setup-panel`);t.innerHTML=ae({payload:w.payload,activePreviewKey:w.activePreviewKey,filteredBattles:r,selectedBattle:a,outcomeFilter:w.outcomeFilter,searchQuery:w.searchQuery,selectedStageIndex:w.selectedStageIndex,prevStageIndex:g,animateBattleEnter:!h,isReplayingStages:w.isReplayingStages,screenshotCompareMode:w.screenshotCompareMode,wipePercent:w.wipePercent});let y=document.getElementById(`live-kane-panel`);_&&y&&y.replaceWith(_);let b=document.getElementById(`project-setup-panel`);v&&b&&b.replaceWith(v),se=m,ce=w.selectedStageIndex;let x=document.getElementById(`workflow-stage-progress-fill`);if(x){let e=x.getAttribute(`data-target-scale`);e&&(x.offsetWidth,requestAnimationFrame(()=>{x.style.transform=`scaleX(${e})`}))}if(n&&(n.textContent=`Source: ${w.payload.dataSourceLabel||`BuildBreak Arena dataset`}`),t.querySelectorAll(`img[data-fallback-path]`).forEach(e=>{e.addEventListener(`error`,()=>{let t=e.getAttribute(`data-fallback-path`)||`artifact.jpg`,n=document.createElement(`div`);n.className=`w-full aspect-[4/3] rounded border border-amber-200 bg-amber-50/60 flex flex-col items-center justify-center p-4 text-center gap-2`,n.innerHTML=`
          <span class="text-xs font-semibold text-amber-900">Capture preview unavailable</span>
          <code class="text-[11px] font-mono text-slate-600">${u(t)}</code>
        `,e.replaceWith(n)})}),d){let e=document.getElementById(`battle-search`);e&&(e.focus(),typeof f==`number`&&typeof p==`number`&&e.setSelectionRange(f,p))}}function pe({src:e,title:t,subtitle:n,alt:r}){x&&S&&(S.src=e,S.alt=r||t||`Recorded Kane CLI screenshot`,te&&(te.textContent=t||`Recorded capture preview`),re&&(re.textContent=n||``),x.classList.remove(`hidden`))}function me(){x&&S&&(x.classList.add(`hidden`),S.src=``)}function he(){g&&g.classList.remove(`hidden`)}function ge(){g&&g.classList.add(`hidden`)}function _e(){y&&y.classList.remove(`hidden`)}function M(){y&&y.classList.add(`hidden`)}e&&e.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`[data-outcome-filter]`);n&&!n.hasAttribute(`disabled`)&&A(n.getAttribute(`data-outcome-filter`)||`all`)}),t.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`[data-copy-text]`);if(n){let e=n.getAttribute(`data-copy-text`);e&&navigator.clipboard?navigator.clipboard.writeText(e).then(()=>{C.play(`copy`),O(n.dataset.copyLabel||`Copied "${e}"`)}).catch(()=>O(`Copy unavailable in this browser context`)):e&&O(`Copy unavailable in this browser context`);return}let r=t.closest(`[data-preview-state]`);if(r){let e=r.getAttribute(`data-preview-state`);e&&(k(),C.play(e===`infra_error`||e===`missing_evidence`?`error`:`filter`),w.activePreviewKey=e,w.payload=a(e),w.selectedBattleId=w.payload.activeBattleId||null,w.selectedStageIndex=0,w.outcomeFilter=`all`,w.searchQuery=``,j());return}let o=t.closest(`[data-outcome-filter]`);if(o){A(o.getAttribute(`data-outcome-filter`)||`all`);return}let s=t.closest(`[data-stage-index]`);if(s){k();let e=Number(s.getAttribute(`data-stage-index`));Number.isNaN(e)||(C.play(`nav`),w.selectedStageIndex=e,j());return}let c=t.closest(`[data-stage-nav]`);if(c&&!c.hasAttribute(`disabled`)){k();let e=c.getAttribute(`data-stage-nav`),t=(le()?.stages?.length||1)-1;e===`prev`?w.selectedStageIndex=Math.max(0,w.selectedStageIndex-1):e===`next`&&(w.selectedStageIndex=Math.min(t,w.selectedStageIndex+1)),C.play(`nav`),j();return}if(t.closest(`[data-stage-replay]`)){C.play(`nav`),ue();return}let l=t.closest(`[data-compare-mode]`);if(l){let e=l.getAttribute(`data-compare-mode`);(e===`side_by_side`||e===`wipe`)&&(e!==w.screenshotCompareMode&&C.play(`filter`),w.screenshotCompareMode=e,j());return}let u=t.closest(`[data-action]`);if(u){let e=u.getAttribute(`data-action`);e===`clear-filters`?(C.play(`filter`),w.outcomeFilter=`all`,w.searchQuery=``,j()):e===`reload-payload`&&(k(),C.play(`filter`),w.activePreviewKey=`archive`,w.payload=i(),w.selectedBattleId=w.payload.activeBattleId||null,w.selectedStageIndex=0,j());return}let d=t.closest(`[data-zoom-src]`);if(d){C.play(`nav`),pe({src:d.getAttribute(`data-zoom-src`)||``,title:d.getAttribute(`data-zoom-title`)||``,subtitle:d.getAttribute(`data-zoom-subtitle`)||``,alt:d.getAttribute(`data-zoom-alt`)||``});return}let f=t.closest(`[data-battle-row]`);f&&fe(f.getAttribute(`data-battle-row`))}),t.addEventListener(`pointerdown`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`#arena-wipe-stage`);if(!n)return;D=!0;let r=n.getBoundingClientRect();de((e.clientX-r.left)/r.width*100)}),window.addEventListener(`pointermove`,e=>{if(!D)return;let t=document.getElementById(`arena-wipe-stage`);if(!t){D=!1;return}let n=t.getBoundingClientRect();de((e.clientX-n.left)/n.width*100)}),window.addEventListener(`pointerup`,()=>{D=!1}),t.addEventListener(`keydown`,e=>{let t=e.target;if(t instanceof Element&&(e.key===`Enter`||e.key===` `)){let n=t.closest(`[data-battle-row]`);n&&(e.preventDefault(),fe(n.getAttribute(`data-battle-row`)))}}),t.addEventListener(`input`,e=>{let t=e.target;t instanceof HTMLInputElement&&(t.id===`battle-search`?(w.searchQuery=t.value,j()):t.id===`arena-wipe-range`&&de(Number(t.value)))}),document.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element)||!t.closest(`#export-json-btn`))return;let n=new Blob([JSON.stringify(w.payload,null,2)],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`buildbreak-arena-${w.activePreviewKey}.json`,document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(r),C.play(`copy`),O(`Exported JSON snapshot`)}),d&&d.addEventListener(`click`,()=>{C.toggle(),ie()}),ie(),document.querySelectorAll(`header nav a`).forEach(e=>{e.addEventListener(`click`,()=>C.play(`nav`))}),ee&&ee.addEventListener(`click`,me),x&&x.addEventListener(`click`,e=>{e.target===x&&me()}),h&&h.addEventListener(`click`,he),_&&_.addEventListener(`click`,ge),g&&g.addEventListener(`click`,e=>{e.target===g&&ge()}),v&&v.addEventListener(`click`,_e),b&&b.addEventListener(`click`,M),y&&y.addEventListener(`click`,e=>{e.target===y&&M()}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`){me(),ge(),M();return}let t=document.activeElement;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)){if(e.key===`?`)e.preventDefault(),y&&y.classList.contains(`hidden`)?_e():M();else if(e.key===`/`){let t=document.getElementById(`battle-search`);t&&(e.preventDefault(),t.focus())}else if(w.payload.status===`ready`){if(e.key===`1`)A(`all`);else if(e.key===`2`)A(`success`);else if(e.key===`3`)A(`repair_failed`);else if(e.key===`4`)A(`pending_inspection`);else if(e.key===`[`||e.key===`]`){let t=(le()?.stages?.length||1)-1;k(),w.selectedStageIndex=e.key===`[`?Math.max(0,w.selectedStageIndex-1):Math.min(t,w.selectedStageIndex+1),C.play(`nav`),j()}else if(e.key===`j`||e.key===`k`){let t=c(w.payload.battles,{outcomeFilter:w.outcomeFilter,searchQuery:w.searchQuery});if(t.length<=1)return;let n=t.findIndex(e=>e.id===w.selectedBattleId);fe(t[e.key===`j`?(n+1)%t.length:(n-1+t.length)%t.length].id)}}}});let N=null,P=null,F=null,ve=!1,I=null;function L(e,t=`text-slate-300`){let n=document.getElementById(`live-console-feed`);if(!n)return;let r=document.createElement(`div`);for(r.className=`${t} truncate`,r.textContent=e,n.appendChild(r);n.children.length>150;)n.firstElementChild.remove();n.scrollTop=n.scrollHeight}function R(e){let t=document.getElementById(`btn-run-kane-live`);t&&(t.disabled=e,t.classList.toggle(`opacity-50`,e),t.classList.toggle(`cursor-not-allowed`,e))}function z(e,t=!1){if(typeof e!=`string`||!(t?/^\/api\/kane\/live-view\?session=\d{8}T\d{6}-[a-f0-9]{8}$/:/^\/api\/kane\/screenshot\?session=\d{8}T\d{6}-[a-f0-9]{8}$/).test(e))return;let n=document.getElementById(`live-stream-img`);if(n){n.src=e,n.alt=t?`Live viewport of the isolated Chrome controlled by Kane`:`Verified recorded Kane evidence screenshot`,n.classList.remove(`hidden`),document.getElementById(`live-stream-placeholder`)?.classList.add(`hidden`);let r=document.getElementById(`live-view-label`);r&&(r.textContent=t?`LIVE - observer view, not a verdict`:`RECORDED - verified evidence`)}}function ye(e=`Waiting for the isolated Kane browser...`){let t=document.getElementById(`live-stream-img`);t&&(t.removeAttribute(`src`),t.classList.add(`hidden`)),document.getElementById(`live-stream-placeholder`)?.classList.remove(`hidden`);let n=document.getElementById(`live-view-label`);n&&(n.textContent=e)}async function be(e){if(typeof e==`string`&&/^\d{8}T\d{6}-[a-f0-9]{8}$/.test(e)&&I!==e){I=e,q(`project-status`,`Full battle ${e} is running. Live view and history refer to this run.`);try{let t=await fetch(`/arena/data?battle=${e}`,{cache:`no-store`});if(!t.ok)return;let n=await t.json();w.payload=n,$=null,w.activePreviewKey=`archive`,w.selectedBattleId=e,w.selectedStageIndex=0,j()}catch{L(`History refresh unavailable. The run continues; reload to reconnect.`)}}}function xe(e){if([`.testmuai/tests/CheckoutConsistency_test.md`,`.testmuai/tests/SeatPilotBooking_test.md`].includes(e.test_path)){let t=document.getElementById(`live-test-path`);t&&(t.value=e.test_path)}if(e.type===`battle`)be(e.battle_id);else if(e.type===`snapshot`){e.battle_id&&be(e.battle_id),typeof e.judge_id==`string`&&/^[a-f0-9]{32}$/.test(e.judge_id)&&(W=e.judge_id,K=!0,G||=setInterval(X,1e3),X()),e.started_at&&(F=e.started_at*1e3),xe({type:`status`,status:e.status,message:e.message}),e.phase&&L(`Kane phase: ${e.phase}`,`text-cyan-300`),e.current_step&&xe({type:`step_start`,step_index:e.current_step}),e.live_view_url&&e.status===`running`?z(e.live_view_url,!0):e.latest_screenshot&&z(e.latest_screenshot);for(let t of e.steps||[])L(`Step ${t.index}: ${t.status}`)}else if(e.type===`status`){let t=e.status===`running`,n=e.status===`passed`,r=e.status===`idle`,i=document.getElementById(`live-status-badge`),a=document.getElementById(`live-status-dot`);i&&(i.textContent=r?`Ready`:String(e.status).toUpperCase(),i.className=`text-[10px] font-mono px-2 py-0.5 rounded font-medium `+(t||n?`bg-emerald-900/60 text-emerald-300`:r?`bg-slate-800 text-slate-300`:`bg-rose-700 text-white`)),a&&(a.className=`relative inline-flex rounded-full h-2.5 w-2.5 `+(t||n?`bg-emerald-400`:r?`bg-slate-400`:`bg-rose-500`)),document.getElementById(`live-status-pulse`)?.classList.toggle(`hidden`,!t),R(t),ve=t,Z(),!t&&I&&q(`project-status`,`Battle ${I}: ${e.message||e.status}`),clearInterval(P),t?(F||=Date.now(),P=setInterval(()=>{let e=document.getElementById(`live-timer`),t=Math.floor((Date.now()-F)/1e3);e&&(e.textContent=`${String(Math.floor(t/60)).padStart(2,`0`)}:${String(t%60).padStart(2,`0`)}`)},1e3)):N?.close(),e.message&&L(e.message,`text-amber-300`)}else if(e.type===`step_start`){let t=document.getElementById(`live-step-pill`);t&&(t.classList.remove(`hidden`),t.textContent=`Kane step ${e.step_index}`),L(`Step ${e.step_index}: running`,`text-emerald-400`)}else if(e.type===`step_end`)L(`Step ${e.step_index}: ${e.status}`,e.status===`passed`?`text-emerald-400`:`text-amber-300`);else if(e.type===`phase`){if(e.test_path===`Kane-generated LOCAL test (locked)`){let t=document.getElementById(`live-test-path`);t&&(t.value=e.test_path)}L(`Kane phase: ${e.phase} (attempt ${e.attempt})`,`text-cyan-300`)}else e.type===`action`?L(`Kane action: ${e.action}${e.success?` completed`:``}`,`text-slate-300`):e.type===`assertion`?L(`Kane assertion: ${e.passed?`passed`:`failed`}`,e.passed?`text-emerald-400`:`text-amber-300`):e.type===`progress`?L(e.message,`text-cyan-300`):e.type===`live_view`?e.state===`ready`&&e.url?z(e.url,!0):ye(e.state===`ended`?`Live view ended - verifying evidence...`:`Waiting for the local demo viewport...`):e.type===`screenshot`&&z(e.url)}function B(){N?.close(),N=new EventSource(`/api/kane/stream`),N.onmessage=e=>{try{xe(JSON.parse(e.data))}catch{}},N.onerror=()=>{N?.close(),clearInterval(P),R(!1);let e=document.getElementById(`live-status-badge`);e&&(e.textContent=`Disconnected`),L(`Monitor disconnected. Reload to reconnect; no result is inferred.`,`text-amber-300`)}}async function Se(){let e=document.getElementById(`live-target-url`);document.getElementById(`live-test-path`);let t=document.getElementById(`live-show-browser`);R(!0);try{let n=await fetch(`/api/kane/run`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Arena-Request":`1`},body:JSON.stringify({target_url:e?.value.trim()||`http://127.0.0.1:5000`,test_path:`.testmuai/tests/CheckoutConsistency_test.md`,show_browser:t?.checked??!0})}),r=await n.json();if(!n.ok)throw Error(r.error||`Launch refused (${n.status}).`);let i=document.getElementById(`live-console-feed`);i&&i.replaceChildren(),ye(),F=Date.now(),B()}catch(e){L(e.message,`text-rose-400`),R(!1)}}document.addEventListener(`click`,e=>{e.target.closest(`#btn-run-kane-live`)&&Se()}),B(),window.addEventListener(`pagehide`,()=>{N?.close(),clearInterval(P),document.getElementById(`live-stream-img`)?.removeAttribute(`src`)});let V=null,H=`builtin`,U=0,Ce=!1,W=``,we=``,Te=!1,G=null,K=!1,Ee=``;function q(e,t){let n=document.getElementById(e);n&&(n.textContent=t)}function J(e){return e instanceof TypeError||e instanceof SyntaxError?`Arena's Flask API is unavailable. Open http://127.0.0.1:5000/arena and try again.`:e.message||`Project request failed.`}let De=new Set([`completed`,`escaped`,`fault_rejected`,`approval_timeout`,`baseline_failed`,`test_unstable`,`unsupported`,`repair_failed`,`infrastructure_error`]);function Y(){let e=document.getElementById(`judge-start`);if(!e)return;let t=V?.project?.adapter===`local-contract`,n=V?.prerequisites||{},r=[`chrome`,`kane`,`codex`,`gemini`].filter(e=>!n[e]);V?.project?.adapter===`local-contract`&&!n.playwright&&r.push(`playwright`);let i=!V||V.project.id!==H||!t||!V.enabled||!V.judge_workflow_available||r.length>0;e.disabled=!!(K||W||i);let a=document.getElementById(`judge-project-label`);a&&(a.textContent=`Selected app: ${V?.project?.name||(H===`builtin`?`BreakShop`:H===`local-contract-sample`?`Museum Exhibit Price Card`:H)}`),K&&!W?q(`judge-status`,`This Arena process has already used its one judge workflow slot.`):t&&V&&!V.judge_workflow_available?q(`judge-status`,V.judge_workflow_blocker||`The Kane-generated judge workflow is unavailable for this project.`):!t&&V?q(`judge-status`,`Choose a valid LOCAL static-data contract for the Kane-generated judge workflow.`):V&&!V.enabled?q(`judge-status`,`Local execution is disabled. Enable it and restart Arena before starting.`):r.length&&q(`judge-status`,`Configure the missing local tools before starting: ${r.join(`, `)}.`)}function Oe(e){if(!e||typeof e!=`object`)throw Error(`The judge workflow returned an invalid status.`);W=e.id||W,we=e.proposal_id||``;let t=String(e.state||`unknown`).replaceAll(`_`,` `);q(`judge-status`,e.error||`Judge workflow: ${t}${e.result?` (${e.result})`:``}.`);let n=Array.isArray(e.executions)?e.executions.filter(e=>e.stage===`healthy`&&e.result===`passed`).length:0,r={created:0,authoring_test:1,qualifying_test:2+Math.min(n,2),awaiting_fault_approval:4,fault_decision_received:4,validating_fault:5,verifying_fault:6,repairing:7,repair_rejected:7,repair_attempt_failed:7,verifying_repair:8,completed:8}[e.state]??0,i=Math.round(r*100/8),a=document.getElementById(`judge-progress`),o=document.getElementById(`judge-progress-fill`);a&&a.setAttribute(`aria-valuenow`,String(i)),o&&(o.style.width=`${i}%`),q(`judge-progress-label`,e.state===`completed`?`8 / 8 · verified`:(De.has(e.state),`${r} / 8 · ${t}`)),e.state!==Ee&&(Ee=e.state,L(`Arena: ${t}`,`text-cyan-300`));let s=document.getElementById(`judge-events`);if(s){let t=(Array.isArray(e.events)?e.events:[]).map(e=>{let t=document.createElement(`li`);return t.textContent=e&&typeof e.message==`string`?e.message:`Workflow event unavailable.`,t});s.replaceChildren(...t)}let c=document.getElementById(`judge-proposal`),l=e.state===`awaiting_fault_approval`&&typeof e.proposal_id==`string`&&e.proposal_id.length>0;c&&(c.hidden=!l),q(`judge-fault-description`,l?e.fault_description:``),q(`judge-fault-diff`,l?e.fault_diff:``);let u=document.getElementById(`judge-approve-fault`),d=document.getElementById(`judge-reject-fault`);u&&(u.disabled=!l),d&&(d.disabled=!l),De.has(e.state)?(clearInterval(G),G=null,Te=!1,K=!0):Y()}async function X(){if(W&&!Te){Te=!0;try{let e=await fetch(`/api/judge-workflow/${encodeURIComponent(W)}`,{cache:`no-store`}),t=await e.json();if(!e.ok)throw Error(t.error||`Could not read judge workflow status.`);Oe(t.workflow)}catch(e){q(`judge-status`,J(e))}finally{Te=!1}}}async function ke(){if(!V||!document.getElementById(`judge-start`)||document.getElementById(`judge-start`).disabled||K)return;let e=document.getElementById(`judge-start`);e.disabled=!0,q(`judge-status`,`Starting the one capped judge workflow...`);try{let e=await fetch(`/api/judge-workflow`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Arena-Request":`1`},body:JSON.stringify({project_id:H})}),t=await e.json();if(!e.ok)throw Error(t.error||`Judge workflow could not start.`);K=!0,Oe(t.workflow),B(),G=setInterval(X,1e3),X()}catch(e){q(`judge-status`,J(e)),Y()}}async function Ae(e){if(!W||!we||![`approve`,`reject`].includes(e))return;let t=[`judge-approve-fault`,`judge-reject-fault`].map(e=>document.getElementById(e)).filter(Boolean);t.forEach(e=>{e.disabled=!0}),q(`judge-status`,e===`approve`?`Approval sent. Arena will validate the exact proposed edit.`:`Rejection sent. The fault will not be applied.`);try{let t=await fetch(`/api/judge-workflow/${encodeURIComponent(W)}/decision`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Arena-Request":`1`},body:JSON.stringify({proposal_id:we,decision:e})}),n=await t.json();if(!t.ok)throw Error(n.error||`Fault decision was not accepted.`);Oe(n.workflow),X()}catch(e){q(`judge-status`,J(e)),t.forEach(e=>{e.disabled=!1})}}function Z(){let e=document.getElementById(`project-start`);if(!e)return;let t=document.getElementById(`project-breaker`)?.value||`gemini`,n=V?.prerequisites,r=``;Ce||ve?r=`Follow the current battle in the live panel below.`:V?V.project.compatible?V.project.adapter===`local-contract`?r=`Use the new judge workflow above; the legacy battle runner never starts LOCAL imports.`:V.enabled?!n.chrome||!n.kane||!n.codex||n.node===!1?r=`Install the tools marked missing above, then refresh this page.`:t===`gemini`&&!n.gemini?r=`For Gemini, restart Arena from your configured terminal. To try a prepared fault now, choose Scripted.`:document.getElementById(`project-approve`)?.checked||(r=`Read the acceptance test above and tick the approval box to enable Start.`):r=`Enable local execution and restart Arena.`:r=`Choose a bundled demo to run a battle.`:r=`Select a project and wait for its setup check.`,e.disabled=!!r,q(`project-next`,r||`Ready. Start the battle to watch Kane check the healthy app.`)}async function Q(e,t=!1){let n=++U;V=null;let r=document.getElementById(`project-approve`);r&&(r.checked=!1),Z();try{let r=await fetch(`/api/projects/${encodeURIComponent(e)}/preflight`,{cache:`no-store`}),i=await r.json();if(n!==U)return;if(!r.ok)throw Error(i.error||`Preflight failed.`);V=i,H=e,Y();let a=i.project.compatible?`Runnable adapter: ${i.project.adapter===`breakshop`?`BreakShop`:i.project.adapter===`local-contract`?`LOCAL static-data contract`:`SeatPilot`}.`:`Inspection only: no runnable adapter.`,o=i.project.adapter===`local-contract`&&i.supported?` Supported scope: ${i.supported}`:``;q(`project-status`,`${t?`Import complete. `:``}${a} ${i.project.reason}${o}`),q(`project-test`,i.project.compatible?i.test_text:`No test approved. A project-specific adapter is required.`),q(`project-test-origin`,i.project.compatible?e===`seatpilot-generated`?`Kane CLI-generated proposal; separate from the protected curated tests and requires your approval.`:i.project.adapter===`local-contract`?i.test_origin:`Protected curated demo test; review and explicitly approve before launch.`:`No approved test is available for this inspection-only import.`),q(`project-test-hash`,i.project.compatible?`SHA-256: ${i.test_sha256}`:``);let s=i.prerequisites;q(`setup-local-execution`,i.enabled?`Enabled`:`Disabled`),q(`setup-chrome`,s.chrome?`Found`:`Missing`),q(`setup-kane`,s.kane?`Found`:`Missing`),q(`setup-codex`,s.codex?`Found`:`Missing`),q(`setup-gemini`,s.gemini?`Configured`:`Not configured`),q(`setup-node`,s.node===void 0?`Not required`:s.node?`Found`:`Missing`)}catch(e){n===U&&q(`project-status`,J(e))}Y(),Z()}async function je(){let e=document.getElementById(`project-zip`)?.files?.[0];if(!e){q(`project-status`,`Choose a source ZIP first.`);return}if(e.size>20971520){q(`project-status`,`ZIP exceeds 20 MB. Omit dependencies and build output.`);return}V=null,Z(),q(`project-status`,`Importing source only; no project code or install scripts are being run...`);let t=++U,n=document.getElementById(`project-import`);n&&(n.disabled=!0,n.setAttribute(`aria-busy`,`true`));let r=new FormData;r.append(`project`,e);try{let e=await fetch(`/api/projects/import`,{method:`POST`,headers:{"X-Arena-Request":`1`},body:r}),n=await e.json();if(!e.ok)throw Error(n.error||`Import failed.`);t===U&&await Q(n.project.id,!0)}catch(e){t===U&&q(`project-status`,J(e))}finally{n&&(n.disabled=!1,n.removeAttribute(`aria-busy`))}}async function Me(){if(V&&!Ce){Ce=!0,Z();try{let e=await fetch(`/api/projects/${H}/battle`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Arena-Request":`1`},body:JSON.stringify({approved:document.getElementById(`project-approve`)?.checked===!0,test_sha256:V.test_sha256,breaker:document.getElementById(`project-breaker`)?.value,show_browser:document.getElementById(`live-show-browser`)?.checked??!0})}),t=await e.json();if(!e.ok)throw Error(t.error||`Battle launch failed.`);q(`project-status`,`Full battle started. Follow the live panel and recorded history below.`),ve=!0,document.activeElement?.blur(),document.getElementById(`live-console-feed`)?.replaceChildren(),ye(),F=Date.now(),B()}catch(e){q(`project-status`,e.message)}finally{Ce=!1,Z()}}}document.addEventListener(`click`,e=>{e.target.closest(`#project-import`)?je():e.target.closest(`#project-builtin`)?Q(`builtin`):e.target.closest(`#project-seatpilot`)?Q(`seatpilot`):e.target.closest(`#project-generated`)?Q(`seatpilot-generated`):e.target.closest(`#project-local-sample`)?Q(`local-contract-sample`):e.target.closest(`#project-start`)?Me():e.target.closest(`#judge-start`)?ke():e.target.closest(`#judge-approve-fault`)?Ae(`approve`):e.target.closest(`#judge-reject-fault`)&&Ae(`reject`)}),document.addEventListener(`change`,e=>{e.target.matches(`#project-approve, #project-breaker`)&&Z()}),window.addEventListener(`pagehide`,()=>clearInterval(G)),Q(`builtin`);let $=null;function Ne(){$&&(w.activePreviewKey===`archive`||w.payload.autoSample)&&(document.activeElement?.id===`battle-search`||document.activeElement?.closest(`#project-setup-panel`)||w.isReplayingStages||D||(w.payload=r($),$=null,w.activePreviewKey=w.payload.autoSample?`historical_demo`:`archive`,j()))}document.addEventListener(`arena:archive-update`,e=>{let t=document.getElementById(`arena-payload`);t&&(t.textContent=JSON.stringify(e.detail)),$=e.detail,Ne()});let Pe=setInterval(Ne,250);window.addEventListener(`pagehide`,()=>clearInterval(Pe)),j()}var T=document.getElementById(`arena-payload`)?.textContent||``,E=!1;setInterval(async()=>{if(!(document.hidden||E)){E=!0;try{let e=await fetch(`/arena/data`+location.search,{cache:`no-store`});if(!e.ok)return;let t=await e.json(),n=JSON.stringify(t);n!==T&&(document.dispatchEvent(new CustomEvent(`arena:archive-update`,{detail:t})),T=n)}catch{}finally{E=!1}}},15e3),w();