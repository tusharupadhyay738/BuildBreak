"""Read-only views and private local evidence configuration."""
import json
import sqlite3
from contextlib import closing
from pathlib import Path
from flask import render_template

SCHEMA = """CREATE TABLE IF NOT EXISTS battles (
 id TEXT PRIMARY KEY, baseline TEXT, fault TEXT, repair TEXT);
CREATE TABLE IF NOT EXISTS battle_runs (
 battle_id TEXT, phase TEXT, execution_id TEXT, result TEXT,
 subtotal INTEGER, expected INTEGER, actual INTEGER,
 PRIMARY KEY (battle_id, phase));"""

def local_sources(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError, TypeError):
        return {}

def availability(source):
    if not source:
        return "Not configured"
    try:
        return "Available locally" if Path(source).is_file() else "Unavailable"
    except (OSError, ValueError, TypeError):
        return "Unable to check"

def register_arena(app):
    app.config.setdefault("ARENA_DATABASE", str(Path(app.instance_path) / "arena.sqlite3"))
    app.config.setdefault("ARENA_SOURCES", str(Path(app.instance_path) / "arena-sources.json"))
    with closing(sqlite3.connect(app.config["ARENA_DATABASE"])) as connection:
        connection.executescript(SCHEMA)

    def live_battles():
        with closing(sqlite3.connect(app.config["ARENA_DATABASE"])) as connection:
            connection.row_factory = sqlite3.Row
            if not connection.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='arena_sessions'").fetchone():
                return []
            sessions = []
            for row in connection.execute("SELECT * FROM arena_sessions ORDER BY created DESC LIMIT 10"):
                item = dict(row)
                item["events"] = connection.execute("SELECT at,kind,message FROM arena_events WHERE battle_id=? ORDER BY seq", (row["id"],)).fetchall()
                item["verifications"] = connection.execute("SELECT phase,attempt,result,evidence_id,pack_hash,test_hash,duration FROM arena_verifications WHERE battle_id=? ORDER BY rowid", (row["id"],)).fetchall()
                sessions.append(item)
            return sessions

    @app.get("/arena/live")
    def arena_live():
        response = app.make_response(render_template("live_battles.html", sessions=live_battles()))
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/arena")
    def arena():
        with closing(sqlite3.connect(app.config["ARENA_DATABASE"])) as connection:
            connection.row_factory = sqlite3.Row
            battle = connection.execute("SELECT * FROM battles WHERE id = ?", ("discount-regression",)).fetchone()
            runs = connection.execute("SELECT * FROM battle_runs WHERE battle_id = ? ORDER BY CASE phase WHEN 'before' THEN 0 ELSE 1 END", ("discount-regression",)).fetchall()
        sources = local_sources(app.config["ARENA_SOURCES"])
        evidence = {}
        for run in runs:
            source = sources.get(run["phase"], {})
            if not isinstance(source, dict):
                source = {}
            evidence[run["phase"]] = {key: availability(source.get(key)) for key in ("report", "pack")}
        return render_template("arena.html", battle=battle, runs=runs, evidence=evidence, sessions=live_battles())
