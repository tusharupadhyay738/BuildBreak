"""Sanitized drill provenance and outcomes, separate from legacy battle rows."""

DETAIL_SCHEMA = """
CREATE TABLE IF NOT EXISTS arena_drill_details (
 battle_id TEXT PRIMARY KEY, requested_breaker TEXT NOT NULL,
 producer TEXT, source TEXT, model TEXT, cache_id TEXT,
 independently_validated INTEGER NOT NULL DEFAULT 0,
 outcome TEXT, max_attempts INTEGER, family TEXT, invariant TEXT);
"""

OUTCOME_LABELS = {
    'caught_and_repaired': 'Caught and repaired',
    'caught_needs_human': 'Caught; human review needed',
    'escaped': 'Escaped the selected checks',
}
PRODUCER_LABELS = {
    'gemini': 'Gemini', 'controlled-fallback': 'Controlled fallback',
    'codex': 'Codex (controlled selection)', 'scripted': 'Scripted (controlled fault)',
}


def ensure_details_schema(connection):
    connection.execute(DETAIL_SCHEMA)
    columns = {row[1] for row in connection.execute('PRAGMA table_info(arena_drill_details)')}
    for name in ('family', 'invariant'):
        if name not in columns:
            connection.execute('ALTER TABLE arena_drill_details ADD COLUMN ' + name + ' TEXT')


def outcome_for(state, verifications, independently_validated):
    latest = {row['phase']: row['result'] for row in verifications}
    if latest.get('baseline') != 'passed':
        return None
    caught = latest.get('before') == 'verification_failed'
    if state == 'completed' and caught and latest.get('after') == 'passed':
        return 'caught_and_repaired'
    if state == 'needs_human' and caught:
        return 'caught_needs_human'
    if state == 'not_detected' and latest.get('before') == 'passed' and independently_validated:
        return 'escaped'
    return None


def save_details(connection, battle, *, requested, producer=None, source=None,
                 model=None, cache_id=None, validated=False, max_attempts=None,
                 family=None, invariant=None):
    ensure_details_schema(connection)
    connection.execute('''INSERT INTO arena_drill_details
        (battle_id,requested_breaker,producer,source,model,cache_id,independently_validated,max_attempts,family,invariant)
        VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(battle_id) DO UPDATE SET
        producer=excluded.producer,source=excluded.source,model=excluded.model,
        cache_id=excluded.cache_id,independently_validated=excluded.independently_validated,
        family=excluded.family,invariant=excluded.invariant''',
        (battle, requested, producer, source, model, cache_id, int(validated), max_attempts, family, invariant))


def update_outcome(connection, battle, state):
    detail = connection.execute('SELECT independently_validated FROM arena_drill_details WHERE battle_id=?',
                                (battle,)).fetchone()
    if detail is None:
        return
    rows = connection.execute('SELECT phase,result FROM arena_verifications WHERE battle_id=? ORDER BY rowid',
                              (battle,)).fetchall()
    outcome = outcome_for(state, [dict(zip(('phase', 'result'), row)) for row in rows], bool(detail[0]))
    connection.execute('UPDATE arena_drill_details SET outcome=? WHERE battle_id=?', (outcome, battle))


def decorate(item, detail):
    """Expose only an explicit field set; never read evidence from a web request."""
    item['drill'] = None
    if detail:
        item['drill'] = {name: detail[name] for name in
                         ('requested_breaker', 'producer', 'source', 'model', 'cache_id',
                          'independently_validated', 'outcome', 'max_attempts')}
        item['drill']['producer_label'] = PRODUCER_LABELS.get(detail['producer'], 'Not recorded')
        item['drill']['outcome_label'] = OUTCOME_LABELS.get(detail['outcome'], 'Not scored')
        item['drill'].update(family=detail.get('family'), invariant=detail.get('invariant'))
    return item


def summarize(sessions):
    # Do not count older records without a confirmed direct check as suite measurements.
    counts = {key: 0 for key in OUTCOME_LABELS}
    for session in sessions:
        detail = session.get('drill')
        if detail and detail['independently_validated'] and detail['outcome'] in counts:
            counts[detail['outcome']] += 1
    counts['scored'] = sum(counts.values())
    counts['caught'] = counts['caught_and_repaired'] + counts['caught_needs_human']
    counts['excluded'] = len(sessions) - counts['scored']
    return counts
