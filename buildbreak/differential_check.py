"""Generic differential probe runner for arbitrary target apps.

Probes both healthy and broken app copies using HTTP requests and/or database queries.
A proposed bug counts ONLY if the observable behavior (HTTP response or saved data)
differs from the healthy app.
"""
import json
import sqlite3
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple


class DifferentialProbeError(RuntimeError):
    pass


def probe_http_endpoint(base_url: str, path: str, method: str = 'GET', data: Optional[dict] = None) -> Dict[str, Any]:
    url = f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    headers = {'Accept': 'application/json, text/html, */*'}
    payload = None
    if data is not None:
        payload = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'

    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get('Content-Type', '')
            raw_body = resp.read()
            body_text = raw_body.decode('utf-8', errors='replace')
            body_json = None
            if 'application/json' in content_type:
                try:
                    body_json = json.loads(body_text)
                except Exception:
                    pass
            return {
                'status': resp.status,
                'json': body_json,
                'text_length': len(body_text),
                'content_snippet': body_text[:200]
            }
    except urllib.error.HTTPError as err:
        raw_body = err.read()
        body_text = raw_body.decode('utf-8', errors='replace')
        return {
            'status': err.code,
            'json': None,
            'text_length': len(body_text),
            'content_snippet': body_text[:200]
        }
    except Exception as e:
        raise DifferentialProbeError(f"HTTP probe connection failed: {e}") from e


def probe_database_snapshot(db_path: Path, table_queries: List[Tuple[str, str]]) -> Dict[str, Any]:
    """Execute read-only queries against an SQLite database copy to observe saved state."""
    if not db_path.is_file():
        return {'db_present': False}

    results = {}
    try:
        conn = sqlite3.connect(str(db_path), timeout=5)
        conn.row_factory = sqlite3.Row
        with conn:
            for label, query in table_queries:
                cursor = conn.execute(query)
                rows = [dict(r) for r in cursor.fetchall()]
                results[label] = rows
        conn.close()
        return {'db_present': True, 'tables': results}
    except Exception as e:
        return {'db_present': True, 'error': str(e)}


def compare_differential_observations(healthy_obs: Dict[str, Any], broken_obs: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Returns (has_differential, explanation).
    has_differential is True iff observable behavior differs between healthy and broken copies.
    """
    healthy_json = json.dumps(healthy_obs, sort_keys=True)
    broken_json = json.dumps(broken_obs, sort_keys=True)

    if healthy_json == broken_json:
        return False, "Broken copy produced identical observable behavior to healthy copy."

    # Identify diff summary
    diff_keys = []
    all_keys = set(healthy_obs.keys()) | set(broken_obs.keys())
    for k in all_keys:
        if healthy_obs.get(k) != broken_obs.get(k):
            diff_keys.append(k)

    return True, f"Observable behavioral difference detected in: {', '.join(diff_keys)}"
