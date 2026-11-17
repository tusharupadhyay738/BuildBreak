"""Copy the built original UI into Flask without changing its presentation."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'frontend/dist'
TARGET = ROOT / 'static/console'

if not (DIST / 'index.html').is_file():
    raise SystemExit('Run npm --prefix frontend run build first.')
for folder in ('assets',):
    shutil.copytree(DIST / folder, TARGET / folder, dirs_exist_ok=True)
shutil.copytree(ROOT / 'frontend/src/assets', TARGET / 'src/assets', dirs_exist_ok=True)
html = (DIST / 'index.html').read_text(encoding='utf-8')
marker = '<script id="arena-payload" type="application/json"></script>'
assert html.count(marker) == 1
html = html.replace(marker, '<script id="arena-payload" type="application/json">'
                    '{% endraw %}{{ console_payload | tojson }}{% raw %}</script>')
# Keep the original integration-contract example literal, including its Jinja text.
html = '{% raw %}' + html + '{% endraw %}\n<noscript>{% include "arena_fallback.html" %}</noscript>'
(ROOT / 'templates/arena.html').write_text(html, encoding='utf-8')
print('Original UI exported to Flask; only the data script is server-injected.')
