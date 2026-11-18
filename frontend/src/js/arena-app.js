/**
 * BuildBreak Arena — Lightweight Vanilla JS Controller
 *
 * Binds read-only UI interactions:
 * - Preview state switcher & top Battle History filter bar
 * - Interactive recorded workflow stage inspector & step-replay
 * - Side-by-side & interactive Overlay Wipe screenshot comparison
 * - One-click copy feedback, keyboard shortcuts, and JSON export
 */

import {
  readInjectedPayload,
  getPreviewPayload,
  filterBattles,
  countBattlesByView,
  resolveSelectedBattle,
} from './arena-store.js';
import { renderArenaDashboard, renderBattleFilterBar, escapeHtml } from './arena-renderer.js';
import { createArenaSoundEngine } from './arena-sound.js';

export function initArenaDashboard() {
  const filterBarEl = document.getElementById('battle-filter-bar');
  const mainEl = document.getElementById('arena-main');
  const footerSourceEl = document.getElementById('footer-data-source');
  const exportBtn = document.getElementById('export-json-btn');
  const toastEl = document.getElementById('arena-toast');
  const soundToggleBtn = document.getElementById('footer-sound-toggle');
  const soundIconOff = document.getElementById('footer-sound-icon-off');
  const soundIconOn = document.getElementById('footer-sound-icon-on');
  const soundLabelEl = document.getElementById('footer-sound-label');
  const schemaToggleBtn = document.getElementById('footer-schema-toggle');
  const schemaModal = document.getElementById('schema-modal');
  const schemaModalClose = document.getElementById('schema-modal-close');
  const shortcutsToggleBtn = document.getElementById('footer-shortcuts-toggle');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const shortcutsModalClose = document.getElementById('shortcuts-modal-close');
  const shotModal = document.getElementById('screenshot-modal');
  const shotModalClose = document.getElementById('screenshot-modal-close');
  const shotModalImg = document.getElementById('screenshot-modal-img');
  const shotModalTitle = document.getElementById('screenshot-modal-title');
  const shotModalSubtitle = document.getElementById('screenshot-modal-subtitle');

  if (!mainEl) return;

  const sound = createArenaSoundEngine();

  function syncSoundToggleUi() {
    if (!soundToggleBtn) return;
    const active = sound.isEnabled();
    soundToggleBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (soundLabelEl) soundLabelEl.textContent = active ? 'Sound: On' : 'Sound: Muted';
    if (soundIconOff) soundIconOff.classList.toggle('hidden', active);
    if (soundIconOn) soundIconOn.classList.toggle('hidden', !active);
    soundToggleBtn.classList.toggle('text-slate-900', active);
    soundToggleBtn.classList.toggle('font-medium', active);
    soundToggleBtn.classList.toggle('text-slate-600', !active);
  }

  const state = {
    payload: readInjectedPayload(),
    activePreviewKey: readInjectedPayload().isSample ? 'historical_demo' : 'archive',
    selectedBattleId: null,
    outcomeFilter: 'all',
    searchQuery: '',
    selectedStageIndex: 0,
    isReplayingStages: false,
    screenshotCompareMode: 'side_by_side',
    wipePercent: 50,
  };

  state.selectedBattleId = state.payload.activeBattleId || null;

  let replayTimerId = null;
  let toastTimerId = null;
  let isDraggingWipe = false;
  let lastRenderedBattleId = null;
  let lastRenderedStageIndex = 0;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    if (toastTimerId) clearTimeout(toastTimerId);
    toastTimerId = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 1800);
  }

  function stopStageReplay() {
    if (replayTimerId) {
      clearInterval(replayTimerId);
      replayTimerId = null;
    }
    state.isReplayingStages = false;
  }

  function getActiveBattle() {
    const filteredBattles = filterBattles(state.payload.battles, {
      outcomeFilter: state.outcomeFilter,
      searchQuery: state.searchQuery,
    });
    return resolveSelectedBattle(
      filteredBattles.length > 0 ? filteredBattles : state.payload.battles,
      state.selectedBattleId,
    );
  }

  function toggleStageReplay() {
    if (state.isReplayingStages) {
      stopStageReplay();
      render();
      return;
    }

    const activeBattle = getActiveBattle();
    const stageCount = activeBattle?.stages?.length || 0;
    if (stageCount <= 1) return;

    state.isReplayingStages = true;
    if (state.selectedStageIndex >= stageCount - 1) {
      state.selectedStageIndex = 0;
    }
    render();

    replayTimerId = setInterval(() => {
      const currentBattle = getActiveBattle();
      const count = currentBattle?.stages?.length || 0;
      if (!currentBattle || state.selectedStageIndex >= count - 1) {
        stopStageReplay();
        render();
        return;
      }
      state.selectedStageIndex += 1;
      sound.play('nav');
      render();
    }, 1400);
  }

  function updateWipeVisuals(nextPct) {
    const clamped = Math.max(0, Math.min(100, nextPct));
    state.wipePercent = clamped;

    const overlay = document.getElementById('arena-wipe-overlay');
    const handle = document.getElementById('arena-wipe-handle');
    const range = document.getElementById('arena-wipe-range');
    const stage = document.getElementById('arena-wipe-stage');

    if (overlay) {
      overlay.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    }
    if (handle) {
      handle.style.left = `${clamped}%`;
    }
    if (range instanceof HTMLInputElement) {
      range.value = String(Math.round(clamped));
    }
    if (stage && stage.previousElementSibling) {
      const pctLabel = stage.previousElementSibling.querySelector('.font-mono');
      if (pctLabel) {
        pctLabel.textContent = `Split position: ${Math.round(clamped)}%`;
      }
    }
  }

  function applyOutcomeFilter(nextFilter) {
    stopStageReplay();
    if (nextFilter !== state.outcomeFilter) {
      sound.play('filter');
    }
    state.outcomeFilter = nextFilter;
    const nextFiltered = filterBattles(state.payload.battles, {
      outcomeFilter: state.outcomeFilter,
      searchQuery: state.searchQuery,
    });
    if (nextFiltered.length > 0 && !nextFiltered.some((b) => b.id === state.selectedBattleId)) {
      state.selectedBattleId = nextFiltered[0].id;
      state.selectedStageIndex = 0;
    }
    render();
  }

  function selectBattle(nextId) {
    if (!nextId || nextId === state.selectedBattleId) return;
    stopStageReplay();
    sound.play('nav');
    state.selectedBattleId = nextId;
    state.selectedStageIndex = 0;
    render();
  }

  function render() {
    const filteredBattles = filterBattles(state.payload.battles, {
      outcomeFilter: state.outcomeFilter,
      searchQuery: state.searchQuery,
    });

    const counts = countBattlesByView(state.payload.battles);

    if (
      filteredBattles.length > 0 &&
      state.selectedBattleId &&
      !filteredBattles.some((b) => b.id === state.selectedBattleId)
    ) {
      state.selectedBattleId = filteredBattles[0].id;
      state.selectedStageIndex = 0;
    }

    const selectedBattle = resolveSelectedBattle(
      filteredBattles.length > 0 ? filteredBattles : state.payload.battles,
      state.selectedBattleId,
    );

    if (filterBarEl) {
      filterBarEl.innerHTML = renderBattleFilterBar({
        payload: state.payload,
        outcomeFilter: state.outcomeFilter,
        counts,
        filteredCount: filteredBattles.length,
      });
    }

    // Preserve active search input caret if user is currently typing
    const activeEl = document.activeElement;
    const wasSearchFocused = activeEl && activeEl.id === 'battle-search';
    const selStart = wasSearchFocused ? activeEl.selectionStart : null;
    const selEnd = wasSearchFocused ? activeEl.selectionEnd : null;

    const activeBattleId = selectedBattle ? selectedBattle.id : null;
    const sameBattle = activeBattleId !== null && activeBattleId === lastRenderedBattleId;
    const prevStageIndex = sameBattle ? lastRenderedStageIndex : 0;

    const livePanel = document.getElementById('live-kane-panel');
    const projectPanel = document.getElementById('project-setup-panel');
    mainEl.innerHTML = renderArenaDashboard({
      payload: state.payload,
      activePreviewKey: state.activePreviewKey,
      filteredBattles,
      selectedBattle,
      outcomeFilter: state.outcomeFilter,
      searchQuery: state.searchQuery,
      selectedStageIndex: state.selectedStageIndex,
      prevStageIndex,
      animateBattleEnter: !sameBattle,
      isReplayingStages: state.isReplayingStages,
      screenshotCompareMode: state.screenshotCompareMode,
      wipePercent: state.wipePercent,
    });

    const newLivePanel = document.getElementById('live-kane-panel');
    if (livePanel && newLivePanel) newLivePanel.replaceWith(livePanel);
    const newProjectPanel = document.getElementById('project-setup-panel');
    if (projectPanel && newProjectPanel) newProjectPanel.replaceWith(projectPanel);

    lastRenderedBattleId = activeBattleId;
    lastRenderedStageIndex = state.selectedStageIndex;

    const progressFill = document.getElementById('workflow-stage-progress-fill');
    if (progressFill) {
      const targetScale = progressFill.getAttribute('data-target-scale');
      if (targetScale) {
        // Force style flush so CSS transform transition interpolates from prevStageIndex
        void progressFill.offsetWidth;
        requestAnimationFrame(() => {
          progressFill.style.transform = `scaleX(${targetScale})`;
        });
      }
    }

    if (footerSourceEl) {
      footerSourceEl.textContent = `Source: ${state.payload.dataSourceLabel || 'BuildBreak Arena dataset'}`;
    }

    // Attach resilient image fallback handlers (Zero-Broken-Image Policy)
    const imgs = mainEl.querySelectorAll('img[data-fallback-path]');
    imgs.forEach((img) => {
      img.addEventListener('error', () => {
        const pathLabel = img.getAttribute('data-fallback-path') || 'artifact.jpg';
        const fallback = document.createElement('div');
        fallback.className =
          'w-full aspect-[4/3] rounded border border-amber-200 bg-amber-50/60 flex flex-col items-center justify-center p-4 text-center gap-2';
        fallback.innerHTML = `
          <span class="text-xs font-semibold text-amber-900">Capture preview unavailable</span>
          <code class="text-[11px] font-mono text-slate-600">${escapeHtml(pathLabel)}</code>
        `;
        img.replaceWith(fallback);
      });
    });

    if (wasSearchFocused) {
      const searchInput = document.getElementById('battle-search');
      if (searchInput) {
        searchInput.focus();
        if (typeof selStart === 'number' && typeof selEnd === 'number') {
          searchInput.setSelectionRange(selStart, selEnd);
        }
      }
    }
  }

  function openScreenshotModal({ src, title, subtitle, alt }) {
    if (!shotModal || !shotModalImg) return;
    shotModalImg.src = src;
    shotModalImg.alt = alt || title || 'Recorded Kane CLI screenshot';
    if (shotModalTitle) shotModalTitle.textContent = title || 'Recorded capture preview';
    if (shotModalSubtitle) shotModalSubtitle.textContent = subtitle || '';
    shotModal.classList.remove('hidden');
  }

  function closeScreenshotModal() {
    if (!shotModal || !shotModalImg) return;
    shotModal.classList.add('hidden');
    shotModalImg.src = '';
  }

  function openSchemaModal() {
    if (schemaModal) schemaModal.classList.remove('hidden');
  }

  function closeSchemaModal() {
    if (schemaModal) schemaModal.classList.add('hidden');
  }

  function openShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.remove('hidden');
  }

  function closeShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.add('hidden');
  }

  if (filterBarEl) {
    filterBarEl.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const filterBtn = target.closest('[data-outcome-filter]');
      if (filterBtn && !filterBtn.hasAttribute('disabled')) {
        const nextFilter = filterBtn.getAttribute('data-outcome-filter') || 'all';
        applyOutcomeFilter(nextFilter);
      }
    });
  }

  // Event delegation on main container
  mainEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const copyBtn = target.closest('[data-copy-text]');
    if (copyBtn) {
      const text = copyBtn.getAttribute('data-copy-text');
      if (text && navigator.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            sound.play('copy');
            showToast(`Copied "${text}"`);
          })
          .catch(() => showToast('Copy unavailable in this browser context'));
      }
      return;
    }

    const previewBtn = target.closest('[data-preview-state]');
    if (previewBtn) {
      const nextKey = previewBtn.getAttribute('data-preview-state');
      if (nextKey) {
        stopStageReplay();
        sound.play(nextKey === 'infra_error' || nextKey === 'missing_evidence' ? 'error' : 'filter');
        state.activePreviewKey = nextKey;
        state.payload = getPreviewPayload(nextKey);
        state.selectedBattleId = state.payload.activeBattleId || null;
        state.selectedStageIndex = 0;
        state.outcomeFilter = 'all';
        state.searchQuery = '';
        render();
      }
      return;
    }

    const filterBtn = target.closest('[data-outcome-filter]');
    if (filterBtn) {
      const nextFilter = filterBtn.getAttribute('data-outcome-filter') || 'all';
      applyOutcomeFilter(nextFilter);
      return;
    }

    const stageBtn = target.closest('[data-stage-index]');
    if (stageBtn) {
      stopStageReplay();
      const idx = Number(stageBtn.getAttribute('data-stage-index'));
      if (!Number.isNaN(idx)) {
        sound.play('nav');
        state.selectedStageIndex = idx;
        render();
      }
      return;
    }

    const stageNavBtn = target.closest('[data-stage-nav]');
    if (stageNavBtn && !stageNavBtn.hasAttribute('disabled')) {
      stopStageReplay();
      const dir = stageNavBtn.getAttribute('data-stage-nav');
      const activeBattle = getActiveBattle();
      const maxIdx = (activeBattle?.stages?.length || 1) - 1;
      if (dir === 'prev') {
        state.selectedStageIndex = Math.max(0, state.selectedStageIndex - 1);
      } else if (dir === 'next') {
        state.selectedStageIndex = Math.min(maxIdx, state.selectedStageIndex + 1);
      }
      sound.play('nav');
      render();
      return;
    }

    const replayBtn = target.closest('[data-stage-replay]');
    if (replayBtn) {
      sound.play('nav');
      toggleStageReplay();
      return;
    }

    const compareBtn = target.closest('[data-compare-mode]');
    if (compareBtn) {
      const nextMode = compareBtn.getAttribute('data-compare-mode');
      if (nextMode === 'side_by_side' || nextMode === 'wipe') {
        if (nextMode !== state.screenshotCompareMode) {
          sound.play('filter');
        }
        state.screenshotCompareMode = nextMode;
        render();
      }
      return;
    }

    const actionBtn = target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      if (action === 'clear-filters') {
        sound.play('filter');
        state.outcomeFilter = 'all';
        state.searchQuery = '';
        render();
      } else if (action === 'reload-payload') {
        stopStageReplay();
        sound.play('filter');
        state.activePreviewKey = 'archive';
        state.payload = readInjectedPayload();
        state.selectedBattleId = state.payload.activeBattleId || null;
        state.selectedStageIndex = 0;
        render();
      }
      return;
    }

    const zoomBtn = target.closest('[data-zoom-src]');
    if (zoomBtn) {
      sound.play('nav');
      openScreenshotModal({
        src: zoomBtn.getAttribute('data-zoom-src') || '',
        title: zoomBtn.getAttribute('data-zoom-title') || '',
        subtitle: zoomBtn.getAttribute('data-zoom-subtitle') || '',
        alt: zoomBtn.getAttribute('data-zoom-alt') || '',
      });
      return;
    }

    const battleRow = target.closest('[data-battle-row]');
    if (battleRow) {
      const nextId = battleRow.getAttribute('data-battle-row');
      selectBattle(nextId);
    }
  });

  // Interactive pointer scrubbing on wipe stage
  mainEl.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const stage = target.closest('#arena-wipe-stage');
    if (!stage) return;
    isDraggingWipe = true;
    const rect = stage.getBoundingClientRect();
    const pct = ((event.clientX - rect.left) / rect.width) * 100;
    updateWipeVisuals(pct);
  });

  window.addEventListener('pointermove', (event) => {
    if (!isDraggingWipe) return;
    const stage = document.getElementById('arena-wipe-stage');
    if (!stage) {
      isDraggingWipe = false;
      return;
    }
    const rect = stage.getBoundingClientRect();
    const pct = ((event.clientX - rect.left) / rect.width) * 100;
    updateWipeVisuals(pct);
  });

  window.addEventListener('pointerup', () => {
    isDraggingWipe = false;
  });

  mainEl.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      const battleRow = target.closest('[data-battle-row]');
      if (battleRow) {
        event.preventDefault();
        const nextId = battleRow.getAttribute('data-battle-row');
        selectBattle(nextId);
      }
    }
  });

  mainEl.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.id === 'battle-search') {
      state.searchQuery = target.value;
      render();
    } else if (target.id === 'arena-wipe-range') {
      updateWipeVisuals(Number(target.value));
    }
  });

  // Top bar read-only Export JSON action
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buildbreak-arena-${state.activePreviewKey}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      sound.play('copy');
      showToast('Exported JSON snapshot');
    });
  }

  // Footer sound toggle (default muted)
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      sound.toggle();
      syncSoundToggleUi();
    });
  }
  syncSoundToggleUi();

  // Top nav links soft sound feedback
  document.querySelectorAll('header nav a').forEach((navLink) => {
    navLink.addEventListener('click', () => sound.play('nav'));
  });

  // Modals
  if (shotModalClose) shotModalClose.addEventListener('click', closeScreenshotModal);
  if (shotModal) {
    shotModal.addEventListener('click', (e) => {
      if (e.target === shotModal) closeScreenshotModal();
    });
  }

  if (schemaToggleBtn) schemaToggleBtn.addEventListener('click', openSchemaModal);
  if (schemaModalClose) schemaModalClose.addEventListener('click', closeSchemaModal);
  if (schemaModal) {
    schemaModal.addEventListener('click', (e) => {
      if (e.target === schemaModal) closeSchemaModal();
    });
  }

  if (shortcutsToggleBtn) shortcutsToggleBtn.addEventListener('click', openShortcutsModal);
  if (shortcutsModalClose) shortcutsModalClose.addEventListener('click', closeShortcutsModal);
  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) closeShortcutsModal();
    });
  }

  // Global developer keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeScreenshotModal();
      closeSchemaModal();
      closeShortcutsModal();
      return;
    }

    const active = document.activeElement;
    const isTyping =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement;

    if (isTyping) return;

    if (e.key === '?') {
      e.preventDefault();
      if (shortcutsModal && shortcutsModal.classList.contains('hidden')) {
        openShortcutsModal();
      } else {
        closeShortcutsModal();
      }
      return;
    }

    if (e.key === '/') {
      const searchInput = document.getElementById('battle-search');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
      return;
    }

    if (state.payload.status !== 'ready') return;

    if (e.key === '1') applyOutcomeFilter('all');
    else if (e.key === '2') applyOutcomeFilter('success');
    else if (e.key === '3') applyOutcomeFilter('repair_failed');
    else if (e.key === '4') applyOutcomeFilter('pending_inspection');
    else if (e.key === '[' || e.key === ']') {
      const activeBattle = getActiveBattle();
      const maxIdx = (activeBattle?.stages?.length || 1) - 1;
      stopStageReplay();
      state.selectedStageIndex =
        e.key === '['
          ? Math.max(0, state.selectedStageIndex - 1)
          : Math.min(maxIdx, state.selectedStageIndex + 1);
      sound.play('nav');
      render();
    } else if (e.key === 'j' || e.key === 'k') {
      const filteredBattles = filterBattles(state.payload.battles, {
        outcomeFilter: state.outcomeFilter,
        searchQuery: state.searchQuery,
      });
      if (filteredBattles.length <= 1) return;
      const currentIdx = filteredBattles.findIndex((b) => b.id === state.selectedBattleId);
      const nextIdx =
        e.key === 'j'
          ? (currentIdx + 1) % filteredBattles.length
          : (currentIdx - 1 + filteredBattles.length) % filteredBattles.length;
      selectBattle(filteredBattles[nextIdx].id);
    }
  });

  // Genuine local Kane monitor. Reading this stream never starts a test.
  let liveEventSource = null;
  let liveTimerInterval = null;
  let liveStartTime = null;
  let projectRunActive = false;
  let followedBattle = null;

  function appendLiveLog(text, colorClass = 'text-slate-300') {
    const feed = document.getElementById('live-console-feed');
    if (!feed) return;
    const row = document.createElement('div');
    row.className = `${colorClass} truncate`;
    row.textContent = text;
    feed.appendChild(row);
    while (feed.children.length > 150) feed.firstElementChild.remove();
    feed.scrollTop = feed.scrollHeight;
  }

  function setRunButton(running) {
    const btn = document.getElementById('btn-run-kane-live');
    if (btn) {
      btn.disabled = running;
      btn.classList.toggle('opacity-50', running);
      btn.classList.toggle('cursor-not-allowed', running);
    }
  }

  function showLiveScreenshot(url, live = false) {
    // Only opaque local image routes; never a browser-control endpoint.
    const pattern = live
      ? /^\/api\/kane\/live-view\?session=\d{8}T\d{6}-[a-f0-9]{8}$/
      : /^\/api\/kane\/screenshot\?session=\d{8}T\d{6}-[a-f0-9]{8}$/;
    if (typeof url !== 'string' || !pattern.test(url)) return;
    const img = document.getElementById('live-stream-img');
    if (img) {
      img.src = url;
      img.alt = live ? 'Live viewport of the isolated Chrome controlled by Kane' : 'Verified recorded Kane evidence screenshot';
      img.classList.remove('hidden');
      document.getElementById('live-stream-placeholder')?.classList.add('hidden');
      const label = document.getElementById('live-view-label');
      if (label) label.textContent = live ? 'LIVE - observer view, not a verdict' : 'RECORDED - verified evidence';
    }
  }

  function clearLiveView(message = 'Waiting for the isolated Kane browser...') {
    const img = document.getElementById('live-stream-img');
    if (img) { img.removeAttribute('src'); img.classList.add('hidden'); }
    document.getElementById('live-stream-placeholder')?.classList.remove('hidden');
    const label = document.getElementById('live-view-label');
    if (label) label.textContent = message;
  }

  async function followFullBattle(id) {
    if (typeof id !== 'string' || !/^\d{8}T\d{6}-[a-f0-9]{8}$/.test(id) || followedBattle === id) return;
    followedBattle = id;
    projectText('project-status',`Full battle ${id} is running. Live view and history refer to this run.`);
    try {
      const response = await fetch(`/arena/data?battle=${id}`,{cache:'no-store'});
      if (!response.ok) return;
      const payload = await response.json();
      state.payload = payload;
      state.activePreviewKey = 'archive';
      state.selectedBattleId = id;
      state.selectedStageIndex = 0;
      render();
    } catch (_) { appendLiveLog('History refresh unavailable. The run continues; reload to reconnect.'); }
  }

  function handleLiveKaneEvent(event) {
    if (['.testmuai/tests/CheckoutConsistency_test.md','.testmuai/tests/SeatPilotBooking_test.md'].includes(event.test_path)) {
      const field = document.getElementById('live-test-path');
      if (field) field.value = event.test_path;
    }
    if (event.type === 'battle') {
      followFullBattle(event.battle_id);
    } else if (event.type === 'snapshot') {
      if (event.battle_id) followFullBattle(event.battle_id);
      if (event.started_at) liveStartTime = event.started_at * 1000;
      handleLiveKaneEvent({type: 'status', status: event.status, message: event.message});
      if (event.phase) appendLiveLog(`Kane phase: ${event.phase}`, 'text-cyan-300');
      if (event.current_step) handleLiveKaneEvent({type: 'step_start', step_index: event.current_step});
      if (event.live_view_url && event.status === 'running') showLiveScreenshot(event.live_view_url, true);
      else if (event.latest_screenshot) showLiveScreenshot(event.latest_screenshot);
      for (const step of event.steps || []) appendLiveLog(`Step ${step.index}: ${step.status}`);
    } else if (event.type === 'status') {
      const running = event.status === 'running';
      const passed = event.status === 'passed';
      const idle = event.status === 'idle';
      const badge = document.getElementById('live-status-badge');
      const dot = document.getElementById('live-status-dot');
      if (badge) {
        badge.textContent = idle ? 'Ready' : String(event.status).toUpperCase();
        badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded font-medium ' +
          (running || passed ? 'bg-emerald-900/60 text-emerald-300' : idle ? 'bg-slate-800 text-slate-300' : 'bg-rose-700 text-white');
      }
      if (dot) dot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 ' +
        (running || passed ? 'bg-emerald-400' : idle ? 'bg-slate-400' : 'bg-rose-500');
      document.getElementById('live-status-pulse')?.classList.toggle('hidden', !running);
      setRunButton(running);
      projectRunActive = running;
      updateProjectStart();
      if (!running && followedBattle) projectText('project-status', `Battle ${followedBattle}: ${event.message || event.status}`);
      clearInterval(liveTimerInterval);
      if (running) {
        liveStartTime ||= Date.now();
        liveTimerInterval = setInterval(() => {
          const timer = document.getElementById('live-timer');
          const secs = Math.floor((Date.now() - liveStartTime) / 1000);
          if (timer) timer.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
        }, 1000);
      } else {
        liveEventSource?.close();
      }
      if (event.message) appendLiveLog(event.message, 'text-amber-300');
    } else if (event.type === 'step_start') {
      const pill = document.getElementById('live-step-pill');
      if (pill) {
        pill.classList.remove('hidden');
        pill.textContent = `Kane step ${event.step_index}`;
      }
      appendLiveLog(`Step ${event.step_index}: running`, 'text-emerald-400');
    } else if (event.type === 'step_end') {
      appendLiveLog(`Step ${event.step_index}: ${event.status}`, event.status === 'passed' ? 'text-emerald-400' : 'text-amber-300');
    } else if (event.type === 'phase') {
      appendLiveLog(`Kane phase: ${event.phase} (attempt ${event.attempt})`, 'text-cyan-300');
    } else if (event.type === 'progress') {
      appendLiveLog(event.message, 'text-cyan-300');
    } else if (event.type === 'live_view') {
      if (event.state === 'ready' && event.url) showLiveScreenshot(event.url, true);
      else clearLiveView(event.state === 'ended' ? 'Live view ended - verifying evidence...' : 'Waiting for the local demo viewport...');
    } else if (event.type === 'screenshot') {
      showLiveScreenshot(event.url);
    }
  }

  function connectKaneStream() {
    liveEventSource?.close();
    liveEventSource = new EventSource('/api/kane/stream');
    liveEventSource.onmessage = (event) => {
      try { handleLiveKaneEvent(JSON.parse(event.data)); } catch (_) { /* Ignore invalid transport data. */ }
    };
    liveEventSource.onerror = () => {
      liveEventSource?.close();
      clearInterval(liveTimerInterval);
      setRunButton(false);
      const badge = document.getElementById('live-status-badge');
      if (badge) badge.textContent = 'Disconnected';
      appendLiveLog('Monitor disconnected. Reload to reconnect; no result is inferred.', 'text-amber-300');
    };
  }

  async function triggerKaneLiveRun() {
    const target = document.getElementById('live-target-url');
    const test = document.getElementById('live-test-path');
    const browser = document.getElementById('live-show-browser');
    setRunButton(true);
    try {
      const response = await fetch('/api/kane/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Arena-Request': '1' },
        body: JSON.stringify({target_url: target?.value.trim() || 'http://127.0.0.1:5000',
          test_path: '.testmuai/tests/CheckoutConsistency_test.md',
          show_browser: browser?.checked ?? true})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Launch refused (${response.status}).`);
      const feed = document.getElementById('live-console-feed');
      if (feed) feed.replaceChildren();
      clearLiveView();
      liveStartTime = Date.now();
      connectKaneStream();
    } catch (error) {
      appendLiveLog(error.message, 'text-rose-400');
      setRunButton(false);
    }
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('#btn-run-kane-live')) triggerKaneLiveRun();
  });
  connectKaneStream();
  window.addEventListener('pagehide', () => {
    liveEventSource?.close();
    clearInterval(liveTimerInterval);
    document.getElementById('live-stream-img')?.removeAttribute('src');
  });

  let projectInfo = null;
  let selectedProject = 'builtin';
  let projectLaunching = false;
  function projectText(id, text) {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  }
  function updateProjectStart() {
    const button = document.getElementById('project-start');
    if (!button) return;
    const mode = document.getElementById('project-breaker')?.value || 'gemini';
    const requirements = projectInfo?.prerequisites;
    button.disabled = projectLaunching || projectRunActive || !projectInfo?.project?.compatible || !projectInfo?.enabled ||
      !document.getElementById('project-approve')?.checked ||
      !requirements?.kane || !requirements?.codex || !requirements?.chrome || requirements?.node === false || (mode === 'gemini' && !requirements?.gemini);
  }
  async function loadProject(id) {
    projectInfo = null;
    const approval = document.getElementById('project-approve');
    if (approval) approval.checked = false;
    updateProjectStart();
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(id)}/preflight`, {cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Preflight failed.');
      projectInfo = data;
      selectedProject = id;
      projectText('project-status', `${data.project.framework}: ${data.project.reason}`);
      projectText('project-test', data.project.compatible ? data.test_text : 'No test approved. A project-specific adapter is required.');
      projectText('project-test-hash', data.project.compatible ? `SHA-256: ${data.test_sha256}` : '');
      const p = data.prerequisites;
      projectText('project-prerequisites', `Local execution: ${data.enabled ? 'enabled' : 'disabled - set ARENA_ENABLE_LIVE_KANE=1 and restart'} | Chrome: ${p.chrome ? 'found' : 'missing'} | Kane: ${p.kane ? 'found' : 'missing'} | Codex: ${p.codex ? 'found' : 'missing'} ${p.node === undefined ? '' : ` | SeatPilot Node/npm: ${p.node ? 'found' : 'missing'}`} | Gemini environment: ${p.gemini ? 'configured' : 'not configured in the Arena server - restart it from your configured terminal'}`);
    } catch (error) {
      projectText('project-status', error.message);
    }
    updateProjectStart();
  }
  async function importProject() {
    const file = document.getElementById('project-zip')?.files?.[0];
    if (!file) { projectText('project-status','Choose a source ZIP first.'); return; }
    if (file.size > 20 * 1024 * 1024) { projectText('project-status','ZIP exceeds 20 MB. Omit dependencies and build output.'); return; }
    projectInfo = null;
    updateProjectStart();
    projectText('project-status','Importing source only; no project code or install scripts are being run...');
    const form = new FormData();
    form.append('project',file);
    try {
      const response = await fetch('/api/projects/import',{method:'POST',headers:{'X-Arena-Request':'1'},body:form});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed.');
      await loadProject(data.project.id);
    } catch (error) { projectText('project-status',error.message); }
  }
  async function launchProject() {
    if (!projectInfo || projectLaunching) return;
    projectLaunching = true;
    updateProjectStart();
    try {
      const response = await fetch(`/api/projects/${selectedProject}/battle`,{
        method:'POST',headers:{'Content-Type':'application/json','X-Arena-Request':'1'},
        body:JSON.stringify({approved:document.getElementById('project-approve')?.checked === true,
          test_sha256:projectInfo.test_sha256,breaker:document.getElementById('project-breaker')?.value,
          show_browser:document.getElementById('live-show-browser')?.checked ?? true})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Battle launch failed.');
      projectText('project-status','Full battle started. Follow the live panel and recorded history below.');
      projectRunActive = true;
      document.activeElement?.blur();
      document.getElementById('live-console-feed')?.replaceChildren();
      clearLiveView();
      liveStartTime = Date.now();
      connectKaneStream();
    } catch (error) { projectText('project-status',error.message); }
    finally { projectLaunching = false; updateProjectStart(); }
  }
  document.addEventListener('click',(event)=>{
    if (event.target.closest('#project-import')) importProject();
    else if (event.target.closest('#project-builtin')) loadProject('builtin');
    else if (event.target.closest('#project-start')) launchProject();
  });
  document.addEventListener('change',(event)=>{
    if (event.target.matches('#project-approve, #project-breaker')) updateProjectStart();
  });
  loadProject('builtin');

  document.addEventListener('arena:archive-update', (event) => {
    const payload = event.detail;
    const script = document.getElementById('arena-payload');
    if (script) script.textContent = JSON.stringify(payload);
    if (state.activePreviewKey !== 'archive') return;
    if (document.activeElement?.id === 'battle-search' || document.activeElement?.closest('#project-setup-panel') || state.isReplayingStages || isDraggingWipe) return;
    state.payload = payload;
    render();
  });
  render();
}
