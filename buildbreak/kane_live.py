"""Opt-in local Kane monitor. Never substitute sample activity for a live run."""
import copy
import json
import queue
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
import uuid

ROOT = Path(__file__).resolve().parents[1]
TEST_PATH = '.testmuai/tests/CheckoutConsistency_test.md'
_ACTIVE_SESSION = None
_SESSION_LOCK = threading.Lock()


def validate_request(target_url, test_path, show_browser):
    if not isinstance(target_url, str) or not isinstance(test_path, str) or type(show_browser) is not bool:
        raise ValueError('Expected a local URL, the protected test path and a browser boolean.')
    try:
        url = urlsplit(target_url)
        valid = (url.scheme == 'http' and url.hostname in {'localhost', '127.0.0.1'}
                 and url.username is None and url.password is None
                 and url.port is not None and 1024 <= url.port <= 65535
                 and url.path in {'', '/'} and not url.query and not url.fragment)
    except ValueError:
        valid = False
    if not valid or any(c.isspace() for c in target_url):
        raise ValueError('Use a local demo URL such as http://127.0.0.1:5000, without credentials or query strings.')
    if test_path != TEST_PATH:
        raise ValueError('Only the protected CheckoutConsistency test can be launched here.')


def resolve_kane_executable():
    from .battle_runner import executable
    return executable('kane-cli')


class LiveKaneSession:
    def __init__(self, target_url, test_path=TEST_PATH, show_browser=True):
        validate_request(target_url, test_path, show_browser)
        self.target_url, self.test_path, self.show_browser = target_url, test_path, show_browser
        self.status = 'running'
        self.current_step = 0
        self.total_steps = None
        self.steps, self.listeners = [], []
        self.lock = threading.RLock()
        self.latest_screenshot = None
        self.screenshot = None
        self.browser = None
        self.live_view_url = None
        self.result = None
        self.error_message = None
        self.started_at, self.finished_at = None, None
        self.thread = None
        self.id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S-') + uuid.uuid4().hex[:8]

    def add_listener(self):
        listener = queue.Queue(maxsize=100)
        with self.lock:
            if len(self.listeners) >= 32:
                raise ValueError('Too many live viewers.')
            self.listeners.append(listener)
            listener.put(copy.deepcopy(dict(type='snapshot', status=self.status,
                target_url=self.target_url, test_path=self.test_path, current_step=self.current_step,
                total_steps=self.total_steps, steps=self.steps,
                latest_screenshot=self.latest_screenshot, message=self.error_message,
                started_at=self.started_at, live_view_url=self.live_view_url,
                phase=getattr(self, 'phase', None), battle_id=getattr(self, 'battle_id', None))))
        return listener

    def remove_listener(self, listener):
        with self.lock:
            if listener in self.listeners:
                self.listeners.remove(listener)

    def broadcast(self, event):
        with self.lock:
            for listener in self.listeners:
                if listener.full():
                    try:
                        listener.get_nowait()
                    except queue.Empty:
                        pass
                listener.put_nowait(copy.deepcopy(event))

    def run(self):
        # Lazy imports keep isolated BreakShop snapshots independent of agent modules.
        from .battle_runner import run_kane
        from .evidence_images import screenshot_for
        from .live_browser import LiveBrowser
        self.started_at = time.time()
        self.broadcast(dict(type='status', status='running', message='Starting genuine Kane verification. Watch Chrome without interacting.'))
        try:
            kane = resolve_kane_executable()
            root = ROOT / 'instance/kane-live'
            workspace = root / self.id / 'workspace'
            workspace.mkdir(parents=True, exist_ok=False)
            # Kane writes replay outputs only into its own private copy.
            test_file = workspace / TEST_PATH
            test_file.parent.mkdir(parents=True)
            test_file.write_bytes((ROOT / TEST_PATH).read_bytes())
            self.browser = LiveBrowser(workspace, self.target_url, self.show_browser, self.browser_state)
            self.browser.start()
            result = run_kane(workspace, root / self.id / 'baseline-0', self.target_url,
                              'ArenaLive-' + self.id, kane, show_browser=self.show_browser,
                              on_line=self.handle_line, cdp_endpoint=self.browser.endpoint)
            self.browser.close()
            self.result = result['result']
            self.status = {'passed': 'passed', 'verification_failed': 'failed'}.get(self.result, 'error')
            self.error_message = ('Kane could not confirm an application verdict. Check the private run logs; no pass was recorded.'
                                  if self.status == 'error' else None)
            if self.status != 'error':
                self.screenshot = screenshot_for(root, self.id, dict(result, phase='baseline', attempt=0))
                if self.screenshot:
                    self.latest_screenshot = '/api/kane/screenshot?session=' + self.id
                    self.broadcast(dict(type='screenshot', url=self.latest_screenshot))
        except Exception:
            # Never expose exception text, command lines, paths, credentials or raw logs.
            self.status, self.result = 'error', 'infrastructure_error'
            self.error_message = 'Chrome or Kane could not start or verify this run. Check Chrome, CLI installation/login and private logs. No simulation was run.'
        finally:
            if self.browser:
                self.browser.close()
            self.finished_at = time.time()
            self.broadcast(dict(type='status', status=self.status, result=self.result,
                                message=self.error_message,
                                duration=round(self.finished_at - self.started_at, 2)))

    def browser_state(self, state):
        with self.lock:
            self.live_view_url = ('/api/kane/live-view?session=' + self.id
                                  if state == 'ready' and self.status == 'running' else None)
            self.broadcast(dict(type='live_view', state=state, url=self.live_view_url))

    def handle_line(self, line):
        try:
            event = json.loads(line)
        except (ValueError, TypeError):
            return
        if isinstance(event, dict):
            self.process_ndjson_event(event)

    def process_ndjson_event(self, event):
        # Only status enums and validated integers cross the web boundary.
        # Free-form objectives, summaries and screenshot paths stay private.
        with self.lock:
            kind = event.get('type')
            idx = event.get('step_index')
            if kind not in {'test_md_step_start', 'test_md_step_end'}:
                return
            if type(idx) is not int or not 1 <= idx <= 100:
                return
            self.current_step = idx
            if kind == 'test_md_step_start':
                step = next((s for s in self.steps if s['index'] == idx), None)
                if step is None:
                    step = dict(index=idx, heading=f'Step {idx}', status='in_progress')
                    self.steps.append(step)
                self.broadcast(dict(type='step_start', step_index=idx, heading=f'Step {idx}', total_steps=None))
            else:
                status = event.get('status')
                if status not in {'passed', 'failed', 'skipped', 'broken', 'cancelled'}:
                    status = 'unknown'
                step = next((s for s in self.steps if s['index'] == idx), None)
                if step:
                    step['status'] = status
                self.broadcast(dict(type='step_end', step_index=idx, status=status, total_steps=None))


def get_active_session():
    with _SESSION_LOCK:
        return _ACTIVE_SESSION


def start_live_session(target_url, test_path=TEST_PATH, show_browser=True):
    global _ACTIVE_SESSION
    validate_request(target_url, test_path, show_browser)
    with _SESSION_LOCK:
        if _ACTIVE_SESSION and _ACTIVE_SESSION.status == 'running':
            raise ValueError('A Kane run is already active; watch it before starting another.')
        session = LiveKaneSession(target_url, test_path, show_browser)
        _ACTIVE_SESSION = session
        session.thread = threading.Thread(target=session.run, daemon=True)
        session.thread.start()
        return session
