"""SeatPilot's real local demo API, implemented from the supplied API contract.

No payments, seeded bookings, browser fixture fallback or production guarantees.
"""
from datetime import datetime, timezone
from contextlib import contextmanager
from decimal import Decimal, ROUND_HALF_UP
import json
from pathlib import Path
import re
import sqlite3
import uuid

from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parent
CATALOG = json.loads((ROOT / 'catalog.json').read_text(encoding='utf-8'))
EVENTS = {event['id']: event for event in CATALOG}


class InvalidBooking(ValueError):
    def __init__(self, code, message, field=None, status=400):
        self.code, self.message, self.field, self.status = code, message, field, status


def pricing(unit_cents, quantity, code):
    subtotal = unit_cents * quantity
    discount = 0
    label = None
    if code == 'EARLY15':
        discount = int((Decimal(subtotal) * Decimal('0.15')).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
        label = '15% early reservation discount'
    elif code == 'MEMBER25':
        discount = min(6000, int((Decimal(subtotal) * Decimal('0.25')).quantize(Decimal('1'), rounding=ROUND_HALF_UP)))
        label = '25% patron discount (up to $60.00)'
    elif code == 'MATINEE10':
        if subtotal < 5000:
            raise InvalidBooking('DISCOUNT_MINIMUM_NOT_MET', 'MATINEE10 requires a subtotal of at least $50.00.', 'discountCode')
        discount = 1000
        label = '$10.00 off orders of $50.00 or more'
    elif code:
        raise InvalidBooking('INVALID_DISCOUNT_CODE', 'Discount code is invalid or expired.', 'discountCode')
    discount = min(subtotal, discount)
    return subtotal, discount, subtotal - discount, label


def text(value, field, maximum=500):
    if not isinstance(value, str) or len(value) > maximum:
        raise InvalidBooking('INVALID_' + field.upper(), 'Invalid ' + field + '.', field)
    return value.strip()


def quote(connection, payload):
    if not isinstance(payload, dict):
        raise InvalidBooking('INVALID_REQUEST', 'Expected a JSON object.')
    event_id = payload.get('eventId')
    if not isinstance(event_id, str) or event_id not in EVENTS:
        raise InvalidBooking('EVENT_NOT_FOUND', 'The selected event does not exist.', 'eventId', 404)
    event = EVENTS[event_id]
    quantity = payload.get('quantity')
    if type(quantity) is not int or quantity < 1:
        raise InvalidBooking('INVALID_QUANTITY', 'Ticket quantity must be an integer of at least 1.', 'quantity')
    if quantity > event['maxPerBooking']:
        raise InvalidBooking('MAX_QUANTITY_EXCEEDED', 'Maximum ticket quantity exceeded.', 'quantity')
    remaining = connection.execute('SELECT remaining FROM inventory WHERE event_id=?', (event_id,)).fetchone()[0]
    if quantity > remaining:
        raise InvalidBooking('INSUFFICIENT_SEATS', 'Not enough seats remain.', 'quantity', 409)
    raw_code = payload.get('discountCode')
    code = text('' if raw_code is None else raw_code, 'discountCode', 50).upper()
    unit = int(Decimal(str(event['unitPrice'])) * 100)
    subtotal, discount, total, label = pricing(unit, quantity, code)
    return dict(eventId=event_id, eventTitle=event['title'], quantity=quantity, unitPrice=unit / 100,
                subtotal=subtotal / 100, discountCode=code or None, discountLabel=label,
                discountAmount=discount / 100, total=total / 100, currency='USD', validatedBy='server')


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    app.config.update(DATABASE=str(ROOT / 'instance/seatpilot.sqlite3'))
    app.config.update(config or {})
    Path(app.config['DATABASE']).parent.mkdir(parents=True, exist_ok=True)
    @contextmanager
    def db():
        connection = sqlite3.connect(app.config['DATABASE'], timeout=10)
        try:
            with connection:
                yield connection
        finally:
            connection.close()
    with db() as connection:
        connection.executescript('CREATE TABLE IF NOT EXISTS inventory(event_id TEXT PRIMARY KEY, remaining INTEGER NOT NULL CHECK(remaining>=0));'
                                 'CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, payload TEXT NOT NULL);')
        connection.executemany('INSERT OR IGNORE INTO inventory VALUES (?,?)',
                              [(event['id'], event['availableSeats']) for event in CATALOG])

    @app.errorhandler(InvalidBooking)
    def invalid(error):
        return jsonify(error=error.code, message=error.message, field=error.field), error.status

    @app.get('/api/events')
    def events():
        with db() as connection:
            counts = dict(connection.execute('SELECT event_id,remaining FROM inventory'))
        return jsonify([dict(event, availableSeats=counts[event['id']]) for event in CATALOG])

    @app.post('/api/quote')
    def calculate_quote():
        with db() as connection:
            return jsonify(quote(connection, request.get_json(silent=True)))

    @app.post('/api/bookings')
    def book():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict) or not isinstance(payload.get('attendee'), dict):
            raise InvalidBooking('INVALID_ATTENDEE', 'Fictional attendee details are required.', 'attendee')
        attendee = payload['attendee']
        person = {name: text(attendee.get(name, ''), name) for name in ('fullName', 'email', 'phone', 'notes')}
        if len(person['fullName']) < 2:
            raise InvalidBooking('INVALID_ATTENDEE_NAME', 'Please enter a full name.', 'fullName')
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', person['email']):
            raise InvalidBooking('INVALID_ATTENDEE_EMAIL', 'Please enter a valid email address.', 'email')
        if len(re.sub(r'\D', '', person['phone'])) < 7:
            raise InvalidBooking('INVALID_ATTENDEE_PHONE', 'Please enter a fictional phone number.', 'phone')
        with db() as connection:
            connection.execute('BEGIN IMMEDIATE')
            result = quote(connection, payload)
            event = EVENTS[result['eventId']]
            record = dict(result, id='SP-' + uuid.uuid4().hex[:10].upper(), status='confirmed',
                createdAt=datetime.now(timezone.utc).isoformat(), eventCategory=event['category'],
                venue=event['venue'], city=event['city'], dateLabel=event['dateLabel'],
                timeLabel=event['timeLabel'], attendee=person)
            connection.execute('UPDATE inventory SET remaining=remaining-? WHERE event_id=?',
                               (result['quantity'], result['eventId']))
            connection.execute('INSERT INTO bookings VALUES (?,?)', (record['id'], json.dumps(record)))
        return jsonify(record), 201

    @app.get('/api/bookings/<reference>')
    def booking(reference):
        with db() as connection:
            row = connection.execute('SELECT payload FROM bookings WHERE id=?', (reference.strip().upper(),)).fetchone()
        if row is None:
            raise InvalidBooking('BOOKING_NOT_FOUND', 'No saved booking with this reference.', status=404)
        return jsonify(json.loads(row[0]))

    @app.get('/')
    def index():
        return send_from_directory(ROOT / 'site', 'index.html')

    @app.get('/<path:filename>')
    def assets(filename):
        if filename.startswith('api/'):
            return jsonify(error='NOT_FOUND', message='Unknown API endpoint.'), 404
        return send_from_directory(ROOT / 'site', filename)
    return app


if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5002)
