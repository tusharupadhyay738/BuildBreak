"""Validate bounded BreakShop mutations outside the battle's working copy.

This supports explicit pricing and cart-quantity invariants, not arbitrary apps.
Generated Python is constrained structurally before any candidate is executed.
"""
import ast
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

from process_control import run


class InvalidFault(ValueError):
    pass


INVARIANTS = {'pricing': 'saved_checkout_amounts', 'cart_quantity': 'quantity_0_99'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def protected(workspace, manifest, allow_app=False):
    for name, expected in manifest.items():
        path = workspace / name
        if path.is_symlink() or not path.resolve().is_relative_to(workspace.resolve()):
            raise InvalidFault('Unsafe source or protected file.')
        if allow_app and name == 'app.py':
            continue
        if not path.is_file() or sha(path) != expected:
            raise InvalidFault('Protected source or acceptance-test hash changed.')


class PricingShape(ast.NodeTransformer):
    def visit_Constant(self, node):
        if type(node.value) in (int, float):
            return ast.copy_location(ast.Constant(value=0), node)
        return node

    def visit_Call(self, node):
        if (isinstance(node.func, ast.Name) and node.func.id == 'Decimal'
                and len(node.args) == 1 and isinstance(node.args[0], ast.Constant)
                and isinstance(node.args[0].value, str)):
            from decimal import Decimal, InvalidOperation
            try:
                number = Decimal(node.args[0].value)
                if not number.is_finite() or abs(number) > 10000:
                    raise InvalidFault('Decimal constant outside the supported range.')
            except InvalidOperation:
                raise InvalidFault('Invalid Decimal constant.') from None
            node.args[0] = ast.Constant(value='number')
        return self.generic_visit(node)

    def visit_BinOp(self, node):
        if not isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod)):
            raise InvalidFault('Unsupported arithmetic operator.')
        node.op = ast.Add()
        return self.generic_visit(node)


def source_shape(source):
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == 'pricing':
            PricingShape().visit(node)
        if (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                and node.func.attr == 'execute' and len(node.args) == 2
                and isinstance(node.args[0], ast.Constant)
                and isinstance(node.args[0].value, str)
                and node.args[0].value.startswith('INSERT OR IGNORE INTO orders ')
                and isinstance(node.args[1], ast.Tuple)):
            values = node.args[1].elts
            if len(values) == 8:
                for index in (4, 5, 6):
                    value = values[index]
                    if not isinstance(value, ast.Name) or value.id not in {'subtotal', 'discount', 'total'}:
                        raise InvalidFault('Saved amounts must use existing pricing variables.')
                    values[index] = ast.Constant(value='amount')
    return ast.dump(tree, include_attributes=False)


def quantity_shape(source):
    """Only the integer upper bound in cart's exact quantity guard may vary."""
    tree = ast.parse(source)
    matched = 0
    for function in ast.walk(tree):
        if not isinstance(function, ast.FunctionDef) or function.name != 'cart':
            continue
        for node in ast.walk(function):
            if (isinstance(node, ast.Compare) and isinstance(node.left, ast.Constant)
                    and type(node.left.value) is int and node.left.value == 0
                    and len(node.ops) == 2 and all(isinstance(op, ast.LtE) for op in node.ops)
                    and isinstance(node.comparators[0], ast.Name)
                    and node.comparators[0].id == 'quantity'
                    and isinstance(node.comparators[1], ast.Constant)
                    and type(node.comparators[1].value) is int
                    and 1 <= node.comparators[1].value <= 100):
                node.comparators[1] = ast.Constant(value='quantity-cap')
                matched += 1
    if matched != 1:
        raise InvalidFault('Expected one bounded cart quantity guard.')
    return ast.dump(tree, include_attributes=False)


def patch_details(workspace, proposal):
    if (not isinstance(proposal, dict) or set(proposal) != {'file', 'old_text', 'new_text', 'description'}
            or any(not isinstance(value, str) for value in proposal.values())):
        raise InvalidFault('Expected exactly file, old_text, new_text and description strings.')
    if proposal['file'] != 'app.py':
        raise InvalidFault('Only app.py is allowed; tests, paths and configuration are protected.')
    path = workspace / 'app.py'
    if path.is_symlink() or not path.resolve().is_relative_to(workspace.resolve()):
        raise InvalidFault('Unsafe application path.')
    old, new = proposal['old_text'], proposal['new_text']
    if (not old.strip() or not new.strip() or old == new
            or max(len(old), len(new)) > 500
            or max(len(old.splitlines()), len(new.splitlines())) > 6
            or not 1 <= len(proposal['description']) <= 1000):
        raise InvalidFault('Patch must be a bounded, nonempty replacement, not a full-file rewrite.')
    source = path.read_text(encoding='utf-8')
    if source.count(old) != 1:
        raise InvalidFault('old_text must appear exactly once.')
    candidate = source.replace(old, new, 1)
    try:
        if ast.dump(ast.parse(candidate)) == ast.dump(ast.parse(source)):
            raise InvalidFault('Patch does not change executable behavior.')
        if source_shape(candidate) == source_shape(source):
            family = 'pricing'
        elif quantity_shape(candidate) == quantity_shape(source):
            family = 'cart_quantity'
        else:
            raise InvalidFault('Edit must stay inside one pricing or cart-quantity family.')
    except (SyntaxError, RecursionError):
        raise InvalidFault('Patch is not valid supported Python.') from None
    return candidate, family


def patch_source(workspace, proposal):
    return patch_details(workspace, proposal)[0]


def fault_family(workspace, proposal):
    return patch_details(workspace, proposal)[1]


# Trusted check fixed before mutation. Never import pricing() to compute expectations.
# Uses a fresh DB and checks persisted values, independently of Kane's browser assertions.
DIRECT_SCRIPT = r'''
import json, sqlite3, sys
from app import create_app
application = create_app({'TESTING': True, 'SECRET_KEY': 'local-drill-fixture', 'DATABASE': sys.argv[1]})
client = application.test_client()
if client.get('/').status_code != 200:
    raise RuntimeError('Application did not boot')
with client.session_transaction() as state:
    token = state['checkout_token']
for product, quantity in [('1', '2'), ('3', '1')]:
    response = client.post('/cart', data={'token': token, 'product': product, 'quantity': quantity})
    if response.status_code != 302:
        raise RuntimeError('Checkout fixture could not add products')
if client.post('/coupon', data={'token': token, 'coupon': 'SAVE10'}).status_code != 302:
    raise RuntimeError('Checkout fixture could not apply coupon')
response = client.post('/checkout', data={'token': token, 'name': 'Arena Tester',
                       'email': 'arena@example.com', 'address': '123 Test Lane, Demo City'})
if response.status_code != 302 or not response.location.startswith('/orders/'):
    raise RuntimeError('Checkout fixture could not create an order')
if client.get(response.location).status_code != 200:
    raise RuntimeError('Order confirmation did not load')
with sqlite3.connect(sys.argv[1]) as database:
    rows = database.execute('SELECT subtotal,discount,total FROM orders').fetchall()
if len(rows) != 1 or any(type(value) is not int for value in rows[0]):
    raise RuntimeError('Checkout fixture did not produce one numeric order')
expected = [1999 * 2 + 499, (4497 * 10 + 50) // 100, 4497 - 450]
print(json.dumps({'expected_cents': expected, 'actual_cents': list(rows[0]),
                  'passed': list(rows[0]) == expected, 'booted': True}))
'''

TEST_SCRIPT = r'''
import json, unittest
suite = unittest.defaultTestLoader.loadTestsFromName('test_app')
result = unittest.TextTestRunner(verbosity=2).run(suite)
print(json.dumps({'run': result.testsRun, 'failures': len(result.failures),
                  'errors': len(result.errors), 'skipped': len(result.skipped),
                  'unexpected_successes': len(result.unexpectedSuccesses),
                  'expected_failures': len(result.expectedFailures)}))
'''


# Separate direct API/session invariant: no pricing() or Kane-generated logic.
QUANTITY_SCRIPT = r'''
import json, sys
from app import create_app
application = create_app({'TESTING': True, 'SECRET_KEY': 'local-quantity-fixture', 'DATABASE': sys.argv[1]})
client = application.test_client()
if client.get('/').status_code != 200:
    raise RuntimeError('Application did not boot')
with client.session_transaction() as state:
    token = state['checkout_token']
def submit(quantity):
    response = client.post('/cart', data={'token': token, 'product': '1', 'quantity': str(quantity)})
    with client.session_transaction() as state:
        cart = dict(state.get('cart', {}))
    return {'status': response.status_code, 'cart': cart}
actual = {'accept_99': submit(99), 'reject_100': submit(100), 'remove_0': submit(0)}
expected = {'accept_99': {'status': 302, 'cart': {'1': 99}},
            'reject_100': {'status': 400, 'cart': {'1': 99}},
            'remove_0': {'status': 302, 'cart': {}}}
print(json.dumps({'passed': actual == expected, 'booted': True,
                  'expected': expected, 'actual': actual}))
'''


def json_command(python, script, workspace, artifacts, name, args=()):
    try:
        result = run([python, '-c', script, *map(str, args)], cwd=workspace, timeout=120,
                     environment='app')
    except subprocess.TimeoutExpired:
        raise InvalidFault(name + ' exceeded its deadline.') from None
    (artifacts / (name + '.log')).write_text(result.stdout + result.stderr, encoding='utf-8')
    try:
        if result.returncode:
            raise ValueError()
        return json.loads(result.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        raise InvalidFault(name + ' failed to produce a valid result; inspect private logs.') from None


def direct_check(workspace, artifacts, python, family='pricing'):
    if family not in INVARIANTS:
        raise InvalidFault('Unknown direct invariant family.')
    artifacts.mkdir(parents=True, exist_ok=False)
    script = DIRECT_SCRIPT if family == 'pricing' else QUANTITY_SCRIPT
    result = json_command(python, script, workspace, artifacts, 'direct-check',
                          [artifacts.resolve() / 'direct.sqlite3'])
    (artifacts / 'result.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    return result


def validate_fault(workspace, artifacts, python, manifest, proposal, server_class):
    """Return validated source; never apply rejected candidates to the battle copy."""
    protected(workspace, manifest)
    candidate, family = patch_details(workspace, proposal)
    artifacts.mkdir(parents=True, exist_ok=False)
    if family == 'cart_quantity':
        healthy = direct_check(workspace, artifacts / 'healthy-quantity', python, family=family)
        if healthy['passed'] is not True:
            raise InvalidFault('Healthy cart quantity invariant failed; drill is invalid.')
    copy = artifacts / 'workspace'
    for name in manifest:
        target = copy / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(workspace / name, target)
    (copy / 'app.py').write_text(candidate, encoding='utf-8')
    protected(copy, manifest, allow_app=True)
    server = server_class(copy.resolve(), artifacts.resolve(), python)
    try:
        server.start()
    except (RuntimeError, OSError):
        raise InvalidFault('Patched application failed the HTTP boot check.') from None
    finally:
        server.stop()
    tests = json_command(python, TEST_SCRIPT, copy, artifacts, 'app-tests')
    passed = tests['run'] - sum(tests[key] for key in
                               ('failures', 'errors', 'skipped', 'expected_failures', 'unexpected_successes'))
    if tests['errors'] or tests['unexpected_successes'] or not tests['failures'] or passed < 1:
        raise InvalidFault('Mutation must cause assertion failures while some app tests pass, without test errors.')
    observation = direct_check(copy, artifacts / 'direct', python, family=family)
    if observation['passed']:
        raise InvalidFault('Selected direct invariant still passes; fault is unproven for this drill.')
    protected(copy, manifest, allow_app=True)
    protected(workspace, manifest)
    (artifacts / 'validation.json').write_text(json.dumps({
        'family': family, 'invariant': INVARIANTS[family], 'tests': tests, 'direct': observation
    }, indent=2), encoding='utf-8')
    return candidate
