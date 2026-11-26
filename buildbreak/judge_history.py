"""Persist a safe, allowlisted summary of local judge workflow runs."""
from contextlib import closing
import json
import math
import re
import sqlite3


SCHEMA = """
CREATE TABLE IF NOT EXISTS arena_judge_workflows (
 id TEXT PRIMARY KEY,
 adapter TEXT NOT NULL,
 created_at REAL NOT NULL,
 updated_at REAL NOT NULL,
 state TEXT NOT NULL,
 result TEXT NOT NULL,
 test_sha256 TEXT NOT NULL,
 events_json TEXT NOT NULL,
 executions_json TEXT NOT NULL
);
"""

_RUN_ID = re.compile(r'[a-f0-9]{32}')
_STATE = re.compile(r'[a-z_]{1,48}')
_SHA256 = re.compile(r'[a-f0-9]{64}')
_EVIDENCE_ID = re.compile(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
_RESULTS = {'passed', 'verification_failed', 'infrastructure_error'}
_STAGES = {'healthy', 'fault', 'repair'}


def ensure_schema(connection):
    connection.executescript(SCHEMA)


def _validate_record(record):
    if not isinstance(record, dict) or set(record) != {
            'id', 'adapter', 'created_at', 'updated_at', 'state', 'result',
            'test_sha256', 'events', 'executions'}:
        raise ValueError('Judge history record has an invalid shape.')
    if (not isinstance(record['id'], str) or not _RUN_ID.fullmatch(record['id'])
            or not isinstance(record['adapter'], str)
            or record['adapter'] not in {'breakshop', 'local-contract'}
            or not isinstance(record['state'], str) or not _STATE.fullmatch(record['state'])
            or not isinstance(record['result'], str)
            or not (record['result'] == '' or _STATE.fullmatch(record['result']))
            or not isinstance(record['test_sha256'], str)
            or not (record['test_sha256'] == '' or _SHA256.fullmatch(record['test_sha256']))
            or any(type(record[key]) not in (int, float) or not math.isfinite(record[key])
                   for key in ('created_at', 'updated_at'))):
        raise ValueError('Judge history metadata failed validation.')
    events = record['events']
    if not isinstance(events, list) or len(events) > 128:
        raise ValueError('Judge history stage list failed validation.')
    for event in events:
        if (not isinstance(event, dict) or set(event) != {'state', 'message', 'at'}
                or not isinstance(event['state'], str) or not _STATE.fullmatch(event['state'])
                or not isinstance(event['message'], str)
                or event['message'] != event['state'].replace('_', ' ').capitalize()
                or type(event['at']) not in (int, float) or not math.isfinite(event['at'])):
            raise ValueError('Judge history stage failed validation.')
    executions = record['executions']
    if not isinstance(executions, list) or len(executions) > 8:
        raise ValueError('Judge history execution list failed validation.')
    for execution in executions:
        if (not isinstance(execution, dict)
                or set(execution) != {'stage', 'attempt', 'result', 'execution_id',
                                      'evidence_ref', 'test_sha256', 'duration'}
                or not isinstance(execution['stage'], str) or execution['stage'] not in _STAGES
                or type(execution['attempt']) is not int or not 1 <= execution['attempt'] <= 3
                or not isinstance(execution['result'], str) or execution['result'] not in _RESULTS
                or (execution['execution_id'] is not None
                    and (not isinstance(execution['execution_id'], str)
                         or not _EVIDENCE_ID.fullmatch(execution['execution_id'])))
                or (execution['evidence_ref'] is not None
                    and (not isinstance(execution['evidence_ref'], str)
                         or not _SHA256.fullmatch(execution['evidence_ref'])))
                or not isinstance(execution['test_sha256'], str)
                or not _SHA256.fullmatch(execution['test_sha256'])
                or type(execution['duration']) not in (int, float)
                or not math.isfinite(execution['duration']) or execution['duration'] < 0):
            raise ValueError('Judge history execution failed validation.')
    return record


def save_judge_record(database, record):
    record = _validate_record(record)
    with closing(sqlite3.connect(database)) as connection:
        with connection:
            ensure_schema(connection)
            connection.execute(
                '''INSERT INTO arena_judge_workflows
                   (id,adapter,created_at,updated_at,state,result,test_sha256,events_json,executions_json)
                   VALUES (?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET
                   updated_at=excluded.updated_at,state=excluded.state,result=excluded.result,
                   test_sha256=excluded.test_sha256,events_json=excluded.events_json,
                   executions_json=excluded.executions_json''',
                (record['id'], record['adapter'], record['created_at'], record['updated_at'],
                 record['state'], record['result'], record['test_sha256'],
                 json.dumps(record['events'], separators=(',', ':')),
                 json.dumps(record['executions'], separators=(',', ':'))))


def load_judge_records(database, limit=10):
    if type(limit) is not int or not 1 <= limit <= 50:
        raise ValueError('Judge history limit is outside the permitted range.')
    with closing(sqlite3.connect(database)) as connection:
        connection.row_factory = sqlite3.Row
        ensure_schema(connection)
        rows = connection.execute(
            '''SELECT id,adapter,created_at,updated_at,state,result,test_sha256,
                      events_json,executions_json
               FROM arena_judge_workflows ORDER BY created_at DESC LIMIT ?''',
            (limit,)).fetchall()
    records = []
    for row in rows:
        records.append(_validate_record({
            'id': row['id'], 'adapter': row['adapter'], 'created_at': row['created_at'],
            'updated_at': row['updated_at'], 'state': row['state'], 'result': row['result'],
            'test_sha256': row['test_sha256'], 'events': json.loads(row['events_json']),
            'executions': json.loads(row['executions_json']),
        }))
    return records
