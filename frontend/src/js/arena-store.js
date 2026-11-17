/**
 * BuildBreak Arena — Data Store & Flask/Jinja Payload Adapter
 *
 * Isolates data loading and client-side filtering from DOM presentation.
 * Supports:
 * 1. Jinja inline JSON (<script id="arena-payload" type="application/json">...</script>)
 * 2. Global injection (window.__ARENA_PAYLOAD__)
 * 3. Historical demo fallback (SAMPLE_HISTORICAL_PAYLOAD)
 */

import { SAMPLE_HISTORICAL_PAYLOAD, STATE_PREVIEWS } from '../data/sample-payload.js';

export function readInjectedPayload() {
  const scriptEl = document.getElementById('arena-payload');
  if (scriptEl && scriptEl.textContent && scriptEl.textContent.trim().length > 0) {
    try {
      const parsed = JSON.parse(scriptEl.textContent);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (err) {
      return {
        schemaVersion: '1.0',
        mode: 'live_archive',
        isSample: false,
        status: 'error',
        dataSourceLabel: 'Injected Jinja JSON payload',
        notice: 'Failed to parse server-injected JSON payload.',
        activeBattleId: null,
        battles: [],
        error: {
          code: 'PAYLOAD_PARSE_ERROR',
          subsystem: 'Jinja Template Serialization',
          message: 'The JSON embedded in #arena-payload could not be parsed.',
          detail: err instanceof Error ? err.message : String(err),
          suggestion: 'Confirm Flask uses {{ arena_payload | tojson }} inside #arena-payload.',
        },
      };
    }
  }

  if (typeof window !== 'undefined' && window.__ARENA_PAYLOAD__) {
    return window.__ARENA_PAYLOAD__;
  }

  return {mode:'live_archive',isSample:false,status:'empty',dataSourceLabel:'Local SQLite archive',notice:'No recorded battles are available.',battles:[],activeBattleId:null};
}

export function getPreviewPayload(previewKey) {
  const chosen = STATE_PREVIEWS[previewKey] || SAMPLE_HISTORICAL_PAYLOAD;
  const preview = structuredClone(chosen);
  for (const battle of preview.battles || []) {
    battle.isSample = true;
    for (const shot of Object.values(battle.screenshots || {})) shot.isSample = true;
  }
  return preview;
}

export function normalizeOutcomeKey(outcome) {
  const raw = String(outcome || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (['repaired', 'success', 'caught_and_repaired', 'repair_verified'].includes(raw)) return 'success';
  if (['failed', 'repair_failed', 'caught;_human_review_needed', 'human_review'].includes(raw)) return 'repair_failed';
  if (raw === 'pending' || raw === 'pending_inspection') return 'pending_inspection';
  if (raw === 'missing_evidence') return 'missing_evidence';
  return raw;
}

export function countBattlesByView(battles) {
  const list = Array.isArray(battles) ? battles : [];
  const counts = {
    all: list.length,
    success: 0,
    repair_failed: 0,
    pending_inspection: 0,
    missing_evidence: 0,
  };
  for (const battle of list) {
    const key = normalizeOutcomeKey(battle.outcome);
    if (key in counts) {
      counts[key] += 1;
    }
    if (key !== 'missing_evidence' &&
        (battle.screenshots?.failure?.status !== 'available' || battle.screenshots?.repair?.status !== 'available')) {
      counts.missing_evidence += 1;
    }
  }
  return counts;
}

export function filterBattles(battles, { outcomeFilter = 'all', searchQuery = '' } = {}) {
  if (!Array.isArray(battles)) return [];
  const q = searchQuery.trim().toLowerCase();

  return battles.filter((battle) => {
    if (outcomeFilter === 'missing_evidence') {
      if (battle.screenshots?.failure?.status === 'available' && battle.screenshots?.repair?.status === 'available') return false;
    } else if (outcomeFilter !== 'all') {
      const normalized = normalizeOutcomeKey(battle.outcome);
      if (normalized !== outcomeFilter) return false;
    }

    if (!q) return true;

    const haystack = [
      battle.id,
      battle.title,
      battle.breaker,
      battle.faultFamily,
      battle.outcome,
      battle.targetApp,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function resolveSelectedBattle(battles, selectedBattleId) {
  if (!Array.isArray(battles) || battles.length === 0) return null;
  if (selectedBattleId) {
    const match = battles.find((b) => b.id === selectedBattleId);
    if (match) return match;
  }
  return battles[0];
}
