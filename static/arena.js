/* Read-only UI. All results come from the existing server-rendered archive. */
(() => {
  const panel = document.getElementById('live-battles');
  const status = document.getElementById('connection-status');
  let previousMarkup = panel.innerHTML;
  let refreshing = false;
  let query = '';
  let state = 'all';
  const terminal = new Set(['completed', 'not_detected', 'needs_human', 'baseline_blocked', 'infrastructure_error']);

  function filterHistory() {
    const search = document.getElementById('battle-search');
    const select = document.getElementById('battle-state');
    if (!search || !select) return;
    search.value = query;
    select.value = state;
    const rows = [...panel.querySelectorAll('[data-battle-row]')];
    let visible = 0;
    for (const row of rows) {
      const stateMatches = state === 'all' || row.dataset.state === state ||
        (state === 'active' && !terminal.has(row.dataset.state));
      row.hidden = !stateMatches || !row.textContent.toLowerCase().includes(query.trim().toLowerCase());
      if (!row.hidden) visible++;
    }
    document.getElementById('history-empty').hidden = visible !== 0;
    document.getElementById('history-count').textContent = `${visible} of ${rows.length} recent records`;
  }
  panel.addEventListener('input', event => {
    if (event.target.id === 'battle-search') { query = event.target.value; filterHistory(); }
  });
  panel.addEventListener('change', event => {
    if (event.target.id === 'battle-state') { state = event.target.value; filterHistory(); }
  });
  filterHistory();

  setInterval(async () => {
    if (document.hidden || refreshing) return;
    refreshing = true;
    try {
      const response = await fetch('/arena/live' + window.location.search, {cache: 'no-store'});
      if (!response.ok) throw new Error('Refresh unavailable');
      const markup = await response.text();
      // Keep typing uninterrupted, while open disclosures continue to receive updates.
      const active = document.activeElement;
      const editing = panel.contains(active) && active.matches('input, select, textarea');
      if (markup !== previousMarkup && !editing) {
        const focusedKey = active.tagName === 'SUMMARY' ? active.closest('details[data-key]')?.dataset.key : null;
        const opened = new Set([...panel.querySelectorAll('details[open][data-key]')].map(el => el.dataset.key));
        panel.innerHTML = markup;
        panel.querySelectorAll('details[data-key]').forEach(el => { el.open = opened.has(el.dataset.key); });
        if (focusedKey) {
          [...panel.querySelectorAll('details[data-key]')].find(el => el.dataset.key === focusedKey)
            ?.querySelector('summary')?.focus({preventScroll: true});
        }
        previousMarkup = markup;
        filterHistory();
      }
      status.textContent = 'Showing recorded results · auto-refresh on';
    } catch (_) {
      status.textContent = 'Connection unavailable · showing last recorded results';
    } finally { refreshing = false; }
  }, 3000);
})();
