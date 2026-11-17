(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`ready`,dataSourceLabel:`SAMPLE historical dataset (Flask + SQLite preview)`,notice:`Historical Demo (SAMPLE): Read-only reference dataset for first-time visitors. Connect Flask + SQLite to inspect recorded battles from your local database.`,activeBattleId:`SAMPLE-BTL-001`,battles:[{id:`SAMPLE-BTL-001`,title:`Checkout order total renders NaN when tax rate is omitted`,targetApp:`SAMPLE Target · minimalist-shop`,recordedLabel:`SAMPLE · Historical record #1`,breaker:`Gemini (Fault Proposer)`,faultFamily:`State / NaN Arithmetic`,outcome:`Success`,outcomeTone:`success`,repairAttempts:1,maxAttempts:3,summary:`Injected an undefined taxRate property read inside calculateTotal(), causing checkout summary rendering to emit NaN and throw an unhandled TypeError.`,stages:[{key:`propose`,actor:`Gemini`,label:`Proposes fault`,state:`Completed`,note:`SAMPLE · Proposed missing nullish guard in checkout.ts`,traceSnippet:`SAMPLE diff: - const tax = summary.taxRate ?? 0;
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
[SAMPLE] arena: battle marked Pending Inspection`,identifiers:{battleId:`SAMPLE-BTL-005`,geminiProposalId:`SAMPLE-GEM-924M`,arenaValidationId:`SAMPLE-ARN-430P`,kaneBreakRunId:`SAMPLE-KNE-762F`,codexRepairId:`SAMPLE-CDX-144R`,kaneVerifyRunId:`Pending`,sqliteRowKey:`battles.id = 5 (SAMPLE)`}}}]},t={historical_demo:e,empty:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`empty`,dataSourceLabel:`SAMPLE empty state preview`,notice:`Empty State Preview (SAMPLE): Demonstrates how the console renders when SQLite contains zero recorded battles.`,activeBattleId:null,battles:[]},loading:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`loading`,dataSourceLabel:`SAMPLE loading state preview`,notice:`Loading State Preview (SAMPLE): Demonstrates skeleton placeholders while Flask queries SQLite battle records.`,activeBattleId:null,battles:[]},missing_evidence:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`ready`,dataSourceLabel:`SAMPLE missing-evidence preview`,notice:`Missing-Evidence State Preview (SAMPLE): Battle metadata exists in SQLite, but one or more Kane CLI capture files are absent.`,activeBattleId:`SAMPLE-BTL-003`,battles:[e.battles[2]]},infra_error:{schemaVersion:`1.0`,mode:`historical_demo`,isSample:!0,status:`error`,dataSourceLabel:`SAMPLE infrastructure-error preview`,notice:`Infrastructure-Error State Preview (SAMPLE): Demonstrates backend or Kane CLI runner failure diagnostics.`,activeBattleId:null,battles:[],error:{code:`SAMPLE_SQLITE_READ_ERROR`,subsystem:`Flask / SQLite Store & Kane Artifact Index`,message:`Unable to read battle records from the configured SQLite database or locate the Kane artifact directory.`,detail:`SAMPLE diagnostic: sqlite3.OperationalError: no such table: arena_battles (or KANE_ARTIFACT_DIR unreachable).`,suggestion:`Verify the Flask database path, confirm migrations have run, and reload this console page.`}}};function n(){let e=document.getElementById(`arena-payload`);if(e&&e.textContent&&e.textContent.trim().length>0)try{let t=JSON.parse(e.textContent);if(t&&typeof t==`object`)return t}catch(e){return{schemaVersion:`1.0`,mode:`live_archive`,isSample:!1,status:`error`,dataSourceLabel:`Injected Jinja JSON payload`,notice:`Failed to parse server-injected JSON payload.`,activeBattleId:null,battles:[],error:{code:`PAYLOAD_PARSE_ERROR`,subsystem:`Jinja Template Serialization`,message:`The JSON embedded in #arena-payload could not be parsed.`,detail:e instanceof Error?e.message:String(e),suggestion:`Confirm Flask uses {{ arena_payload | tojson }} inside #arena-payload.`}}}return typeof window<`u`&&window.__ARENA_PAYLOAD__?window.__ARENA_PAYLOAD__:{mode:`live_archive`,isSample:!1,status:`empty`,dataSourceLabel:`Local SQLite archive`,notice:`No recorded battles are available.`,battles:[],activeBattleId:null}}function r(n){let r=t[n]||e,i=structuredClone(r);for(let e of i.battles||[]){e.isSample=!0;for(let t of Object.values(e.screenshots||{}))t.isSample=!0}return i}function i(e){let t=String(e||``).trim().toLowerCase().replace(/\s+/g,`_`);return[`repaired`,`success`,`caught_and_repaired`,`repair_verified`].includes(t)?`success`:[`failed`,`repair_failed`,`caught;_human_review_needed`,`human_review`].includes(t)?`repair_failed`:t===`pending`||t===`pending_inspection`?`pending_inspection`:t===`missing_evidence`?`missing_evidence`:t}function a(e){let t=Array.isArray(e)?e:[],n={all:t.length,success:0,repair_failed:0,pending_inspection:0,missing_evidence:0};for(let e of t){let t=i(e.outcome);t in n&&(n[t]+=1),t!==`missing_evidence`&&(e.screenshots?.failure?.status!==`available`||e.screenshots?.repair?.status!==`available`)&&(n.missing_evidence+=1)}return n}function o(e,{outcomeFilter:t=`all`,searchQuery:n=``}={}){if(!Array.isArray(e))return[];let r=n.trim().toLowerCase();return e.filter(e=>{if(t===`missing_evidence`){if(e.screenshots?.failure?.status===`available`&&e.screenshots?.repair?.status===`available`)return!1}else if(t!==`all`&&i(e.outcome)!==t)return!1;return!r||[e.id,e.title,e.breaker,e.faultFamily,e.outcome,e.targetApp].filter(Boolean).join(` `).toLowerCase().includes(r)})}function s(e,t){if(!Array.isArray(e)||e.length===0)return null;if(t){let n=e.find(e=>e.id===t);if(n)return n}return e[0]}function c(e){return e==null?``:String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function l(e){return e===`success`||e===`Completed`?`<svg class="w-4 h-4 shrink-0 text-emerald-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.25 5.75L8.5 13.5L4.75 9.75"/></svg>`:e===`warning`||e===`Missing`?`<svg class="w-4 h-4 shrink-0 text-amber-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6.5v4m0 3h.01M8.6 3.6L2.4 14.3a1.5 1.5 0 001.3 2.25h12.6a1.5 1.5 0 001.3-2.25L11.4 3.6a1.6 1.6 0 00-2.8 0z"/></svg>`:e===`danger`||e===`Failed`?`<svg class="w-4 h-4 shrink-0 text-rose-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.25 6.25l7.5 7.5m0-7.5l-7.5 7.5"/></svg>`:`<svg class="w-4 h-4 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="10" cy="10" r="6.25"/></svg>`}function u(e){return e===`success`||e===`Completed`?`text-emerald-800`:e===`warning`||e===`Missing`?`text-amber-800`:e===`danger`||e===`Failed`?`text-rose-800`:`text-slate-700`}function d(e,t){return`
    <section aria-label="Workspace context and preview state" class="bg-white border border-slate-200 rounded-lg px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="space-y-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span class="font-semibold text-slate-900">${c(e.isSample?`Historical Demo · SAMPLE Data (Read-Only)`:`Recorded Archive (Read-Only)`)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>No live execution or launch controls</span>
          <span aria-hidden="true">&middot;</span>
          <span>${c(e.dataSourceLabel||`Flask + SQLite dataset`)}</span>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed">
          ${c(e.notice)}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
        <span class="text-xs font-medium text-slate-500 whitespace-nowrap">Preview state:</span>
        <div role="group" aria-label="Console preview states" class="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
          ${[{key:`historical_demo`,label:`Historical Demo`},{key:`empty`,label:`Empty`},{key:`loading`,label:`Loading`},{key:`missing_evidence`,label:`Missing Evidence`},{key:`infra_error`,label:`Infra Error`}].map(e=>{let n=t===e.key;return`
                <button
                  type="button"
                  data-preview-state="${c(e.key)}"
                  aria-pressed="${n?`true`:`false`}"
                  class="px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${n?`bg-white text-slate-900 shadow-xs border border-slate-200/80`:`text-slate-600 hover:text-slate-900`}"
                >
                  ${c(e.label)}
                </button>
              `}).join(``)}
        </div>
      </div>
    </section>
  `}function f(){return`
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
  `}function p(){return`
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
            Reload from Jinja payload
          </button>
        </div>
      </div>
    </section>
  `}function m(e){let t=e||{code:`INFRASTRUCTURE_ERROR`,subsystem:`Backend Store / Runner`,message:`Unable to load battle history or verification artifacts.`,detail:`No additional error detail provided.`,suggestion:`Inspect Flask server logs and verify SQLite connectivity.`};return`
    <section aria-label="Infrastructure error" class="bg-white border border-rose-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 bg-rose-50/60 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 text-rose-900">
          ${l(`danger`)}
          <h2 class="font-display text-base font-semibold">
            Infrastructure Error: ${c(t.subsystem)}
          </h2>
        </div>
        <span class="font-mono text-xs font-medium text-rose-800 tabular-nums">
          ${c(t.code)}
        </span>
      </div>

      <div class="p-6 space-y-5">
        <p class="text-sm text-slate-700 leading-relaxed">
          ${c(t.message)}
        </p>

        <div class="bg-slate-900 text-slate-100 rounded-md p-4 font-mono text-xs overflow-x-auto leading-relaxed">
          ${c(t.detail)}
        </div>

        <p class="text-xs text-slate-600">
          <span class="font-semibold text-slate-800">Next step:</span> ${c(t.suggestion)}
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
  `}function h(e,{selectedStageIndex:t=0,prevStageIndex:n=0,isReplayingStages:r=!1,animateBattleEnter:i=!0}={}){let a=Array.isArray(e.stages)?e.stages:[],o=a.filter(e=>e.state===`Completed`).length,s=a.length>0?Math.max(0,Math.min(t??0,a.length-1)):0,d=a.length>0?Math.max(0,Math.min(n??s,a.length-1)):0,f=a.length>0?(s+1)/a.length:0,p=a.length>0?(d+1)/a.length:0,m=a[s]||null;return`
    <section id="overview" aria-labelledby="overview-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden ${i?`arena-enter`:``}">
      <div class="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
            <button
              type="button"
              data-copy-text="${c(e.id)}"
              title="Copy Battle ID"
              class="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-slate-950 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
            >
              <span>${c(e.id)}</span>
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <rect x="6.5" y="6.5" width="9" height="9" rx="1.5"/>
                <path d="M4.5 12.5v-7a1 1 0 011-1h7"/>
              </svg>
            </button>
            <span aria-hidden="true">&middot;</span>
            <span>${c(e.targetApp)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${c(e.recordedLabel)}</span>
          </div>
          <h1 id="overview-heading" class="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ${c(e.title)}
          </h1>
          <p class="text-sm text-slate-600 max-w-3xl leading-relaxed">
            ${c(e.summary)}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0 pt-1">
          <div class="inline-flex items-center gap-1.5 text-sm font-semibold ${u(e.outcomeTone)}">
            ${l(e.outcomeTone)}
            <span>Outcome: ${c(e.outcome)}</span>
          </div>
          <div class="text-xs text-slate-500 font-mono tabular-nums">
            Attempts: ${c(e.repairAttempts)} / ${c(e.maxAttempts)}
            <span aria-hidden="true">&middot;</span>
            Stages: ${o}/${a.length}
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
                Step ${s+1} / ${a.length||1}
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
              ${s<=0?`disabled`:``}
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
              ${s>=a.length-1?`disabled`:``}
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
          aria-valuemax="${Math.max(1,a.length)}"
          aria-valuenow="${s+1}"
          class="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden"
        >
          <div
            id="workflow-stage-progress-fill"
            data-target-scale="${f.toFixed(4)}"
            class="h-full w-full bg-slate-900 arena-progress-fill"
            style="transform: scaleX(${p.toFixed(4)});"
          ></div>
        </div>

        <ol class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          ${a.map((e,t)=>{let n=String(t+1).padStart(2,`0`),r=t===s,i=t<s;return`
                <li>
                  <button
                    type="button"
                    data-stage-index="${t}"
                    aria-pressed="${r?`true`:`false`}"
                    class="w-full h-full text-left border rounded-md p-3.5 flex flex-col justify-between gap-2.5 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${r?`border-slate-900 bg-white shadow-xs ring-1 ring-slate-900/10`:i?`border-slate-300 bg-white hover:border-slate-400`:`border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300`}"
                  >
                    <div class="space-y-1 w-full">
                      <div class="flex items-center justify-between gap-2 text-xs">
                        <span class="font-mono tabular-nums ${r||i?`text-slate-900 font-semibold`:`text-slate-500`}">${n} &middot; ${c(e.actor)}</span>
                        <span class="inline-flex items-center gap-1 font-medium ${u(e.state)}">
                          ${l(e.state)}
                          <span>${c(e.state)}</span>
                        </span>
                      </div>
                      <div class="font-display text-sm font-semibold text-slate-900">
                        ${c(e.label)}
                      </div>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">
                      ${c(e.note)}
                    </p>
                  </button>
                </li>
              `}).join(``)}
        </ol>

        ${m?`
            <div class="border border-slate-200 rounded-md bg-slate-50/70 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div class="space-y-0.5 min-w-0">
                <div class="text-xs font-semibold text-slate-900">
                  Recorded stage ${String(s+1).padStart(2,`0`)}: ${c(m.actor)} &mdash; ${c(m.label)}
                </div>
                <p class="text-xs text-slate-600">
                  ${c(m.note)}
                </p>
              </div>
              <pre class="font-mono text-[11px] bg-slate-900 text-slate-100 px-3.5 py-2 rounded overflow-x-auto leading-relaxed shrink-0 max-w-full lg:max-w-xl">${c(m.traceSnippet||`SAMPLE recorded trace: ${m.actor} (${m.state}) — ${m.note}`)}</pre>
            </div>
          `:``}
      </div>
    </section>
  `}function g(e,t,n,{outcomeFilter:r,searchQuery:i}){return`
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
              value="${c(i)}"
              placeholder="Filter ID or fault family..."
              class="w-full sm:w-56 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div role="group" aria-label="Filter battles by outcome" class="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200 overflow-x-auto">
            ${[{key:`all`,label:`All`},{key:`success`,label:`Success`},{key:`repair_failed`,label:`Repair Failed`},{key:`pending_inspection`,label:`Pending Inspection`},{key:`missing_evidence`,label:`Missing Evidence`}].map(e=>{let t=r===e.key;return`
                  <button
                    type="button"
                    data-outcome-filter="${c(e.key)}"
                    aria-pressed="${t?`true`:`false`}"
                    class="px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${t?`bg-white text-slate-900 shadow-xs`:`text-slate-600 hover:text-slate-900`}"
                  >
                    ${c(e.label)}
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
                        data-battle-row="${c(e.id)}"
                        tabindex="0"
                        role="button"
                        aria-selected="${t?`true`:`false`}"
                        class="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 ${t?`bg-slate-100/90`:`hover:bg-slate-50`}"
                      >
                        <td class="py-3 px-6 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                          ${t?`<span aria-hidden="true" class="mr-1.5 text-slate-900">&rsaquo;</span>`:``}${c(e.id)}
                        </td>
                        <td class="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                          ${c(e.breaker)}
                        </td>
                        <td class="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                          ${c(e.faultFamily)}
                        </td>
                        <td class="py-3 px-4 text-xs whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 font-medium ${u(e.outcomeTone)}">
                            ${l(e.outcomeTone)}
                            <span>${c(e.outcome)}</span>
                          </span>
                        </td>
                        <td class="py-3 px-4 text-xs font-mono text-slate-800 text-right whitespace-nowrap tabular-nums">
                          ${c(e.repairAttempts)} / ${c(e.maxAttempts)}
                        </td>
                        <td class="py-3 px-6 text-xs font-mono text-slate-600 text-right whitespace-nowrap tabular-nums">
                          ${c(a)}
                        </td>
                      </tr>
                    `}).join(``)}
              </tbody>
            </table>
          </div>
        `}
    </section>
  `}function _(e){let t=Array.isArray(e.comparisons)?e.comparisons:[];return`
    <section id="comparison" aria-labelledby="comparison-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="comparison-heading" class="font-display text-base font-semibold text-slate-900">
            Battle Detail: Expected vs. Actual Values
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Recorded assertions for <span class="font-mono text-slate-700">${c(e.id)}</span> across Kane CLI pre-repair and post-repair runs.
          </p>
        </div>
        <span class="text-xs text-slate-500 font-mono tabular-nums">
          ${t.length} assertion${t.length===1?``:`s`}
        </span>
      </div>

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
                      ${c(e.check)}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-slate-800 bg-slate-50/40">
                      ${c(e.expected)}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-rose-800">
                      ${c(e.actualPreRepair)}
                    </td>
                    <td class="py-3.5 px-4 font-mono ${e.matched?`text-emerald-800`:`text-amber-800`}">
                      ${c(e.actualPostRepair)}
                    </td>
                    <td class="py-3.5 px-6 text-right whitespace-nowrap">
                      <span class="inline-flex items-center justify-end gap-1.5 font-medium ${u(t)}">
                        ${l(t)}
                        <span>${n}</span>
                      </span>
                    </td>
                  </tr>
                `}).join(``)}
          </tbody>
        </table>
      </div>
    </section>
  `}function v(e,t,n){return!e||e.status!==`available`||!e.url?`
      <div class="border border-amber-200 bg-amber-50/40 rounded-md flex flex-col justify-between h-full">
        <div class="px-4 py-3 border-b border-amber-200/80 flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-slate-900">${c(t)}</span>
          <span class="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
            ${l(`warning`)}
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
              ${c(e?.missingReason||`Artifact file was not persisted by Kane CLI.`)}
            </p>
          </div>
          <code class="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
            ${c(e?.artifactPath||`artifacts/${n}/missing.jpg`)}
          </code>
        </div>

        <div class="px-4 py-2.5 border-t border-amber-200/80 text-xs text-slate-600">
          ${c(e?.caption||`Missing capture · SAMPLE (not live)`)}
        </div>
      </div>
    `:`
    <figure class="border border-slate-200 bg-slate-50/40 rounded-md flex flex-col justify-between h-full overflow-hidden">
      <figcaption class="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-900 truncate">${c(t)}</div>
          <div class="text-[11px] text-slate-500 truncate">${c(e.caption)}</div>
        </div>
        <button
          type="button"
          data-zoom-src="${c(e.url)}"
          data-zoom-title="${c(t)}"
          data-zoom-subtitle="${c(e.caption)} · ${c(e.artifactPath)}"
          data-zoom-alt="${c(e.alt)}"
          class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          Inspect
        </button>
      </figcaption>

      <div class="p-3 flex-1 flex items-center justify-center bg-slate-100/70">
        <img
          src="${c(e.url)}"
          alt="${c(e.alt)}"
          referrerpolicy="no-referrer"
          loading="lazy"
          data-fallback-path="${c(e.artifactPath)}"
          class="w-full aspect-[4/3] object-cover rounded border border-slate-200 bg-white"
        />
      </div>

      <div class="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
        <span class="truncate">${c(e.artifactPath)}</span>
        <span class="whitespace-nowrap shrink-0">Recorded · Not live</span>
      </div>
    </figure>
  `}function y(e,t,n){let r=Math.max(0,Math.min(100,Number(n??50)));return`
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
          src="${c(t.url)}"
          alt="${c(t.alt)}"
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
            src="${c(e.url)}"
            alt="${c(e.alt)}"
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
  `}function b(e,{screenshotCompareMode:t=`side_by_side`,wipePercent:n=50}={}){let r=e.screenshots?.failure,i=e.screenshots?.repair,a=r?.status===`available`&&!!r?.url&&i?.status===`available`&&!!i?.url,o=a?t:`side_by_side`;return`
    <section aria-labelledby="screenshots-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 id="screenshots-heading" class="font-display text-base font-semibold text-slate-900">
            Side-by-Side Recorded Kane Screenshots
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Static recorded artifacts from Kane CLI runs for <span class="font-mono text-slate-700">${c(e.id)}</span>. Captures are historical records, not live streams.
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
        ${o===`wipe`?y(r,i,n):`
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              ${v(r,`1. Kane Failure Capture (Pre-Repair)`,e.id)}
              ${v(i,`2. Kane Verification Capture (Post-Repair)`,e.id)}
            </div>
          `}
      </div>
    </section>
  `}function x(e){let t=e.verification||{},n=Array.isArray(t.checks)?t.checks:[],r=t.identifiers||{},i=[[`Battle ID`,r.battleId],[`Gemini Proposal ID`,r.geminiProposalId],[`Arena Validation ID`,r.arenaValidationId],[`Kane Failure Run ID`,r.kaneBreakRunId],[`Codex Repair Patch ID`,r.codexRepairId],[`Kane Verify Run ID`,r.kaneVerifyRunId],[`SQLite Row Key`,r.sqliteRowKey]];return`
    <section id="verification" aria-labelledby="verification-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
      <div class="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="verification-heading" class="font-display text-base font-semibold text-slate-900">
            Verification Details &amp; Execution Identifiers
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            ${c(t.checksSummary||`Expand sections below to inspect Kane CLI assertions, logs, and execution identifiers.`)}
          </p>
        </div>
        <div class="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
          Exit codes: before ${c(t.kaneExitCodeBefore)} &rarr; after ${c(t.kaneExitCodeAfter)}
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
                      <td class="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">${c(e.id)}</td>
                      <td class="py-2.5 px-4 font-mono text-slate-700">
                        <div class="flex items-center justify-between gap-2">
                          <span>${c(e.command)}</span>
                          <button
                            type="button"
                            data-copy-text="${c(e.command)}"
                            class="px-2 py-0.5 text-[11px] font-sans font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td class="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">${c(e.result)}</td>
                      <td class="py-2.5 px-4 text-slate-600">${c(e.detail)}</td>
                    </tr>
                  `).join(``)}
              </tbody>
            </table>
          </div>

          <div class="space-y-1.5">
            <div class="text-xs font-medium text-slate-700">${e.isSample?`Recorded stdout excerpt (SAMPLE)`:`Sanitized recorded event summary`}</div>
            <pre class="font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto leading-relaxed">${c(t.stdoutExcerpt||`No stdout recorded.`)}</pre>
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
                  <dt class="text-xs text-slate-500">${c(e)}</dt>
                  <dd class="flex items-center justify-between gap-2 font-mono text-xs font-medium text-slate-900 tabular-nums">
                    <span class="truncate">${c(t||`—`)}</span>
                    ${t?`<button type="button" data-copy-text="${c(t)}" class="px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded transition-colors shrink-0">Copy</button>`:``}
                  </dd>
                </div>
              `).join(``)}
          </dl>
        </div>
      </details>
    </section>
  `}function S({payload:e,outcomeFilter:t,counts:n,filteredCount:r}){let i=e.status===`ready`&&Array.isArray(e.battles)&&e.battles.length>0,a=[{key:`all`,label:`All`,count:n.all},{key:`success`,label:`Success`,count:n.success},{key:`repair_failed`,label:`Repair Failed`,count:n.repair_failed},{key:`pending_inspection`,label:`Pending Inspection`,count:n.pending_inspection}],o=a.find(e=>e.key===t),s=i?o?`Showing ${r} of ${n.all} battles (${o.label})`:`Showing ${r} of ${n.all} battles`:`Battle history filters unavailable in current state`;return`
    <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-xs font-medium text-slate-600 whitespace-nowrap">Battle history view:</span>
        <div role="group" aria-label="Toggle battle history view" class="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
          ${a.map(e=>{let n=t===e.key;return`
                <button
                  type="button"
                  data-outcome-filter="${c(e.key)}"
                  aria-pressed="${n?`true`:`false`}"
                  ${i?``:`disabled`}
                  class="px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${i?n?`bg-white text-slate-900 shadow-xs border border-slate-200/80`:`text-slate-600 hover:text-slate-900`:`text-slate-400 cursor-not-allowed`}"
                >
                  <span>${c(e.label)}</span>
                  <span class="ml-1.5 font-mono text-[11px] tabular-nums ${n?`text-slate-700`:`text-slate-500`}">${e.count}</span>
                </button>
              `}).join(``)}
        </div>
      </div>

      <div class="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
        ${c(s)}
      </div>
    </div>
  `}function C(e){let{payload:t,activePreviewKey:n,filteredBattles:r,selectedBattle:i,outcomeFilter:a,searchQuery:o,selectedStageIndex:s,prevStageIndex:c,animateBattleEnter:l,isReplayingStages:u,screenshotCompareMode:v,wipePercent:y}=e,S=[d(t,n)];if(t.status===`loading`)return S.push(f()),S.join(`
`);if(t.status===`error`)return S.push(m(t.error)),S.join(`
`);if(t.status===`empty`||!Array.isArray(t.battles)||t.battles.length===0)return S.push(p()),S.join(`
`);let C=i||t.battles[0];return S.push(h(C,{selectedStageIndex:s,prevStageIndex:c,isReplayingStages:u,animateBattleEnter:l})),S.push(g(t.battles,r,C.id,{outcomeFilter:a,searchQuery:o})),S.push(_(C)),S.push(b(C,{screenshotCompareMode:v,wipePercent:y})),S.push(x(C)),S.join(`
`)}function w(){let e=!1,t=null;function n(){if(typeof window>`u`)return null;if(!t){let e=window.AudioContext||window.webkitAudioContext;if(!e)return null;t=new e({latencyHint:`interactive`})}return t.state===`suspended`&&t.resume().catch(()=>{}),t}function r({freqStart:e,freqEnd:t,durationSec:r,gainPeak:i,type:a=`sine`,delaySec:o=0}){let s=n();if(!s)return;let c=s.currentTime+o,l=s.createOscillator(),u=s.createGain();l.type=a,l.frequency.setValueAtTime(e,c),t&&t!==e&&l.frequency.exponentialRampToValueAtTime(t,c+r),u.gain.setValueAtTime(1e-4,c),u.gain.exponentialRampToValueAtTime(i,c+.006),u.gain.exponentialRampToValueAtTime(1e-4,c+r),l.connect(u),u.connect(s.destination),l.start(c),l.stop(c+r+.01)}function i(t=`nav`){e&&(t===`nav`?r({freqStart:520,freqEnd:610,durationSec:.032,gainPeak:.025,type:`sine`}):t===`filter`?r({freqStart:440,freqEnd:540,durationSec:.038,gainPeak:.028,type:`triangle`}):t===`copy`?(r({freqStart:620,freqEnd:620,durationSec:.028,gainPeak:.022,type:`sine`}),r({freqStart:830,freqEnd:830,durationSec:.04,gainPeak:.024,type:`sine`,delaySec:.03})):t===`error`?r({freqStart:240,freqEnd:185,durationSec:.06,gainPeak:.03,type:`triangle`}):t===`toggleOn`&&r({freqStart:480,freqEnd:640,durationSec:.045,gainPeak:.028,type:`sine`}))}function a(){return e}function o(){return e=!e,e&&(n(),i(`toggleOn`)),e}return{isEnabled:a,toggle:o,play:i}}function T(){let e=document.getElementById(`battle-filter-bar`),t=document.getElementById(`arena-main`),i=document.getElementById(`footer-data-source`),l=document.getElementById(`export-json-btn`),u=document.getElementById(`arena-toast`),d=document.getElementById(`footer-sound-toggle`),f=document.getElementById(`footer-sound-icon-off`),p=document.getElementById(`footer-sound-icon-on`),m=document.getElementById(`footer-sound-label`),h=document.getElementById(`footer-schema-toggle`),g=document.getElementById(`schema-modal`),_=document.getElementById(`schema-modal-close`),v=document.getElementById(`footer-shortcuts-toggle`),y=document.getElementById(`shortcuts-modal`),b=document.getElementById(`shortcuts-modal-close`),x=document.getElementById(`screenshot-modal`),T=document.getElementById(`screenshot-modal-close`),E=document.getElementById(`screenshot-modal-img`),D=document.getElementById(`screenshot-modal-title`),O=document.getElementById(`screenshot-modal-subtitle`);if(!t)return;let k=w();function A(){if(!d)return;let e=k.isEnabled();d.setAttribute(`aria-pressed`,e?`true`:`false`),m&&(m.textContent=e?`Sound: On`:`Sound: Muted`),f&&f.classList.toggle(`hidden`,e),p&&p.classList.toggle(`hidden`,!e),d.classList.toggle(`text-slate-900`,e),d.classList.toggle(`font-medium`,e),d.classList.toggle(`text-slate-600`,!e)}let j={payload:n(),activePreviewKey:n().isSample?`historical_demo`:`archive`,selectedBattleId:null,outcomeFilter:`all`,searchQuery:``,selectedStageIndex:0,isReplayingStages:!1,screenshotCompareMode:`side_by_side`,wipePercent:50};j.selectedBattleId=j.payload.activeBattleId||null;let M=null,N=null,P=!1,F=null,I=0;function L(e){u&&(u.textContent=e,u.classList.remove(`hidden`),N&&clearTimeout(N),N=setTimeout(()=>{u.classList.add(`hidden`)},1800))}function R(){M&&=(clearInterval(M),null),j.isReplayingStages=!1}function z(){let e=o(j.payload.battles,{outcomeFilter:j.outcomeFilter,searchQuery:j.searchQuery});return s(e.length>0?e:j.payload.battles,j.selectedBattleId)}function B(){if(j.isReplayingStages){R(),W();return}let e=z()?.stages?.length||0;e<=1||(j.isReplayingStages=!0,j.selectedStageIndex>=e-1&&(j.selectedStageIndex=0),W(),M=setInterval(()=>{let e=z(),t=e?.stages?.length||0;!e||j.selectedStageIndex>=t-1?(R(),W()):(j.selectedStageIndex+=1,k.play(`nav`),W())},1400))}function V(e){let t=Math.max(0,Math.min(100,e));j.wipePercent=t;let n=document.getElementById(`arena-wipe-overlay`),r=document.getElementById(`arena-wipe-handle`),i=document.getElementById(`arena-wipe-range`),a=document.getElementById(`arena-wipe-stage`);if(n&&(n.style.clipPath=`inset(0 ${100-t}% 0 0)`),r&&(r.style.left=`${t}%`),i instanceof HTMLInputElement&&(i.value=String(Math.round(t))),a&&a.previousElementSibling){let e=a.previousElementSibling.querySelector(`.font-mono`);e&&(e.textContent=`Split position: ${Math.round(t)}%`)}}function H(e){R(),e!==j.outcomeFilter&&k.play(`filter`),j.outcomeFilter=e;let t=o(j.payload.battles,{outcomeFilter:j.outcomeFilter,searchQuery:j.searchQuery});t.length>0&&!t.some(e=>e.id===j.selectedBattleId)&&(j.selectedBattleId=t[0].id,j.selectedStageIndex=0),W()}function U(e){e&&e!==j.selectedBattleId&&(R(),k.play(`nav`),j.selectedBattleId=e,j.selectedStageIndex=0,W())}function W(){let n=o(j.payload.battles,{outcomeFilter:j.outcomeFilter,searchQuery:j.searchQuery}),r=a(j.payload.battles);n.length>0&&j.selectedBattleId&&!n.some(e=>e.id===j.selectedBattleId)&&(j.selectedBattleId=n[0].id,j.selectedStageIndex=0);let l=s(n.length>0?n:j.payload.battles,j.selectedBattleId);e&&(e.innerHTML=S({payload:j.payload,outcomeFilter:j.outcomeFilter,counts:r,filteredCount:n.length}));let u=document.activeElement,d=u&&u.id===`battle-search`,f=d?u.selectionStart:null,p=d?u.selectionEnd:null,m=l?l.id:null,h=m!==null&&m===F,g=h?I:0;t.innerHTML=C({payload:j.payload,activePreviewKey:j.activePreviewKey,filteredBattles:n,selectedBattle:l,outcomeFilter:j.outcomeFilter,searchQuery:j.searchQuery,selectedStageIndex:j.selectedStageIndex,prevStageIndex:g,animateBattleEnter:!h,isReplayingStages:j.isReplayingStages,screenshotCompareMode:j.screenshotCompareMode,wipePercent:j.wipePercent}),F=m,I=j.selectedStageIndex;let _=document.getElementById(`workflow-stage-progress-fill`);if(_){let e=_.getAttribute(`data-target-scale`);e&&(_.offsetWidth,requestAnimationFrame(()=>{_.style.transform=`scaleX(${e})`}))}if(i&&(i.textContent=`Source: ${j.payload.dataSourceLabel||`BuildBreak Arena dataset`}`),t.querySelectorAll(`img[data-fallback-path]`).forEach(e=>{e.addEventListener(`error`,()=>{let t=e.getAttribute(`data-fallback-path`)||`artifact.jpg`,n=document.createElement(`div`);n.className=`w-full aspect-[4/3] rounded border border-amber-200 bg-amber-50/60 flex flex-col items-center justify-center p-4 text-center gap-2`,n.innerHTML=`
          <span class="text-xs font-semibold text-amber-900">Capture preview unavailable</span>
          <code class="text-[11px] font-mono text-slate-600">${c(t)}</code>
        `,e.replaceWith(n)})}),d){let e=document.getElementById(`battle-search`);e&&(e.focus(),typeof f==`number`&&typeof p==`number`&&e.setSelectionRange(f,p))}}function G({src:e,title:t,subtitle:n,alt:r}){x&&E&&(E.src=e,E.alt=r||t||`Recorded Kane CLI screenshot`,D&&(D.textContent=t||`Recorded capture preview`),O&&(O.textContent=n||``),x.classList.remove(`hidden`))}function K(){x&&E&&(x.classList.add(`hidden`),E.src=``)}function q(){g&&g.classList.remove(`hidden`)}function J(){g&&g.classList.add(`hidden`)}function Y(){y&&y.classList.remove(`hidden`)}function X(){y&&y.classList.add(`hidden`)}e&&e.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`[data-outcome-filter]`);n&&!n.hasAttribute(`disabled`)&&H(n.getAttribute(`data-outcome-filter`)||`all`)}),t.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let i=t.closest(`[data-copy-text]`);if(i){let e=i.getAttribute(`data-copy-text`);e&&navigator.clipboard&&navigator.clipboard.writeText(e).then(()=>{k.play(`copy`),L(`Copied "${e}"`)}).catch(()=>L(`Copy unavailable in this browser context`));return}let a=t.closest(`[data-preview-state]`);if(a){let e=a.getAttribute(`data-preview-state`);e&&(R(),k.play(e===`infra_error`||e===`missing_evidence`?`error`:`filter`),j.activePreviewKey=e,j.payload=r(e),j.selectedBattleId=j.payload.activeBattleId||null,j.selectedStageIndex=0,j.outcomeFilter=`all`,j.searchQuery=``,W());return}let o=t.closest(`[data-outcome-filter]`);if(o){H(o.getAttribute(`data-outcome-filter`)||`all`);return}let s=t.closest(`[data-stage-index]`);if(s){R();let e=Number(s.getAttribute(`data-stage-index`));Number.isNaN(e)||(k.play(`nav`),j.selectedStageIndex=e,W());return}let c=t.closest(`[data-stage-nav]`);if(c&&!c.hasAttribute(`disabled`)){R();let e=c.getAttribute(`data-stage-nav`),t=(z()?.stages?.length||1)-1;e===`prev`?j.selectedStageIndex=Math.max(0,j.selectedStageIndex-1):e===`next`&&(j.selectedStageIndex=Math.min(t,j.selectedStageIndex+1)),k.play(`nav`),W();return}if(t.closest(`[data-stage-replay]`)){k.play(`nav`),B();return}let l=t.closest(`[data-compare-mode]`);if(l){let e=l.getAttribute(`data-compare-mode`);(e===`side_by_side`||e===`wipe`)&&(e!==j.screenshotCompareMode&&k.play(`filter`),j.screenshotCompareMode=e,W());return}let u=t.closest(`[data-action]`);if(u){let e=u.getAttribute(`data-action`);e===`clear-filters`?(k.play(`filter`),j.outcomeFilter=`all`,j.searchQuery=``,W()):e===`reload-payload`&&(R(),k.play(`filter`),j.activePreviewKey=`archive`,j.payload=n(),j.selectedBattleId=j.payload.activeBattleId||null,j.selectedStageIndex=0,W());return}let d=t.closest(`[data-zoom-src]`);if(d){k.play(`nav`),G({src:d.getAttribute(`data-zoom-src`)||``,title:d.getAttribute(`data-zoom-title`)||``,subtitle:d.getAttribute(`data-zoom-subtitle`)||``,alt:d.getAttribute(`data-zoom-alt`)||``});return}let f=t.closest(`[data-battle-row]`);f&&U(f.getAttribute(`data-battle-row`))}),t.addEventListener(`pointerdown`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`#arena-wipe-stage`);if(!n)return;P=!0;let r=n.getBoundingClientRect();V((e.clientX-r.left)/r.width*100)}),window.addEventListener(`pointermove`,e=>{if(!P)return;let t=document.getElementById(`arena-wipe-stage`);if(!t){P=!1;return}let n=t.getBoundingClientRect();V((e.clientX-n.left)/n.width*100)}),window.addEventListener(`pointerup`,()=>{P=!1}),t.addEventListener(`keydown`,e=>{let t=e.target;if(t instanceof Element&&(e.key===`Enter`||e.key===` `)){let n=t.closest(`[data-battle-row]`);n&&(e.preventDefault(),U(n.getAttribute(`data-battle-row`)))}}),t.addEventListener(`input`,e=>{let t=e.target;t instanceof HTMLInputElement&&(t.id===`battle-search`?(j.searchQuery=t.value,W()):t.id===`arena-wipe-range`&&V(Number(t.value)))}),l&&l.addEventListener(`click`,()=>{let e=new Blob([JSON.stringify(j.payload,null,2)],{type:`application/json`}),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=`buildbreak-arena-${j.activePreviewKey}.json`,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(t),k.play(`copy`),L(`Exported JSON snapshot`)}),d&&d.addEventListener(`click`,()=>{k.toggle(),A()}),A(),document.querySelectorAll(`header nav a`).forEach(e=>{e.addEventListener(`click`,()=>k.play(`nav`))}),T&&T.addEventListener(`click`,K),x&&x.addEventListener(`click`,e=>{e.target===x&&K()}),h&&h.addEventListener(`click`,q),_&&_.addEventListener(`click`,J),g&&g.addEventListener(`click`,e=>{e.target===g&&J()}),v&&v.addEventListener(`click`,Y),b&&b.addEventListener(`click`,X),y&&y.addEventListener(`click`,e=>{e.target===y&&X()}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`){K(),J(),X();return}let t=document.activeElement;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)){if(e.key===`?`)e.preventDefault(),y&&y.classList.contains(`hidden`)?Y():X();else if(e.key===`/`){let t=document.getElementById(`battle-search`);t&&(e.preventDefault(),t.focus())}else if(j.payload.status===`ready`){if(e.key===`1`)H(`all`);else if(e.key===`2`)H(`success`);else if(e.key===`3`)H(`repair_failed`);else if(e.key===`4`)H(`pending_inspection`);else if(e.key===`[`||e.key===`]`){let t=(z()?.stages?.length||1)-1;R(),j.selectedStageIndex=e.key===`[`?Math.max(0,j.selectedStageIndex-1):Math.min(t,j.selectedStageIndex+1),k.play(`nav`),W()}else if(e.key===`j`||e.key===`k`){let t=o(j.payload.battles,{outcomeFilter:j.outcomeFilter,searchQuery:j.searchQuery});if(t.length<=1)return;let n=t.findIndex(e=>e.id===j.selectedBattleId);U(t[e.key===`j`?(n+1)%t.length:(n-1+t.length)%t.length].id)}}}}),document.addEventListener(`arena:archive-update`,e=>{let t=e.detail,n=document.getElementById(`arena-payload`);n&&(n.textContent=JSON.stringify(t)),j.activePreviewKey===`archive`&&(document.activeElement?.id===`battle-search`||j.isReplayingStages||P||(j.payload=t,W()))}),W()}var E=document.getElementById(`arena-payload`)?.textContent||``,D=!1;setInterval(async()=>{if(!(document.hidden||D)){D=!0;try{let e=await fetch(`/arena/data`+location.search,{cache:`no-store`});if(!e.ok)return;let t=await e.json(),n=JSON.stringify(t);n!==E&&(document.dispatchEvent(new CustomEvent(`arena:archive-update`,{detail:t})),E=n)}catch{}finally{D=!1}}},15e3),T();