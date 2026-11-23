"""Explicit SeatPilot adapter. It does not claim support for arbitrary React apps."""
import ast
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys

from .fault_validator import InvalidFault, TEST_SCRIPT, json_command, protected
from .process_control import run

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / 'examples/seatpilot'
TEST = Path('.testmuai/tests/SeatPilotBooking_test.md')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def matches_export(folder):
    try:
        for version in ('original', 'adapted', 'adapted-v1'):
            manifest = json.loads((EXAMPLE / (version+'-source-sha256.json')).read_text(encoding='utf-8'))
            if all((folder/name).is_file() and not (folder/name).is_symlink()
                   and sha(folder/name) == expected for name, expected in manifest.items()):
                return True
        return False
    except (OSError, ValueError):
        return False


def build_frontend(notify=lambda message: None):
    """Build only the reviewed adapter toolchain, never uploaded npm scripts."""
    frontend = EXAMPLE / 'frontend'
    signature = hashlib.sha256()
    inputs = [frontend/'package-lock.json', frontend/'arena.vite.config.mjs', frontend/'index.html']
    inputs += sorted(p for p in (frontend/'src').rglob('*') if p.is_file())
    for path in inputs:
        signature.update(path.read_bytes())
    stamp = frontend/'dist/arena-build-sha256.txt'
    if stamp.is_file() and stamp.read_text() == signature.hexdigest():
        return frontend/'dist'
    npm = shutil.which('npm.cmd') or shutil.which('npm')
    if not npm:
        raise RuntimeError('Node.js and npm are required for SeatPilot.')
    if not (frontend/'node_modules/vite').is_dir():
        notify('Installing the reviewed SeatPilot build dependencies with lifecycle scripts disabled.')
        result = run([npm,'ci','--ignore-scripts','--no-audit','--no-fund','--cache',str(ROOT/'instance/npm-cache')],cwd=frontend,timeout=300,environment='app')
        if result.returncode:
            raise RuntimeError('SeatPilot dependency installation failed; no browser test was run.')
    notify('Building SeatPilot with its strict real-API client. No demo fixture fallback is enabled.')
    result = run([npm,'run','build'],cwd=frontend,timeout=120,environment='app')
    if result.returncode:
        raise RuntimeError('SeatPilot frontend build failed; no browser test was run.')
    shutil.copytree(frontend/'src/assets',frontend/'dist/src/assets',dirs_exist_ok=True)
    stamp.write_text(signature.hexdigest())
    return frontend/'dist'


def prepare_runtime(destination, build=False, notify=lambda message: None):
    destination = Path(destination)
    destination.mkdir(parents=True,exist_ok=True)
    for name in ('app.py','catalog.json','test_app.py'):
        shutil.copyfile(EXAMPLE/name,destination/name)
    (destination/TEST).parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(ROOT/TEST,destination/TEST)
    if build:
        shutil.copytree(build_frontend(notify),destination/'site',dirs_exist_ok=True)
    return destination


def snapshot(source,destination):
    files = ['app.py','catalog.json','test_app.py',TEST.as_posix()]
    files += [p.relative_to(source).as_posix() for p in (source/'site').rglob('*') if p.is_file()]
    if not (source/'site/index.html').is_file():
        raise ValueError('SeatPilot frontend is not built.')
    for name in files:
        path=source/name
        if path.is_symlink() or not path.resolve().is_relative_to(source.resolve()):
            raise ValueError('Unsafe SeatPilot source.')
        target=destination/name
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(path,target)
    return {name:sha(destination/name) for name in files}


DIRECT_SCRIPT = '''import json,sys
from app import create_app
app=create_app({'TESTING':True,'DATABASE':sys.argv[1]})
c=app.test_client()
p={'eventId':'evt-nocturne-symphony','quantity':2,'discountCode':'EARLY15','attendee':{'fullName':'Arena Tester','email':'arena@example.com','phone':'312-555-0148'}}
q=c.post('/api/quote',json=p)
b=c.post('/api/bookings',json=p)
saved=c.get('/api/bookings/'+b.json.get('id','missing')) if b.status_code==201 else None
keys=['subtotal','discountAmount','total']
amounts=lambda value:[round(value.get(k,-999)*100) for k in keys]
actual={'quote':amounts(q.json),'booking':amounts(b.json),'saved':amounts(saved.json) if saved else None,'remaining':c.get('/api/events').json[0]['availableSeats']}
expected=[13600,2040,11560]
print(json.dumps({'passed':q.status_code==200 and b.status_code==201 and saved is not None and saved.status_code==200 and all(actual[k]==expected for k in ['quote','booking','saved']) and actual['remaining']==40 and b.json.get('validatedBy')=='server','actual':actual}))
'''


def direct_check(workspace, artifacts, python):
    artifacts.mkdir(parents=True,exist_ok=False)
    result = run([python,'-c',DIRECT_SCRIPT,str((artifacts/'direct.sqlite3').resolve())],
                 cwd=workspace,timeout=30,environment='app')
    if result.returncode:
        raise InvalidFault('Independent SeatPilot check could not complete.')
    try:
        observation=json.loads(result.stdout)
    except ValueError:
        raise InvalidFault('Independent SeatPilot response was invalid.') from None
    (artifacts/'observation.json').write_text(json.dumps(observation),encoding='utf-8')
    return observation


def mutation(workspace, proposal):
    if (not isinstance(proposal,dict) or set(proposal)!={'file','old_text','new_text','description'}
            or proposal['file']!='app.py' or not all(isinstance(v,str) for v in proposal.values())):
        raise InvalidFault('Only a bounded SeatPilot app.py JSON replacement is allowed.')
    old,new=proposal['old_text'],proposal['new_text']
    if not old or old==new or any(len(t)>500 or len(t.splitlines())>6 for t in (old,new)):
        raise InvalidFault('Use one small replacement of at most six lines and 500 characters.')
    source=(workspace/'app.py').read_text(encoding='utf-8')
    if source.count(old)!=1:
        raise InvalidFault('old_text must appear exactly once.')
    candidate=source.replace(old,new,1)
    try:
        before,after=ast.parse(source),ast.parse(candidate)
    except SyntaxError:
        raise InvalidFault('Mutation must remain valid Python.') from None
    class Mask(ast.NodeTransformer):
        def visit_FunctionDef(self,node):
            if node.name!='pricing':
                return node
            return self.generic_visit(node)
        def visit_Constant(self,node):
            if type(node.value) in (int,float):
                if abs(node.value)>1000000:
                    raise InvalidFault('Pricing constants exceed the permitted range.')
                return ast.copy_location(ast.Constant(value=0),node)
            return node
        def visit_Call(self,node):
            if (isinstance(node.func,ast.Name) and node.func.id=='Decimal' and len(node.args)==1
                    and isinstance(node.args[0],ast.Constant) and isinstance(node.args[0].value,str)):
                try:
                    value=Decimal(node.args[0].value)
                    if not value.is_finite() or not 0<=value<=1:
                        raise InvalidFault('Decimal pricing constants must be between zero and one.')
                except InvalidOperation:
                    raise InvalidFault('Invalid decimal pricing constant.') from None
                node.args[0]=ast.Constant(value='0')
            return self.generic_visit(node)
    if ast.dump(Mask().visit(before))!=ast.dump(Mask().visit(after)):
        raise InvalidFault('Only numeric constants inside SeatPilot pricing() may change; routes, calls, tests and other logic are protected.')
    return candidate


def validate_fault(workspace, artifacts, python, manifest, proposal, server_class):
    protected(workspace,manifest)
    candidate=mutation(workspace,proposal)
    artifacts.mkdir(parents=True,exist_ok=False)
    copy=artifacts/'workspace'
    snapshot(workspace,copy)
    (copy/'app.py').write_text(candidate,encoding='utf-8')
    protected(copy,manifest,allow_app=True)
    checks=json_command(python,TEST_SCRIPT,copy,artifacts,'app-tests')
    if checks['run']<1 or checks['errors'] or checks['failures']>=checks['run'] or any(checks.get(k) for k in ['skipped','expected_failures','unexpected_successes']):
        raise InvalidFault('Mutation must preserve a runnable app with some passing tests and no test errors.')
    server=server_class(copy,artifacts,python)
    server.ready_marker=b'SeatPilot'
    try:
        server.start()
    finally:
        server.stop()
    observed=direct_check(copy,artifacts/'direct',python)
    protected(copy,manifest,allow_app=True)
    if observed['passed']:
        raise InvalidFault('The independent SeatPilot saved-booking invariant did not fail.')
    return candidate
