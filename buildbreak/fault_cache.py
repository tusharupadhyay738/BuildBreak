"""Private, content-addressed Gemini patches; validation is always repeated on replay."""
import hashlib
import json
from pathlib import Path
import re
from .fault_validator import InvalidFault, patch_source

VERSION = 1
TEST_NAME = '.testmuai/tests/CheckoutConsistency_test.md'
FIELDS = {'version', 'producer', 'model', 'origin_battle', 'bindings', 'patch', 'id'}


def identity(record):
    payload = {key: value for key, value in record.items() if key != 'id'}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(',', ':'),
                                     ensure_ascii=False).encode('utf-8')).hexdigest()


def bindings(manifest):
    return {name: manifest[name] for name in ('app.py', 'test_app.py', TEST_NAME)}


def store_fault(root, manifest, proposal, model, origin_battle=None):
    record = {'version': VERSION, 'producer': 'gemini', 'model': model,
              'origin_battle': origin_battle, 'bindings': bindings(manifest), 'patch': proposal}
    record['id'] = identity(record)
    folder = Path(root) / 'instance/fault-cache'
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / (record['id'] + '.json')
    text = json.dumps(record, indent=2, ensure_ascii=False)
    if target.is_symlink():
        raise InvalidFault('Refusing to write a cache symlink.')
    if target.exists():
        if json.loads(target.read_text(encoding='utf-8')) != record:
            raise InvalidFault('Existing cache record disagrees with its identity.')
    else:
        with target.open('x', encoding='utf-8') as output:
            output.write(text)
    return target


def load_fault(path, workspace, manifest):
    path = Path(path)
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 16000:
        raise InvalidFault('Cache file is missing, unsafe or oversized.')
    try:
        record = json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, UnicodeError):
        raise InvalidFault('Cache is not valid JSON.') from None
    if (not isinstance(record, dict) or set(record) != FIELDS
            or type(record['version']) is not int or record['version'] != VERSION
            or record['producer'] != 'gemini'
            or not isinstance(record['model'], str)
            or not re.fullmatch(r'gemini-[A-Za-z0-9.-]{1,100}', record['model'])
            or not isinstance(record['id'], str) or record['id'] != identity(record)):
        raise InvalidFault('Unsupported or altered Gemini cache record.')
    origin = record['origin_battle']
    if origin is not None and (not isinstance(origin, str) or not re.fullmatch(r'\d{8}T\d{6}-[a-f0-9]{8}', origin)):
        raise InvalidFault('Invalid cached origin identifier.')
    if record['bindings'] != bindings(manifest):
        raise InvalidFault('Cached app or protected tests differ from this baseline; regenerate the cache.')
    patch_source(workspace, record['patch'])
    return record
