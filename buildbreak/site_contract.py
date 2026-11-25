"""Portable, data-only drills for a developer's own static site export."""
from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import json
import mimetypes
from pathlib import Path
import re
from threading import Thread

from flask import Flask, Response, abort
from werkzeug.serving import make_server

TEST = Path('.testmuai/tests/SiteContract_test.md')
MAX_VALUE = 1_000_000_000
IDENTIFIER = re.compile(r'[A-Za-z][A-Za-z0-9_-]{0,63}')
FILE = re.compile(r'[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?:/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)*')
VALUE = re.compile(r'[$£€]?\d{1,12}(?:\.\d{1,4})?%?')
EXTENSIONS = {'.html', '.css', '.js', '.mjs', '.json', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2'}


@dataclass
class Site:
    name: str
    assets: dict
    data_file: str
    field: str
    result_id: str
    expected: str
    click_id: str

    @property
    def data(self):
        return json.loads(self.assets[self.data_file])

    def test(self):
        action = (f'Click the control with HTML id {self.click_id} once.' if self.click_id else
                  'Wait for the initial page to finish loading.')
        return (f"---\nmode: testing\nmax_steps: 30\ntimeout: 180\ntarget: chrome\n---\n\n"
                f"# {self.name} release check\n\n"
                "## Step 1\nOpen the supplied local start URL in Chrome.\n\n"
                "## Step 2\nVerify that the site rendered a visible page.\n\n"
                f"## Step 3\n{action}\n\n"
                f"## Step 4\nFind the visible result with HTML id {self.result_id}. Read its displayed text.\n\n"
                f"## Step 5\nAssert that the trimmed text of that result equals exactly {self.expected}. "
                "Use the displayed result on this page.\n").encode('utf-8')


def read_site(folder):
    folder = Path(folder)
    def read(relative, limit):
        path = folder / relative
        if (not path.resolve().is_relative_to(folder.resolve()) or path.is_symlink()
                or not path.is_file() or path.stat().st_size > limit):
            raise ValueError('A declared site file is missing, linked or too large.')
        return path.read_bytes()
    try:
        spec = json.loads(read('arena.json', 16384))
    except (UnicodeError, json.JSONDecodeError, RecursionError):
        raise ValueError('arena.json must contain a valid JSON object.') from None
    fields = {'version', 'name', 'assets', 'data_file', 'field', 'result_id', 'expected_text'}
    if (not isinstance(spec, dict) or not fields <= spec.keys() <= fields | {'click_id'}
            or type(spec['version']) is not int or spec['version'] != 1):
        raise ValueError('Use the documented version 1 arena.json fields.')
    def valid(key, pattern):
        return isinstance(spec.get(key), str) and re.fullmatch(pattern, spec[key])
    if not valid('name', r'[A-Za-z0-9][A-Za-z0-9 -]{0,49}'):
        raise ValueError('Use a short project name with letters, numbers, spaces or hyphens.')
    if (not valid('field', IDENTIFIER) or not valid('result_id', IDENTIFIER)
            or ('click_id' in spec and not valid('click_id', IDENTIFIER)) or not valid('expected_text', VALUE)):
        raise ValueError('Supply element IDs, a top-level JSON field and an exact numeric display value.')
    files = spec['assets']
    if (not isinstance(files, list) or not 2 <= len(files) <= 200
            or any(not isinstance(f, str) or len(f) > 180 or not FILE.fullmatch(f)
                   or Path(f).suffix.lower() not in EXTENSIONS for f in files)
            or len(set(f.casefold() for f in files)) != len(files) or 'index.html' not in files
            or not isinstance(spec['data_file'], str) or spec['data_file'] not in files
            or not spec['data_file'].endswith('.json')):
        raise ValueError('List index.html, the public JSON data file and all required browser assets.')
    assets = {}
    total = 0
    for f in files:
        data = read(Path('site') / f, 10 * 1024 * 1024)
        total += len(data)
        if total > 80 * 1024 * 1024:
            raise ValueError('Site assets exceed 80 MB.')
        assets[f] = data
    site = Site(spec['name'], assets, spec['data_file'], spec['field'], spec['result_id'],
                spec['expected_text'], spec.get('click_id', ''))
    try:
        data = site.data
    except (UnicodeError, ValueError, RecursionError):
        raise ValueError('The selected data file must be a JSON object.') from None
    val = data.get(site.field) if isinstance(data, dict) else None
    if type(val) is not int or not 0 <= val <= MAX_VALUE:
        raise ValueError('The approved data field must contain a nonnegative integer within the documented range.')
    return site


def save_site(folder, target):
    """Copy exactly the reviewed bytes into a private launch snapshot."""
    site = read_site(folder)
    target.mkdir(parents=True, exist_ok=False)
    for name, data in site.assets.items():
        dest = target / 'site' / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    (target / 'arena.json').write_bytes((folder / 'arena.json').read_bytes())
    return read_site(target)


@contextmanager
def serve(site, value):
    app = Flask(__name__, static_folder=None)
    @app.get('/')
    @app.get('/<path:name>')
    def asset(name='index.html'):
        if name not in site.assets:
            abort(404)
        data = site.assets[name]
        if name == site.data_file:
            config = site.data
            config[site.field] = value
            data = json.dumps(config).encode()
        mime = mimetypes.guess_type(name)[0] or 'application/octet-stream'
        if name.endswith(('.mjs', '.js')):
            mime = 'text/javascript'
        return Response(data, mimetype=mime, headers={
            'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
                                       "connect-src 'self'; img-src 'self' data:; font-src 'self'; form-action 'none'; "
                                       "frame-ancestors 'none'; base-uri 'none'; worker-src 'none'",
        })
    with make_server('127.0.0.1', 0, app, threaded=True) as server:
        worker = Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            yield f'http://127.0.0.1:{server.server_port}'
        finally:
            server.shutdown()
            worker.join()


def observe(site, url):
    """Independent UI observation. Only a rendered numeric value qualifies."""
    from playwright.sync_api import sync_playwright
    from .live_browser import chrome_executable
    with sync_playwright() as pw, pw.chromium.launch(executable_path=str(chrome_executable())) as browser:
        page = browser.new_page(service_workers='block')
        page.set_default_timeout(7000)
        page.route('**/*', lambda r: r.continue_() if r.request.url.startswith(url + '/')
                   and r.request.method == 'GET' else r.abort())
        fetched = []
        page.on('response', lambda r: fetched.append(r.status) if r.url == url + '/' + site.data_file else None)
        page.goto(url, wait_until='load')
        if site.click_id:
            page.locator('#' + site.click_id).click()
        result = page.locator('#' + site.result_id)
        result.wait_for(state='visible')
        page.wait_for_load_state('networkidle')
        value = result.inner_text().strip()
        if (not fetched or 200 not in fetched or not VALUE.fullmatch(value) or page.url.split('#')[0] != url + '/'):
            raise ValueError('The site must load the declared fixture and show one numeric result on the entry page.')
        return value


def different(value):
    return value + 1 if value < MAX_VALUE else value - 1


def preview(folder):
    site = read_site(folder)
    healthy = site.data[site.field]
    with serve(site, healthy) as url:
        baseline = observe(site, url)
    if baseline != site.expected:
        raise ValueError('The healthy browser result differs from the approved expected text.')
    with serve(site, different(healthy)) as url:
        changed = observe(site, url)
    if changed == baseline:
        raise ValueError('The controlled change did not affect the measured result.')
    return {'project': site.name, 'method': 'local Chrome preflight', 'healthy': baseline,
            'changed': changed, 'test_sha256': hashlib.sha256(site.test()).hexdigest()}


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Preview one isolated site contract in Chrome without agent calls.')
    parser.add_argument('folder', type=Path)
    print(json.dumps(preview(parser.parse_args().folder), indent=2))
