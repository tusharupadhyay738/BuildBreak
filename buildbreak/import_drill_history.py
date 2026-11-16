"""Explicitly enrich existing local battles from preserved, verified artifacts."""
import json
from pathlib import Path
import re
import zipfile

from .battle_history import save_details, update_outcome
from .fault_validator import protected


def import_history(root):
    from .battle_runner import connect, digest, validate_pack, TEST
    root = Path(root).resolve()
    database = root / 'instance/arena.sqlite3'
    if not database.is_file():
        return 0
    imported = 0
    with connect(database) as db:
        rows = db.execute('''SELECT s.id,s.state,s.mode FROM arena_sessions s
            LEFT JOIN arena_drill_details d ON s.id=d.battle_id WHERE d.battle_id IS NULL''').fetchall()
    for battle, state, mode in rows:
        if not re.fullmatch(r'\d{8}T\d{6}-[a-f0-9]{8}', battle):
            continue
        directory = root / 'instance/battles' / battle
        if directory.is_symlink() or not directory.is_dir():
            continue
        try:
            selection = json.loads((directory / 'fault.json').read_text(encoding='utf-8'))
            producer = selection.get('producer')
            if producer not in {'gemini', 'controlled-fallback'}:
                continue  # Legacy controlled selections keep their existing honest labels.
            model = selection.get('model')
            if model is not None and (not isinstance(model, str) or not re.fullmatch(r'gemini-[A-Za-z0-9.-]{1,100}', model)):
                continue
            manifest = json.loads((directory / 'baseline-manifest.json').read_text(encoding='utf-8'))
            validation_folder = directory / ('fault-validation-fallback' if producer == 'controlled-fallback'
                                             else f'fault-validation-{int(selection["attempt"])}')
            validation = json.loads((validation_folder / 'validation.json').read_text(encoding='utf-8'))
            direct, tests = validation['direct'], validation['tests']
            if (direct.get('passed') is not False or direct.get('booted') is not True
                    or direct.get('expected_cents') != [4497, 450, 4047]
                    or direct.get('actual_cents') == direct['expected_cents']
                    or tests['errors'] or tests['failures'] < 1
                    or tests['run'] <= tests['failures'] + tests['skipped']):
                continue
            protected(validation_folder / 'workspace', manifest, allow_app=True)
            original = (directory / 'original-app.py').read_text(encoding='utf-8')
            patch = selection['patch']
            if (digest(directory / 'original-app.py') != manifest['app.py']
                    or original.count(patch['old_text']) != 1
                    or (validation_folder / 'workspace/app.py').read_text(encoding='utf-8') !=
                    original.replace(patch['old_text'], patch['new_text'], 1)):
                continue
            with connect(database) as db:
                verifications = db.execute('''SELECT phase,attempt,result,evidence_id,pack_hash,test_hash
                    FROM arena_verifications WHERE battle_id=?''', (battle,)).fetchall()
            if not verifications:
                continue
            for phase, attempt, result, evidence_id, pack_hash, test_hash in verifications:
                if phase not in {'baseline', 'before', 'after'} or type(attempt) is not int or attempt < 0:
                    raise ValueError('Invalid verification phase')
                pack = directory / f'{phase}-{attempt}' / 'run.evidence'
                if digest(pack) != pack_hash or test_hash != manifest[TEST.as_posix()]:
                    raise ValueError('Preserved evidence hash mismatch')
                if result in {'passed', 'verification_failed'}:
                    with zipfile.ZipFile(pack) as archive:
                        run = archive.read('run.yaml').decode('utf-8')
                    target = re.search(r'^    - (http://127\.0\.0\.1:\d+)\s*$', run, re.M)
                    if not target:
                        raise ValueError('Missing evidence target')
                    validate_pack(pack, evidence_id, test_hash,
                                  'passed' if result == 'passed' else 'failed', target.group(1))
            with connect(database) as db:
                save_details(db, battle, requested='gemini', producer=producer,
                             source='controlled' if producer == 'controlled-fallback' else 'live',
                             model=model, validated=True)
                update_outcome(db, battle, state)
            imported += 1
        except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile):
            print('Skipped a battle with incomplete or inconsistent preserved metadata.')
    return imported


if __name__ == '__main__':
    print(f'Enriched {import_history(Path(__file__).resolve().parents[1])} existing battle(s). No evidence changed.')
