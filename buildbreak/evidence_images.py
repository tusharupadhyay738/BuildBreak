"""Read a bounded screenshot from a recorded, hash-matched Kane pack.

No archive extraction, arbitrary file paths or network access. Images are local
demo evidence, not a live browser feed or independent proof of a verdict.
"""
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re
import zipfile
import zlib

BATTLE_ID = re.compile(r'\d{8}T\d{6}-[a-f0-9]{8}')
UUID = re.compile(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}')
SHA256 = re.compile(r'[a-f0-9]{64}')
IMAGE = re.compile(r'(tests/[A-Za-z0-9_-]{1,120}/steps/([1-9]\d{0,3})-\d{1,4}-\d{1,4})/screenshot\.(jpg|png)')
MAX_PACK_BYTES = 256 * 1024 * 1024
MAX_IMAGE_BYTES = 5 * 1024 * 1024


@dataclass(frozen=True)
class Screenshot:
    content: bytes
    mimetype: str
    ordinal: int
    checkpoint: str
    sha256: str
    observations: tuple = ()


def recorded_amounts(archive, prefix):
    """Only known currency observations; never emit raw log text or key names."""
    fields = {f'{group}_{amount}_check': (group, amount)
              for group in ('order_summary', 'confirmation')
              for amount in ('subtotal', 'discount', 'total')}
    values = {}
    budget = 20000000
    for info in archive.infolist():
        if not info.filename.startswith(prefix) or not info.filename.endswith('-actions.ndjson'):
            continue
        if info.file_size > budget:
            break
        budget -= info.file_size
        for line in bounded_member(archive, info.filename, 20000000).decode('utf-8').splitlines():
            try:
                record = json.loads(line)
            except ValueError:
                continue
            if not isinstance(record, dict) or record.get('action_type') != 'analyze':
                continue
            params = record.get('action_params')
            key = params.get('key') if isinstance(params, dict) else None
            value = record.get('output_value')
            if isinstance(key, str) and key in fields and isinstance(value, str) and re.fullmatch(r'\$\d{1,8}\.\d{2}', value):
                values[fields[key]] = value
    group = 'confirmation' if any(key[0] == 'confirmation' for key in values) else 'order_summary'
    label = 'Saved' if group == 'confirmation' else 'Cart'
    return tuple((label + ' ' + amount, values[group, amount])
                 for amount in ('subtotal', 'discount', 'total') if (group, amount) in values)


def pack_path(root, battle, phase, attempt):
    if (not BATTLE_ID.fullmatch(battle) or phase not in {'baseline', 'before', 'after'}
            or type(attempt) is not int
            or attempt not in ({1, 2, 3} if phase == 'after' else {0})):
        raise ValueError('Invalid evidence reference')
    root = Path(root).absolute()
    candidate = root / battle / f'{phase}-{attempt}' / 'run.evidence'
    # Reject links in every component, including a configured root's ancestors.
    if any(path.is_symlink() or getattr(path, 'is_junction', lambda: False)()
           for path in (candidate, *candidate.parents)):
        raise ValueError('Linked evidence is unavailable')
    if not candidate.resolve().is_relative_to(root.resolve()):
        raise ValueError('Evidence path outside configured root')
    return candidate


def bounded_member(archive, name, limit):
    info = archive.getinfo(name)
    if info.file_size > limit or info.flag_bits & 1:
        raise ValueError('Unsupported evidence member')
    with archive.open(info) as stream:
        data = stream.read(limit + 1)
    if len(data) > limit:
        raise ValueError('Evidence member exceeded limit')
    return data


def screenshot_for(root, battle, run):
    """Return a verified preview or an honest unavailable state (None)."""
    try:
        if (run['result'] not in {'passed', 'verification_failed'}
                or not UUID.fullmatch(run.get('evidence_id') or '')
                or not SHA256.fullmatch(run.get('pack_hash') or '')
                or not SHA256.fullmatch(run.get('test_hash') or '')):
            return None
        path = pack_path(root, battle, run['phase'], run['attempt'])
        # Hash and read the same open file; do not trust a stale authoring folder.
        with path.open('rb') as source:
            if path.stat().st_size > MAX_PACK_BYTES:
                return None
            digest = hashlib.sha256()
            for block in iter(lambda: source.read(1024 * 1024), b''):
                digest.update(block)
            if digest.hexdigest() != run['pack_hash']:
                return None
            source.seek(0)
            with zipfile.ZipFile(source) as archive:
                members = archive.namelist()
                if len(members) > 10000 or len(set(members)) != len(members):
                    return None
                results = [name for name in members if re.fullmatch(r'tests/[A-Za-z0-9_-]{1,120}/result.yaml', name)]
                if len(results) != 1:
                    return None
                sealed_run = bounded_member(archive, 'run.yaml', 1000000).decode('utf-8')
                result = bounded_member(archive, results[0], 1000000).decode('utf-8')
                if (not re.search(r'^run_id: ' + re.escape(run['evidence_id']) + r'\s*$', sealed_run, re.M)
                        or not re.search(r'^  sha256: sha256:' + run['test_hash'] + r'\s*$', result, re.M)):
                    return None
                status = re.search(r'^status: (\w+)[ \t]*$', result, re.M)
                allowed = {'passed'} if run['result'] == 'passed' else {'failed', 'broken'}
                if not status or status[1] not in allowed:
                    return None
                prefix = results[0].rsplit('/', 1)[0] + '/steps/'
                images = [(IMAGE.fullmatch(name), name) for name in members if name.startswith(prefix)]
                images = [(match, name) for match, name in images if match]
                failed = run['result'] == 'verification_failed'
                if failed:
                    images = [(match, name) for match, name in images
                              if match[1] + '/failure.yaml' in members]
                if not images:
                    return None
                match, name = (min if failed else max)(images, key=lambda item: int(item[0][2]))
                data = bounded_member(archive, name, MAX_IMAGE_BYTES)
                if match[3] == 'jpg':
                    if not data.startswith(b'\xff\xd8\xff') or not data.endswith(b'\xff\xd9'):
                        return None
                    mimetype = 'image/jpeg'
                else:
                    if not data.startswith(b'\x89PNG\r\n\x1a\n') or data[12:16] != b'IHDR':
                        return None
                    mimetype = 'image/png'
                return Screenshot(data, mimetype, int(match[2]),
                                  'Failure checkpoint' if failed else 'Last recorded viewport',
                                  hashlib.sha256(data).hexdigest(),
                                  recorded_amounts(archive, results[0].rsplit('/', 1)[0] + '/'))
    except (OSError, ValueError, KeyError, TypeError, UnicodeError, zipfile.BadZipFile,
            RuntimeError, EOFError, zlib.error):
        return None
