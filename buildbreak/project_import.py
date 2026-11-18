"""Bounded local ZIP intake. Imported scripts are never installed or executed."""
import ast
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import uuid
import zipfile

MAX_ZIP = 20 * 1024 * 1024
MAX_TOTAL = 80 * 1024 * 1024
MAX_FILE = 10 * 1024 * 1024
MAX_FILES = 800
PROJECT_ID = re.compile(r'[a-f0-9]{32}')
PRIVATE_DIRS = {'.git', '.venv', 'venv', 'node_modules', '__pycache__', 'instance',
                '.testmuai', '.next', 'dist', 'build', '.cache', 'secrets'}


def private_file(path):
    return (any(part.lower() in PRIVATE_DIRS for part in path.parts)
            or path.name.lower().startswith(('.env', 'credentials', 'secrets'))
            or path.suffix.lower() in {'.key', '.pem', '.db', '.sqlite', '.sqlite3', '.evidence', '.log', '.pyc'})


def inspect_project(folder, canonical):
    """Only the known app logic is supported; framework detection is not support."""
    app = folder / 'app.py'
    if app.is_file():
        try:
            same = ast.dump(ast.parse(app.read_text(encoding='utf-8-sig'))) == ast.dump(
                ast.parse((canonical / 'app.py').read_text(encoding='utf-8')))
        except (SyntaxError, UnicodeError, ValueError):
            same = False
        if same and safe_templates(folder, canonical):
            return dict(framework='Flask', adapter='breakshop', compatible=True,
                        reason='Known BreakShop application logic; original protected checkout test will be used.')
        return dict(framework='Python/Flask', adapter=None, compatible=False,
                    reason='This application needs its own validated fault families, direct invariant and acceptance tests. No imported code was run.')
    packages = sorted(folder.rglob('package.json'))
    if packages:
        try:
            package = json.loads(packages[0].read_text(encoding='utf-8'))
            if not isinstance(package, dict):
                raise ValueError('Expected package object')
            dependencies = {}
            for key in ('dependencies', 'devDependencies'):
                value = package.get(key)
                if isinstance(value, dict):
                    dependencies.update(value)
            framework = 'React / AI Studio' if 'react' in dependencies else 'JavaScript'
        except (ValueError, TypeError, UnicodeError):
            framework = 'JavaScript'
        return dict(framework=framework, adapter=None, compatible=False,
                    reason='Project imported for inspection. A React/JavaScript battle adapter is not implemented yet. No npm scripts, installs or app code were executed.')
    return dict(framework='Unknown', adapter=None, compatible=False,
                reason='No supported application layout found. Supply a source export, not a compiled website or URL.')


def safe_templates(folder, canonical):
    """Static markup can change; imported Jinja execution logic cannot."""
    from jinja2 import Environment, nodes, TemplateSyntaxError
    def shape(value):
        if isinstance(value, nodes.TemplateData):
            return ('TemplateData',)
        if isinstance(value, nodes.Node):
            return (type(value).__name__, tuple((name, shape(field)) for name, field in value.iter_fields()))
        if isinstance(value, list):
            return tuple(shape(item) for item in value)
        return value
    try:
        for name in ('shop.html', 'confirmation.html'):
            path = folder / 'templates' / name
            if not path.is_file() or path.stat().st_size > 1024 * 1024:
                return False
            actual = Environment().parse(path.read_text(encoding='utf-8'))
            expected = Environment().parse((canonical / 'templates' / name).read_text(encoding='utf-8'))
            if shape(actual) != shape(expected):
                return False
        return True
    except (OSError, UnicodeError, TemplateSyntaxError, RecursionError):
        return False


def import_zip(stream, storage, canonical):
    data = stream.read(MAX_ZIP + 1)
    if len(data) > MAX_ZIP:
        raise ValueError('ZIP exceeds the 20 MB upload limit.')
    import io
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile:
        raise ValueError('Upload a valid source ZIP.') from None
    project_id = uuid.uuid4().hex
    destination = Path(storage) / project_id
    entries, seen, total, excluded = [], set(), 0, 0
    with archive:
        members = archive.infolist()
        if len(members) > MAX_FILES:
            raise ValueError('ZIP contains too many entries; omit dependencies and build output.')
        for member in members:
            # ZipInfo.filename can normalize Windows separators or truncate NULs.
            # Validate the original archive name before any normalization.
            name = member.orig_filename
            path = PurePosixPath(name)
            mode = member.external_attr >> 16
            if (not name or '\\' in name or ':' in name or '\x00' in name or path.is_absolute()
                    or any(p in {'.', '..'} for p in name.rstrip('/').split('/'))
                    or stat.S_ISLNK(mode) or member.flag_bits & 1):
                raise ValueError('ZIP contains unsafe paths, links or encrypted entries.')
            if member.is_dir():
                continue
            folded = name.casefold()
            if folded in seen:
                raise ValueError('ZIP contains duplicate file paths.')
            seen.add(folded)
            total += member.file_size
            if member.file_size > MAX_FILE or total > MAX_TOTAL:
                raise ValueError('ZIP expands beyond the permitted size.')
            if private_file(path):
                excluded += 1
                continue
            entries.append((member, path))
        if not entries:
            raise ValueError('ZIP has no usable source files.')
        # Remove one common wrapping folder, as produced by common source exports.
        prefix = entries[0][1].parts[0]
        wrapped = all(len(path.parts) > 1 and path.parts[0] == prefix for _, path in entries)
        source = destination / 'source'
        source.mkdir(parents=True)
        manifest = {}
        for member, path in entries:
            parts = path.parts[1:] if wrapped else path.parts
            target = source.joinpath(*parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            content = archive.read(member)
            if len(content) != member.file_size:
                raise ValueError('ZIP file size mismatch.')
            target.write_bytes(content)
            manifest['/'.join(parts)] = hashlib.sha256(content).hexdigest()
    compatibility = inspect_project(source, Path(canonical))
    record = dict(id=project_id, files=len(entries), excluded=excluded, **compatibility)
    (destination / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True), encoding='utf-8')
    (destination / 'project.json').write_text(json.dumps(record), encoding='utf-8')
    return record


def load_project(storage, project_id):
    if not isinstance(project_id, str) or not PROJECT_ID.fullmatch(project_id):
        raise ValueError('Invalid project reference.')
    folder = Path(storage) / project_id
    if folder.is_symlink() or not folder.is_dir():
        raise ValueError('Project is unavailable.')
    try:
        record = json.loads((folder / 'project.json').read_text(encoding='utf-8'))
        manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    except (OSError, ValueError):
        raise ValueError('Project metadata is unavailable.') from None
    for name, expected in manifest.items():
        path = folder / 'source' / name
        if (path.is_symlink() or not path.resolve().is_relative_to((folder / 'source').resolve())
                or hashlib.sha256(path.read_bytes()).hexdigest() != expected):
            raise ValueError('Imported files changed; import the ZIP again before approval.')
    record.update(inspect_project(folder / 'source', Path(__file__).resolve().parents[1]))
    return folder, record
