/**
 * BuildBreak Arena — Lightweight Vanilla JS Presentation Renderer
 *
 * Pure HTML-string / DOM rendering functions with zero framework dependencies.
 * Can be ported directly into Flask static/js/ alongside Jinja templates.
 */

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderStatusIcon(tone) {
  if (tone === 'success' || tone === 'Completed') {
    return `<svg class="w-4 h-4 shrink-0 text-emerald-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.25 5.75L8.5 13.5L4.75 9.75"/></svg>`;
  }
  if (tone === 'warning' || tone === 'Missing') {
    return `<svg class="w-4 h-4 shrink-0 text-amber-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6.5v4m0 3h.01M8.6 3.6L2.4 14.3a1.5 1.5 0 001.3 2.25h12.6a1.5 1.5 0 001.3-2.25L11.4 3.6a1.6 1.6 0 00-2.8 0z"/></svg>`;
  }
  if (tone === 'danger' || tone === 'Failed') {
    return `<svg class="w-4 h-4 shrink-0 text-rose-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.25 6.25l7.5 7.5m0-7.5l-7.5 7.5"/></svg>`;
  }
  return `<svg class="w-4 h-4 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="10" cy="10" r="6.25"/></svg>`;
}

function getToneTextClass(tone) {
  if (tone === 'success' || tone === 'Completed') return 'text-emerald-800';
  if (tone === 'warning' || tone === 'Missing') return 'text-amber-800';
  if (tone === 'danger' || tone === 'Failed') return 'text-rose-800';
  return 'text-slate-700';
}

function renderWorkspaceBanner(payload, activePreviewKey) {
  const previewOptions = [
    { key: 'historical_demo', label: 'Historical Demo' },
    { key: 'empty', label: 'Empty' },
    { key: 'loading', label: 'Loading' },
    { key: 'missing_evidence', label: 'Missing Evidence' },
    { key: 'infra_error', label: 'Infra Error' },
  ];

  const modeLabel = payload.isSample
    ? 'Historical Demo · SAMPLE Data (Read-Only)'
    : 'Recorded Archive (Read-Only)';

  return `
    <section aria-label="Workspace context and preview state" class="bg-white border border-slate-200 rounded-lg px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="space-y-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span class="font-semibold text-slate-900">${escapeHtml(modeLabel)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>History is read-only; local Kane monitor requires opt-in</span>
          <span aria-hidden="true">&middot;</span>
          <span>${escapeHtml(payload.dataSourceLabel || 'Flask + SQLite dataset')}</span>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed">
          ${escapeHtml(payload.notice)}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
        <span class="text-xs font-medium text-slate-500 whitespace-nowrap">Preview state:</span>
        <div role="group" aria-label="Console preview states" class="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
          ${previewOptions
            .map((opt) => {
              const isActive = activePreviewKey === opt.key;
              return `
                <button
                  type="button"
                  data-preview-state="${escapeHtml(opt.key)}"
                  aria-pressed="${isActive ? 'true' : 'false'}"
                  class="px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  ${escapeHtml(opt.label)}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
    </section>
  `;
}

function renderLoadingState() {
  return `
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
          ${Array.from({ length: 5 })
            .map(
              () => `
              <div class="p-3 border border-slate-200 rounded-md space-y-2">
                <div class="h-3 w-16 rounded arena-skeleton"></div>
                <div class="h-4 w-28 rounded arena-skeleton"></div>
                <div class="h-3 w-full rounded arena-skeleton"></div>
              </div>
            `,
            )
            .join('')}
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div class="h-5 w-32 rounded arena-skeleton"></div>
          <div class="h-8 w-64 rounded arena-skeleton"></div>
        </div>
        <div class="divide-y divide-slate-200">
          ${Array.from({ length: 4 })
            .map(
              () => `
              <div class="px-6 py-3.5 grid grid-cols-6 gap-4 items-center">
                <div class="h-4 w-24 rounded arena-skeleton"></div>
                <div class="h-4 w-28 rounded arena-skeleton"></div>
                <div class="h-4 w-32 rounded arena-skeleton"></div>
                <div class="h-4 w-20 rounded arena-skeleton"></div>
                <div class="h-4 w-12 ml-auto rounded arena-skeleton"></div>
                <div class="h-4 w-20 ml-auto rounded arena-skeleton"></div>
              </div>
            `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}

function renderEmptyState() {
  return `
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
  `;
}

function renderInfraErrorState(errorObj) {
  const err = errorObj || {
    code: 'INFRASTRUCTURE_ERROR',
    subsystem: 'Backend Store / Runner',
    message: 'Unable to load battle history or verification artifacts.',
    detail: 'No additional error detail provided.',
    suggestion: 'Inspect Flask server logs and verify SQLite connectivity.',
  };

  return `
    <section aria-label="Infrastructure error" class="bg-white border border-rose-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 bg-rose-50/60 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 text-rose-900">
          ${renderStatusIcon('danger')}
          <h2 class="font-display text-base font-semibold">
            Infrastructure Error: ${escapeHtml(err.subsystem)}
          </h2>
        </div>
        <span class="font-mono text-xs font-medium text-rose-800 tabular-nums">
          ${escapeHtml(err.code)}
        </span>
      </div>

      <div class="p-6 space-y-5">
        <p class="text-sm text-slate-700 leading-relaxed">
          ${escapeHtml(err.message)}
        </p>

        <div class="bg-slate-900 text-slate-100 rounded-md p-4 font-mono text-xs overflow-x-auto leading-relaxed">
          ${escapeHtml(err.detail)}
        </div>

        <p class="text-xs text-slate-600">
          <span class="font-semibold text-slate-800">Next step:</span> ${escapeHtml(err.suggestion)}
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
  `;
}

function shareResult(battle) {
  const phases = battle.verification?.checks || [];
  const lines = [
    `BuildBreak Arena | ${battle.targetApp} | ${battle.outcome}`,
    `Battle ${battle.id}`,
    `Breaker: ${battle.breaker}. Repair attempts: ${battle.repairAttempts}.`,
    ...phases.map(check => `Kane ${check.id}: ${check.result}`),
    battle.summary,
  ];
  return lines.join('\n');
}

function renderOverviewSection(
  battle,
  {
    selectedStageIndex = 0,
    prevStageIndex = 0,
    isReplayingStages = false,
    animateBattleEnter = true,
    recordedArchive = false,
  } = {},
) {
  const stages = Array.isArray(battle.stages) ? battle.stages : [];
  const stageCountCompleted = stages.filter((s) => s.state === 'Completed').length;
  const clampedIdx =
    stages.length > 0 ? Math.max(0, Math.min(selectedStageIndex ?? 0, stages.length - 1)) : 0;
  const clampedPrevIdx =
    stages.length > 0 ? Math.max(0, Math.min(prevStageIndex ?? clampedIdx, stages.length - 1)) : 0;
  const targetRatio = stages.length > 0 ? (clampedIdx + 1) / stages.length : 0;
  const startRatio = stages.length > 0 ? (clampedPrevIdx + 1) / stages.length : 0;
  const activeStage = stages[clampedIdx] || null;

  return `
    <section id="overview" aria-labelledby="overview-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden ${animateBattleEnter ? 'arena-enter' : ''}">
      <div class="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
            <button
              type="button"
              data-copy-text="${escapeHtml(battle.id)}"
              title="Copy Battle ID"
              class="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-slate-950 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
            >
              <span>${escapeHtml(battle.id)}</span>
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <rect x="6.5" y="6.5" width="9" height="9" rx="1.5"/>
                <path d="M4.5 12.5v-7a1 1 0 011-1h7"/>
              </svg>
            </button>
            <span aria-hidden="true">&middot;</span>
            <span>${escapeHtml(battle.targetApp)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${escapeHtml(battle.recordedLabel)}</span>
          </div>
          <h1 id="overview-heading" class="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ${escapeHtml(battle.title)}
          </h1>
          <p class="text-sm text-slate-600 max-w-3xl leading-relaxed">
            ${escapeHtml(battle.summary)}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0 pt-1">
          <div class="inline-flex items-center gap-1.5 text-sm font-semibold ${getToneTextClass(battle.outcomeTone)}">
            ${renderStatusIcon(battle.outcomeTone)}
            <span>Outcome: ${escapeHtml(battle.outcome)}</span>
          </div>
          ${recordedArchive && battle.isSample === false && battle.verification?.checks?.length
            ? `<button type="button" data-copy-label="Battle summary copied" data-copy-text="${escapeHtml(shareResult(battle))}" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">Copy battle summary</button>`
            : ''}
          <div class="text-xs text-slate-500 font-mono tabular-nums">
            Attempts: ${escapeHtml(battle.repairAttempts)} / ${escapeHtml(battle.maxAttempts)}
            <span aria-hidden="true">&middot;</span>
            Stages: ${stageCountCompleted}/${stages.length}
          </div>
        </div>
      </div>

      <div class="px-6 py-5 space-y-4">
        ${renderLiveRunner()}

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2.5">
              <h2 class="font-display text-sm font-semibold text-slate-900">
                Workflow Timeline
              </h2>
              <span class="font-mono text-[11px] text-slate-500 tabular-nums">
                Step ${clampedIdx + 1} / ${stages.length || 1}
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
              ${clampedIdx <= 0 ? 'disabled' : ''}
              class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              &larr; Prev
            </button>
            <button
              type="button"
              data-stage-replay="toggle"
              aria-pressed="${isReplayingStages ? 'true' : 'false'}"
              class="px-3 py-1 text-xs font-medium rounded border transition-all active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                isReplayingStages
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }"
            >
              ${isReplayingStages ? 'Pause replay' : 'Step replay'}
            </button>
            <button
              type="button"
              data-stage-nav="next"
              ${clampedIdx >= stages.length - 1 ? 'disabled' : ''}
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
          aria-valuemax="${Math.max(1, stages.length)}"
          aria-valuenow="${clampedIdx + 1}"
          class="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden"
        >
          <div
            id="workflow-stage-progress-fill"
            data-target-scale="${targetRatio.toFixed(4)}"
            class="h-full w-full bg-slate-900 arena-progress-fill"
            style="transform: scaleX(${startRatio.toFixed(4)});"
          ></div>
        </div>

        <ol class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          ${stages
            .map((stage, idx) => {
              const stepNum = String(idx + 1).padStart(2, '0');
              const isSelectedStage = idx === clampedIdx;
              const isVisitedStage = idx < clampedIdx;
              return `
                <li>
                  <button
                    type="button"
                    data-stage-index="${idx}"
                    aria-pressed="${isSelectedStage ? 'true' : 'false'}"
                    class="w-full h-full text-left border rounded-md p-3.5 flex flex-col justify-between gap-2.5 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                      isSelectedStage
                        ? 'border-slate-900 bg-white shadow-xs ring-1 ring-slate-900/10'
                        : isVisitedStage
                          ? 'border-slate-300 bg-white hover:border-slate-400'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }"
                  >
                    <div class="space-y-1 w-full">
                      <div class="flex items-center justify-between gap-2 text-xs">
                        <span class="font-mono tabular-nums ${isSelectedStage || isVisitedStage ? 'text-slate-900 font-semibold' : 'text-slate-500'}">${stepNum} &middot; ${escapeHtml(stage.actor)}</span>
                        <span class="inline-flex items-center gap-1 font-medium ${getToneTextClass(stage.state)}">
                          ${renderStatusIcon(stage.state)}
                          <span>${escapeHtml(stage.state)}</span>
                        </span>
                      </div>
                      <div class="font-display text-sm font-semibold text-slate-900">
                        ${escapeHtml(stage.label)}
                      </div>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">
                      ${escapeHtml(stage.note)}
                    </p>
                  </button>
                </li>
              `;
            })
            .join('')}
        </ol>

        ${
          activeStage
            ? `
            <div class="border border-slate-200 rounded-md bg-slate-50/70 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div class="space-y-0.5 min-w-0">
                <div class="text-xs font-semibold text-slate-900">
                  Recorded stage ${String(clampedIdx + 1).padStart(2, '0')}: ${escapeHtml(activeStage.actor)} &mdash; ${escapeHtml(activeStage.label)}
                </div>
                <p class="text-xs text-slate-600">
                  ${escapeHtml(activeStage.note)}
                </p>
              </div>
              <pre class="font-mono text-[11px] bg-slate-900 text-slate-100 px-3.5 py-2 rounded overflow-x-auto leading-relaxed shrink-0 max-w-full lg:max-w-xl">${escapeHtml(
                activeStage.traceSnippet || `SAMPLE recorded trace: ${activeStage.actor} (${activeStage.state}) — ${activeStage.note}`,
              )}</pre>
            </div>
          `
            : ''
        }
      </div>
    </section>
  `;
}

function renderHistorySection(allBattles, filteredBattles, selectedBattleId, { outcomeFilter, searchQuery }) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'success', label: 'Success' },
    { key: 'repair_failed', label: 'Repair Failed' },
    { key: 'pending_inspection', label: 'Pending Inspection' },
    { key: 'missing_evidence', label: 'Missing Evidence' },
  ];

  return `
    <section id="history" aria-labelledby="history-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="space-y-0.5">
          <h2 id="history-heading" class="font-display text-base font-semibold text-slate-900">
            Battle History
          </h2>
          <p class="text-xs text-slate-500">
            Showing <span class="font-mono tabular-nums text-slate-700">${filteredBattles.length}</span> of <span class="font-mono tabular-nums text-slate-700">${allBattles.length}</span> recorded battles. Select a row to inspect assertions and captures.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="relative">
            <label for="battle-search" class="sr-only">Filter battles by ID, fault family, or breaker</label>
            <input
              id="battle-search"
              type="search"
              value="${escapeHtml(searchQuery)}"
              placeholder="Filter ID or fault family..."
              class="w-full sm:w-56 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div role="group" aria-label="Filter battles by outcome" class="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200 overflow-x-auto">
            ${filters
              .map((f) => {
                const active = outcomeFilter === f.key;
                return `
                  <button
                    type="button"
                    data-outcome-filter="${escapeHtml(f.key)}"
                    aria-pressed="${active ? 'true' : 'false'}"
                    class="px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }"
                  >
                    ${escapeHtml(f.label)}
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>

      ${
        filteredBattles.length === 0
          ? `
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
        `
          : `
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
                ${filteredBattles
                  .map((row) => {
                    const isSelected = row.id === selectedBattleId;
                    const failOk = row.screenshots?.failure?.status === 'available';
                    const repairOk = row.screenshots?.repair?.status === 'available';
                    const captureSummary =
                      failOk && repairOk
                        ? '2 / 2 recorded'
                        : failOk || repairOk
                          ? '1 / 2 (missing)'
                          : '0 / 2 recorded';

                    return `
                      <tr
                        data-battle-row="${escapeHtml(row.id)}"
                        tabindex="0"
                        role="button"
                        aria-selected="${isSelected ? 'true' : 'false'}"
                        class="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 ${
                          isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                        }"
                      >
                        <td class="py-3 px-6 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                          ${isSelected ? '<span aria-hidden="true" class="mr-1.5 text-slate-900">&rsaquo;</span>' : ''}${escapeHtml(row.id)}
                        </td>
                        <td class="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                          ${escapeHtml(row.breaker)}
                        </td>
                        <td class="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                          ${escapeHtml(row.faultFamily)}
                        </td>
                        <td class="py-3 px-4 text-xs whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 font-medium ${getToneTextClass(row.outcomeTone)}">
                            ${renderStatusIcon(row.outcomeTone)}
                            <span>${escapeHtml(row.outcome)}</span>
                          </span>
                        </td>
                        <td class="py-3 px-4 text-xs font-mono text-slate-800 text-right whitespace-nowrap tabular-nums">
                          ${escapeHtml(row.repairAttempts)} / ${escapeHtml(row.maxAttempts)}
                        </td>
                        <td class="py-3 px-6 text-xs font-mono text-slate-600 text-right whitespace-nowrap tabular-nums">
                          ${escapeHtml(captureSummary)}
                        </td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `
      }
    </section>
  `;
}

function renderComparisonSection(battle) {
  const comparisons = Array.isArray(battle.comparisons) ? battle.comparisons : [];

  return `
    <section id="comparison" aria-labelledby="comparison-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="comparison-heading" class="font-display text-base font-semibold text-slate-900">
            Battle Detail: Expected vs. Actual Values
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Recorded assertions for <span class="font-mono text-slate-700">${escapeHtml(battle.id)}</span> across Kane CLI pre-repair and post-repair runs.
          </p>
        </div>
        <span class="text-xs text-slate-500 font-mono tabular-nums">
          ${comparisons.length} assertion${comparisons.length === 1 ? '' : 's'}
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
            ${comparisons
              .map((item) => {
                const tone = item.matched ? 'success' : 'danger';
                const statusText = item.matched ? 'Matched' : 'Unresolved';
                return `
                  <tr>
                    <td class="py-3.5 px-6 font-medium text-slate-900">
                      ${escapeHtml(item.check)}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-slate-800 bg-slate-50/40">
                      ${escapeHtml(item.expected)}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-rose-800">
                      ${escapeHtml(item.actualPreRepair)}
                    </td>
                    <td class="py-3.5 px-4 font-mono ${item.matched ? 'text-emerald-800' : 'text-amber-800'}">
                      ${escapeHtml(item.actualPostRepair)}
                    </td>
                    <td class="py-3.5 px-6 text-right whitespace-nowrap">
                      <span class="inline-flex items-center justify-end gap-1.5 font-medium ${getToneTextClass(tone)}">
                        ${renderStatusIcon(tone)}
                        <span>${statusText}</span>
                      </span>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderScreenshotCard(shot, slotLabel, battleId) {
  if (!shot || shot.status !== 'available' || !shot.url) {
    return `
      <div class="border border-amber-200 bg-amber-50/40 rounded-md flex flex-col justify-between h-full">
        <div class="px-4 py-3 border-b border-amber-200/80 flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-slate-900">${escapeHtml(slotLabel)}</span>
          <span class="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
            ${renderStatusIcon('warning')}
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
              ${escapeHtml(shot?.missingReason || 'Artifact file was not persisted by Kane CLI.')}
            </p>
          </div>
          <code class="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
            ${escapeHtml(shot?.artifactPath || `artifacts/${battleId}/missing.jpg`)}
          </code>
        </div>

        <div class="px-4 py-2.5 border-t border-amber-200/80 text-xs text-slate-600">
          ${escapeHtml(shot?.caption || 'Missing capture · SAMPLE (not live)')}
        </div>
      </div>
    `;
  }

  return `
    <figure class="border border-slate-200 bg-slate-50/40 rounded-md flex flex-col justify-between h-full overflow-hidden">
      <figcaption class="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-900 truncate">${escapeHtml(slotLabel)}</div>
          <div class="text-[11px] text-slate-500 truncate">${escapeHtml(shot.caption)}</div>
        </div>
        <button
          type="button"
          data-zoom-src="${escapeHtml(shot.url)}"
          data-zoom-title="${escapeHtml(slotLabel)}"
          data-zoom-subtitle="${escapeHtml(shot.caption)} · ${escapeHtml(shot.artifactPath)}"
          data-zoom-alt="${escapeHtml(shot.alt)}"
          class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          Inspect
        </button>
      </figcaption>

      <div class="p-3 flex-1 flex items-center justify-center bg-slate-100/70">
        <img
          src="${escapeHtml(shot.url)}"
          alt="${escapeHtml(shot.alt)}"
          referrerpolicy="no-referrer"
          loading="lazy"
          data-fallback-path="${escapeHtml(shot.artifactPath)}"
          class="w-full aspect-[4/3] object-cover rounded border border-slate-200 bg-white"
        />
      </div>

      <div class="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
        <span class="truncate">${escapeHtml(shot.artifactPath)}</span>
        <span class="whitespace-nowrap shrink-0">Recorded · Not live</span>
      </div>
    </figure>
  `;
}

function renderWipeComparison(failureShot, repairShot, wipePercent) {
  const pct = Math.max(0, Math.min(100, Number(wipePercent ?? 50)));

  return `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>Drag the divider or use the slider below to compare recorded failure vs. repair captures.</span>
        <span class="font-mono tabular-nums text-slate-800">Split position: ${Math.round(pct)}%</span>
      </div>

      <div
        id="arena-wipe-stage"
        class="arena-wipe-stage relative w-full max-w-4xl mx-auto aspect-[4/3] rounded-md border border-slate-200 overflow-hidden bg-slate-100 cursor-ew-resize"
      >
        <!-- Bottom layer: Repaired screenshot -->
        <img
          src="${escapeHtml(repairShot.url)}"
          alt="${escapeHtml(repairShot.alt)}"
          referrerpolicy="no-referrer"
          draggable="false"
          class="absolute inset-0 w-full h-full object-cover select-none"
        />

        <!-- Top clipped layer: Failure screenshot -->
        <div
          id="arena-wipe-overlay"
          class="absolute inset-0 overflow-hidden"
          style="clip-path: inset(0 ${100 - pct}% 0 0);"
        >
          <img
            src="${escapeHtml(failureShot.url)}"
            alt="${escapeHtml(failureShot.alt)}"
            referrerpolicy="no-referrer"
            draggable="false"
            class="absolute inset-0 w-full h-full object-cover select-none"
          />
        </div>

        <!-- Vertical divider handle -->
        <div
          id="arena-wipe-handle"
          class="absolute top-0 bottom-0 w-0.5 bg-slate-900 pointer-events-none"
          style="left: ${pct}%;"
        >
          <div class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-white shadow-md flex items-center justify-center">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 6l-3 4 3 4m6-8l3 4-3 4"/>
            </svg>
          </div>
        </div>

        <!-- Corner labels (unboxed text scrim) -->
        <div class="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-slate-900/85 text-white text-[11px] font-medium pointer-events-none">
          Failure capture &middot; ${failureShot.isSample ? 'SAMPLE (not live)' : 'Recorded (not live)'}
        </div>
        <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-slate-900/85 text-white text-[11px] font-medium pointer-events-none">
          Repair capture &middot; ${repairShot.isSample ? 'SAMPLE (not live)' : 'Recorded (not live)'}
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
          value="${Math.round(pct)}"
          class="w-full accent-slate-900 cursor-pointer"
        />
        <span class="text-[11px] font-mono text-slate-500 whitespace-nowrap">Repaired</span>
      </div>
    </div>
  `;
}

function renderScreenshotsSection(battle, { screenshotCompareMode = 'side_by_side', wipePercent = 50 } = {}) {
  const failureShot = battle.screenshots?.failure;
  const repairShot = battle.screenshots?.repair;
  const canWipe =
    failureShot?.status === 'available' &&
    Boolean(failureShot?.url) &&
    repairShot?.status === 'available' &&
    Boolean(repairShot?.url);

  const effectiveMode = canWipe ? screenshotCompareMode : 'side_by_side';

  return `
    <section aria-labelledby="screenshots-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 id="screenshots-heading" class="font-display text-base font-semibold text-slate-900">
            Side-by-Side Recorded Kane Screenshots
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Static recorded artifacts from Kane CLI runs for <span class="font-mono text-slate-700">${escapeHtml(battle.id)}</span>. Captures are historical records, not live streams.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          ${
            canWipe
              ? `
              <div role="group" aria-label="Screenshot comparison mode" class="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
                <button
                  type="button"
                  data-compare-mode="side_by_side"
                  aria-pressed="${effectiveMode === 'side_by_side' ? 'true' : 'false'}"
                  class="px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                    effectiveMode === 'side_by_side'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  data-compare-mode="wipe"
                  aria-pressed="${effectiveMode === 'wipe' ? 'true' : 'false'}"
                  class="px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                    effectiveMode === 'wipe'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  Overlay Wipe
                </button>
              </div>
            `
              : `<span class="text-xs font-medium text-slate-600 whitespace-nowrap">Recorded captures &middot; ${battle.isSample ? 'SAMPLE' : 'Archive'}</span>`
          }
        </div>
      </div>

      <div class="p-6">
        ${
          effectiveMode === 'wipe'
            ? renderWipeComparison(failureShot, repairShot, wipePercent)
            : `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              ${renderScreenshotCard(failureShot, '1. Kane Failure Capture (Pre-Repair)', battle.id)}
              ${renderScreenshotCard(repairShot, '2. Kane Verification Capture (Post-Repair)', battle.id)}
            </div>
          `
        }
      </div>
    </section>
  `;
}

function renderVerificationSection(battle) {
  const v = battle.verification || {};
  const checks = Array.isArray(v.checks) ? v.checks : [];
  const ids = v.identifiers || {};

  const identifierRows = [
    ['Battle ID', ids.battleId],
    ['Gemini Proposal ID', ids.geminiProposalId],
    ['Arena Validation ID', ids.arenaValidationId],
    ['Kane Failure Run ID', ids.kaneBreakRunId],
    ['Codex Repair Patch ID', ids.codexRepairId],
    ['Kane Verify Run ID', ids.kaneVerifyRunId],
    ['SQLite Row Key', ids.sqliteRowKey],
  ];

  return `
    <section id="verification" aria-labelledby="verification-heading" class="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
      <div class="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="verification-heading" class="font-display text-base font-semibold text-slate-900">
            Verification Details &amp; Execution Identifiers
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            ${escapeHtml(v.checksSummary || 'Expand sections below to inspect Kane CLI assertions, logs, and execution identifiers.')}
          </p>
        </div>
        <div class="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
          Exit codes: before ${escapeHtml(v.kaneExitCodeBefore)} &rarr; after ${escapeHtml(v.kaneExitCodeAfter)}
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
          <span class="text-xs font-mono text-slate-500 tabular-nums">${checks.length} checks</span>
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
                ${checks
                  .map(
                    (c) => `
                    <tr>
                      <td class="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">${escapeHtml(c.id)}</td>
                      <td class="py-2.5 px-4 font-mono text-slate-700">
                        <div class="flex items-center justify-between gap-2">
                          <span>${escapeHtml(c.command)}</span>
                          <button
                            type="button"
                            data-copy-text="${escapeHtml(c.command)}"
                            class="px-2 py-0.5 text-[11px] font-sans font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td class="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">${escapeHtml(c.result)}</td>
                      <td class="py-2.5 px-4 text-slate-600">${escapeHtml(c.detail)}</td>
                    </tr>
                  `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="space-y-1.5">
            <div class="text-xs font-medium text-slate-700">${battle.isSample ? 'Recorded stdout excerpt (SAMPLE)' : 'Sanitized recorded event summary'}</div>
            <pre class="font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto leading-relaxed">${escapeHtml(v.stdoutExcerpt || 'No stdout recorded.')}</pre>
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
          <span class="text-xs font-mono text-slate-500 tabular-nums">${identifierRows.length} identifiers</span>
        </summary>

        <div class="px-6 pb-5 pt-2">
          <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 border border-slate-200 rounded-md p-4 bg-slate-50/50">
            ${identifierRows
              .map(
                ([label, val]) => `
                <div class="space-y-0.5 min-w-0">
                  <dt class="text-xs text-slate-500">${escapeHtml(label)}</dt>
                  <dd class="flex items-center justify-between gap-2 font-mono text-xs font-medium text-slate-900 tabular-nums">
                    <span class="truncate">${escapeHtml(val || '—')}</span>
                    ${
                      val
                        ? `<button type="button" data-copy-text="${escapeHtml(val)}" class="px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded transition-colors shrink-0">Copy</button>`
                        : ''
                    }
                  </dd>
                </div>
              `,
              )
              .join('')}
          </dl>
        </div>
      </details>
    </section>
  `;
}

export function renderBattleFilterBar({ payload, outcomeFilter, counts, filteredCount }) {
  const isReady = payload.status === 'ready' && Array.isArray(payload.battles) && payload.battles.length > 0;
  const viewTabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'success', label: 'Success', count: counts.success },
    { key: 'repair_failed', label: 'Repair Failed', count: counts.repair_failed },
    { key: 'pending_inspection', label: 'Pending Inspection', count: counts.pending_inspection },
  ];

  const activeTab = viewTabs.find((t) => t.key === outcomeFilter);
  const summaryText = !isReady
    ? 'Battle history filters unavailable in current state'
    : activeTab
      ? `Showing ${filteredCount} of ${counts.all} battles (${activeTab.label})`
      : `Showing ${filteredCount} of ${counts.all} battles`;

  return `
    <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-xs font-medium text-slate-600 whitespace-nowrap">Battle history view:</span>
        <div role="group" aria-label="Toggle battle history view" class="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
          ${viewTabs
            .map((tab) => {
              const isActive = outcomeFilter === tab.key;
              return `
                <button
                  type="button"
                  data-outcome-filter="${escapeHtml(tab.key)}"
                  aria-pressed="${isActive ? 'true' : 'false'}"
                  ${isReady ? '' : 'disabled'}
                  class="px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                    !isReady
                      ? 'text-slate-400 cursor-not-allowed'
                      : isActive
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  <span>${escapeHtml(tab.label)}</span>
                  <span class="ml-1.5 font-mono text-[11px] tabular-nums ${isActive ? 'text-slate-700' : 'text-slate-500'}">${tab.count}</span>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <div class="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
        ${escapeHtml(summaryText)}
      </div>
    </div>
  `;
}

function renderProjectSetup() {
  return `<section id="project-setup-panel" class="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
    <h2 class="font-display text-lg font-semibold text-slate-900">Start a full battle</h2>
    <p class="text-sm text-slate-600">Choose a demo to see what Kane will check, or import a supported source ZIP.</p>
    <div class="flex flex-wrap items-center gap-3">
      <button id="project-seatpilot" type="button" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">Try SeatPilot ticket booking</button>
      <button id="project-builtin" type="button" class="rounded border border-slate-300 px-3 py-2 text-xs font-medium">Use built-in BreakShop</button>
      <input id="project-zip" type="file" accept=".zip,application/zip" aria-label="Project source ZIP" class="text-sm text-slate-700">
      <button id="project-import" type="button" class="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Import ZIP</button>
    </div>
    <p id="project-status" role="status" class="text-sm text-slate-600">Checking local setup...</p>
    <p id="project-prerequisites" class="text-xs text-slate-500"></p>
    <details class="rounded border border-slate-200 p-3">
      <summary class="cursor-pointer text-sm font-medium">Review the acceptance test before approval</summary>
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
  </section>`;
}

function renderLiveRunner() {
  return `        <!-- Live Kane Execution & Chrome Demo Window Panel -->
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

`;
}

export function renderArenaDashboard(state) {
  const {
    payload,
    activePreviewKey,
    filteredBattles,
    selectedBattle,
    outcomeFilter,
    searchQuery,
    selectedStageIndex,
    prevStageIndex,
    animateBattleEnter,
    isReplayingStages,
    screenshotCompareMode,
    wipePercent,
  } = state;

  const parts = [renderWorkspaceBanner(payload, activePreviewKey), ...(activePreviewKey === 'archive' ? [renderProjectSetup()] : [])];

  if (payload.status === 'loading') {
    parts.push(renderLoadingState());
    return parts.join('\n');
  }

  if (payload.status === 'error') {
    parts.push(renderInfraErrorState(payload.error));
    return parts.join('\n');
  }

  if (payload.status === 'empty' || !Array.isArray(payload.battles) || payload.battles.length === 0) {
    if (activePreviewKey === 'archive') parts.push(renderLiveRunner());
    parts.push(renderEmptyState());
    return parts.join('\n');
  }

  const activeBattle = selectedBattle || payload.battles[0];

  parts.push(
    renderOverviewSection(activeBattle, {
      recordedArchive: activePreviewKey === 'archive' && payload.mode === 'live_archive' && payload.isSample === false,
      selectedStageIndex,
      prevStageIndex,
      isReplayingStages,
      animateBattleEnter,
    }),
  );
  parts.push(
    renderHistorySection(payload.battles, filteredBattles, activeBattle.id, {
      outcomeFilter,
      searchQuery,
    }),
  );
  parts.push(renderComparisonSection(activeBattle));
  parts.push(renderScreenshotsSection(activeBattle, { screenshotCompareMode, wipePercent }));
  parts.push(renderVerificationSection(activeBattle));

  return parts.join('\n');
}
