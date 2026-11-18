"""Real local API tests; fixture attendees never represent live customer data."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('seatpilot_runtime', Path(__file__).with_name('app.py'))
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


class SeatPilotTests(unittest.TestCase):
    def setUp(self):
        temporary_root = Path(__file__).with_name('instance')
        temporary_root.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temporary_root)
        self.database = str(Path(self.temp.name) / 'bookings.sqlite3')
        self.app = runtime.create_app(dict(TESTING=True, DATABASE=self.database))
        self.client = self.app.test_client()
        self.payload = dict(eventId='evt-nocturne-symphony', quantity=2, discountCode='EARLY15',
                            attendee=dict(fullName='Arena Tester',email='arena@example.com',phone='312-555-0148'))

    def tearDown(self):
        self.temp.cleanup()

    def test_early_discount_is_server_calculated(self):
        response = self.client.post('/api/quote',json=self.payload)
        self.assertEqual(response.status_code,200)
        self.assertEqual([response.json[k] for k in ['subtotal','discountAmount','total']], [136,20.4,115.6])
        self.assertEqual(response.json['validatedBy'],'server')

    def test_half_up_rounding(self):
        self.assertEqual(runtime.pricing(110,1,'EARLY15')[:3],(110,17,93))

    def test_member_cap(self):
        response=self.client.post('/api/quote',json=dict(self.payload,eventId='evt-kinetica-forum',quantity=8,discountCode='MEMBER25'))
        self.assertEqual(response.status_code,400)  # This event's independent cap is six.
        response=self.client.post('/api/quote',json=dict(self.payload,eventId='evt-kinetica-forum',quantity=6,discountCode='MEMBER25'))
        self.assertEqual(response.json['discountAmount'],60)
        self.assertEqual(response.json['total'],510)

    def test_flat_discount_minimum(self):
        response=self.client.post('/api/quote',json=dict(self.payload,eventId='evt-solstice-film',quantity=1,discountCode='MATINEE10'))
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.json['error'],'DISCOUNT_MINIMUM_NOT_MET')
        response=self.client.post('/api/quote',json=dict(self.payload,quantity=1,discountCode='MATINEE10'))
        self.assertEqual(response.json['total'],58)

    def test_bad_quantities(self):
        for quantity in [0,-1,1.5,True,'2',9]:
            self.assertEqual(self.client.post('/api/quote',json=dict(self.payload,quantity=quantity)).status_code,400)

    def test_unknown_event_and_bad_coupon(self):
        self.assertEqual(self.client.post('/api/quote',json=dict(self.payload,eventId='unknown')).status_code,404)
        self.assertEqual(self.client.post('/api/quote',json=dict(self.payload,discountCode='BAD')).status_code,400)
        self.assertEqual(self.client.post('/api/quote',json=dict(self.payload,discountCode=False)).status_code,400)

    def test_quote_does_not_consume_inventory(self):
        self.client.post('/api/quote',json=self.payload)
        self.assertEqual(self.client.get('/api/events').json[0]['availableSeats'],42)

    def test_forged_prices_are_ignored(self):
        response=self.client.post('/api/bookings',json=dict(self.payload,unitPrice=1,total=0,discountAmount=999))
        self.assertEqual(response.status_code,201)
        self.assertEqual(response.json['total'],115.6)

    def test_booking_persists_and_inventory_is_reduced(self):
        response=self.client.post('/api/bookings',json=self.payload)
        self.assertEqual(response.status_code,201)
        reference=response.json['id']
        self.assertEqual(self.client.get('/api/events').json[0]['availableSeats'],40)
        other=runtime.create_app(dict(TESTING=True,DATABASE=self.database)).test_client()
        self.assertEqual(other.get('/api/bookings/'+reference).json,response.json)

    def test_capacity_cannot_be_oversold(self):
        for _ in range(5):
            self.assertEqual(self.client.post('/api/bookings',json=dict(self.payload,quantity=8)).status_code,201)
        self.assertEqual(self.client.post('/api/bookings',json=dict(self.payload,quantity=3)).status_code,409)
        self.assertEqual(self.client.get('/api/events').json[0]['availableSeats'],2)

    def test_attendee_validation(self):
        for attendee in [{},dict(fullName='A',email='bad',phone='1'),dict(fullName='Tester',email='bad',phone='3125550148')]:
            self.assertEqual(self.client.post('/api/bookings',json=dict(self.payload,attendee=attendee)).status_code,400)
        self.assertEqual(self.client.get('/api/events').json[0]['availableSeats'],42)

    def test_no_seeded_booking_or_non_json_fixture_response(self):
        self.assertEqual(self.client.get('/api/bookings/SP-204810').status_code,404)
        self.assertEqual(self.client.get('/api/unknown').status_code,404)
        self.assertEqual(self.client.get('/api/unknown').content_type,'application/json')
        self.assertEqual(self.client.post('/api/bookings',json=[]).status_code,400)


if __name__=='__main__':
    unittest.main()
