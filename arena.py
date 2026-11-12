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
        return render_template("arena.html", battle=battle, runs=runs, evidence=evidence)
