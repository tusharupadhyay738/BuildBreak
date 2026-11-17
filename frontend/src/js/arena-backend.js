// Refresh the sanitized archive without changing the original presentation.
let previous = document.getElementById('arena-payload')?.textContent || '';
let pending = false;
setInterval(async () => {
  if (document.hidden || pending) return;
  pending = true;
  try {
    const response = await fetch('/arena/data' + location.search, {cache: 'no-store'});
    if (!response.ok) return; // Retain the last recorded archive on connection failure.
    const payload = await response.json();
    const serialized = JSON.stringify(payload);
    if (serialized !== previous) {
      document.dispatchEvent(new CustomEvent('arena:archive-update', {detail: payload}));
      previous = serialized;
    }
  } catch (_) { /* Keep the last known archive; never substitute sample data. */ }
  finally { pending = false; }
}, 15000);
