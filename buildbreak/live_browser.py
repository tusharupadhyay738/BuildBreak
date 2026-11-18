"""Read-only viewport feed from the fresh Chrome instance owned by one run.

Only the demo origin is captured. No desktop capture, personal profile, remote
debugging proxy, input API or frame persistence is exposed to the dashboard.
"""
import base64
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import threading
import time
from urllib.parse import urlsplit
import urllib.request

MAX_FRAME = 2 * 1024 * 1024


def chrome_executable():
    candidates = [shutil.which('google-chrome'), shutil.which('chromium'), shutil.which('chrome')]
    if os.name == 'nt':
        for env in ('PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA'):
            if os.environ.get(env):
                candidates.append(str(Path(os.environ[env]) / 'Google/Chrome/Application/chrome.exe'))
    candidates.append('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(Path(candidate).resolve())
    raise RuntimeError('Chrome is required for the live browser view.')


def origin(url):
    parsed = urlsplit(url)
    return parsed.scheme, parsed.hostname, parsed.port


class CDP:
    def __init__(self, url):
        import websocket
        self.connection = websocket.create_connection(url, timeout=2, suppress_origin=True,
                                                       http_no_proxy=['127.0.0.1', 'localhost'])
        self.sequence = 0

    def call(self, method, params=None):
        self.sequence += 1
        self.connection.send(json.dumps(dict(id=self.sequence, method=method, params=params or {})))
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            message = self.connection.recv()
            if not isinstance(message, str) or len(message) > MAX_FRAME * 2:
                raise ValueError('Unexpected browser response')
            result = json.loads(message)
            if result.get('id') == self.sequence:
                if 'error' in result:
                    raise RuntimeError('Browser capture unavailable')
                return result.get('result', {})
        raise TimeoutError('Browser capture timed out')

    def close(self):
        try:
            self.connection.close(timeout=1)
        except Exception:
            pass


class LiveBrowser:
    def __init__(self, directory, target_url, show_browser, on_state):
        self.directory = Path(directory)
        self.target_url = target_url
        self.show_browser = show_browser
        self.on_state = on_state
        self.endpoint = None
        self.process = None
        self.thread = None
        self.stopped = threading.Event()
        self.changed = threading.Condition()
        self.frame = None
        self.sequence = 0
        self.captured_at = 0
        self.state = None

    def _state(self, value):
        if value != self.state:
            self.state = value
            self.on_state(value)

    def _json(self, path):
        # Only our newly created Chrome endpoint; bypass system HTTP proxies.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(self.endpoint + path, timeout=2) as response:
            data = response.read(1024 * 1024 + 1)
        if len(data) > 1024 * 1024:
            raise ValueError('Unexpected browser metadata')
        return json.loads(data)

    def start(self):
        from .process_control import spawn, child_environment
        # Fail before launching Chrome if the lightweight optional transport is missing.
        import websocket  # noqa: F401
        profile = self.directory / 'chrome-profile'
        profile.mkdir(parents=True, exist_ok=False)
        args = [chrome_executable(), '--remote-debugging-address=127.0.0.1',
                '--remote-debugging-port=0', '--user-data-dir=' + str(profile.resolve()),
                '--no-first-run', '--no-default-browser-check', '--disable-sync',
                '--disable-background-networking', '--window-size=1280,900']
        if not self.show_browser:
            args.append('--headless=new')
        args.append(self.target_url)
        self.process = spawn(args, cwd=self.directory, stdin=subprocess.DEVNULL,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             env=child_environment('app', self.directory))
        try:
            deadline = time.monotonic() + 15
            port_file = profile / 'DevToolsActivePort'
            while time.monotonic() < deadline:
                if self.process.poll() is not None:
                    raise RuntimeError('Owned Chrome exited before startup')
                if port_file.is_file():
                    lines = port_file.read_text(encoding='utf-8').splitlines()
                    port = lines[0] if lines else ''
                    if port.isdigit() and 1024 <= int(port) <= 65535:
                        self.endpoint = 'http://127.0.0.1:' + port
                        try:
                            self._json('/json/version')
                        except (OSError, ValueError):
                            self.stopped.wait(0.1)
                            continue
                        self.thread = threading.Thread(target=self._capture, daemon=True)
                        self.thread.start()
                        return self
                self.stopped.wait(0.1)
            raise TimeoutError('Owned Chrome did not become ready')
        except Exception:
            self.close()
            raise

    def allowed_page(self, page):
        try:
            url = urlsplit(page.get('webSocketDebuggerUrl', ''))
            own = urlsplit(self.endpoint)
            return (page.get('type') == 'page' and origin(page.get('url', '')) == origin(self.target_url)
                    and url.scheme == 'ws' and url.hostname == '127.0.0.1' and url.port == own.port
                    and not url.username and not url.password and not url.query and not url.fragment
                    and re.fullmatch(r'/devtools/page/[A-Za-z0-9-]+', url.path) is not None)
        except (ValueError, TypeError):
            return False

    def _capture(self):
        connection, current = None, None
        try:
            while not self.stopped.is_set():
                try:
                    pages = self._json('/json/list')
                    page = next((p for p in pages if isinstance(p, dict) and self.allowed_page(p)), None)
                    if page is None:
                        raise RuntimeError('Waiting for demo page')
                    address = page['webSocketDebuggerUrl']
                    if address != current:
                        if connection:
                            connection.close()
                        connection, current = CDP(address), address
                    # Origin checked immediately before and after each capture.
                    before = connection.call('Page.getFrameTree')['frameTree']['frame']['url']
                    if origin(before) != origin(self.target_url):
                        raise ValueError('Page left demo origin')
                    result = connection.call('Page.captureScreenshot',
                        dict(format='jpeg', quality=60, fromSurface=True, captureBeyondViewport=False))
                    after = connection.call('Page.getFrameTree')['frameTree']['frame']['url']
                    if origin(after) != origin(self.target_url):
                        raise ValueError('Page left demo origin')
                    encoded = result.get('data', '')
                    if not isinstance(encoded, str) or len(encoded) > MAX_FRAME * 2:
                        raise ValueError('Unexpected frame size')
                    frame = base64.b64decode(encoded, validate=True)
                    if len(frame) > MAX_FRAME or not frame.startswith(b'\xff\xd8\xff') or not frame.endswith(b'\xff\xd9'):
                        raise ValueError('Unexpected frame format')
                    with self.changed:
                        self.frame, self.captured_at = frame, time.monotonic()
                        self.sequence += 1
                        self.changed.notify_all()
                    self._state('ready')
                except Exception:
                    with self.changed:
                        self.frame = None
                    self._state('waiting')
                    if connection:
                        connection.close()
                    connection, current = None, None
                self.stopped.wait(0.5)
        finally:
            if connection:
                connection.close()

    def frames(self, active):
        """One shared capture loop; slow viewers skip frames, never queue them."""
        sequence = -1
        while not self.stopped.is_set() and active():
            with self.changed:
                self.changed.wait_for(lambda: (self.frame is not None and self.sequence != sequence)
                                      or self.stopped.is_set(), timeout=1)
                if self.stopped.is_set() or not active():
                    return
                frame, current = self.frame, self.sequence
                if current == sequence or frame is None or time.monotonic() - self.captured_at > 2:
                    continue
                sequence = current
            yield (b'--arena-frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' +
                   str(len(frame)).encode('ascii') + b'\r\n\r\n' + frame + b'\r\n')

    def close(self):
        from .process_control import stop_tree
        self.stopped.set()
        with self.changed:
            self.frame = None
            self.changed.notify_all()
        if self.process:
            stop_tree(self.process)
            self.process = None
        if self.thread:
            self.thread.join(timeout=4)
        self._state('ended')
