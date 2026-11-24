"""Compare deterministic observations from isolated copies of an application."""
import json
import sqlite3
import urllib.error
import urllib.request
from contextlib import closing
from urllib.parse import urlsplit


class DifferentialProbeError(RuntimeError):
    pass


class _LocalOnly(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise DifferentialProbeError("Probe endpoint redirected")


def probe_http_endpoint(base_url, path, method="GET", data=None):
    endpoint = urlsplit(base_url)
    if (endpoint.scheme != "http" or endpoint.hostname != "127.0.0.1" or not endpoint.port
            or endpoint.username or endpoint.password or endpoint.path not in ("", "/")
            or endpoint.fragment or endpoint.query or not path.startswith("/") or path.startswith("//")):
        raise DifferentialProbeError("Expected a local disposable app endpoint")
    request = urllib.request.Request(base_url.rstrip("/") + path, method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={"Accept": "application/json", "Content-Type": "application/json"})
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), _LocalOnly())
        with opener.open(request, timeout=10) as response:
            raw = response.read(1_000_001)
            if len(raw) > 1_000_000:
                raise DifferentialProbeError("Probe response too large")
            return {"status": response.status, "json": json.loads(raw)}
    except (OSError, ValueError) as error:
        raise DifferentialProbeError("HTTP probe did not return valid JSON successfully") from error


def probe_database_snapshot(db_path, table_queries):
    """Run operator-supplied SELECT queries on a read-only disposable database."""
    if not db_path.is_file():
        raise DifferentialProbeError("Database unavailable")
    try:
        with closing(sqlite3.connect(db_path.resolve().as_uri() + "?mode=ro", uri=True)) as conn:
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA query_only=ON")
            allowed = {sqlite3.SQLITE_SELECT, sqlite3.SQLITE_READ, sqlite3.SQLITE_FUNCTION}
            conn.set_authorizer(lambda action, *_: sqlite3.SQLITE_OK if action in allowed else sqlite3.SQLITE_DENY)
            results = {}
            for label, query in table_queries:
                rows = conn.execute(query).fetchmany(1001)
                if len(rows) > 1000:
                    raise DifferentialProbeError("Probe query returned too many rows")
                results[label] = [dict(row) for row in rows]
            return results
    except sqlite3.Error as error:
        raise DifferentialProbeError("Read-only database probe failed") from error


def compare_differential_observations(healthy_obs, broken_obs):
    for observation in (healthy_obs, broken_obs):
        if (not isinstance(observation, dict) or not observation or "error" in observation
                or observation.get("db_present") is False):
            raise DifferentialProbeError("Missing or unsuccessful probe")
    if healthy_obs.keys() != broken_obs.keys():
        raise DifferentialProbeError("Probe sets do not match")
    changed = [key for key in healthy_obs if json.dumps(healthy_obs[key], sort_keys=True)
               != json.dumps(broken_obs[key], sort_keys=True)]
    if changed:
        return True, "Observable change in " + ", ".join(sorted(changed))
    return False, "Healthy and changed copies produced identical observations."
