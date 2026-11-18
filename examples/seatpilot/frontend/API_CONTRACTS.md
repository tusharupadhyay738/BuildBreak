# SeatPilot Backend API Contracts (Flask Reference)

The SeatPilot frontend isolates all data access inside `src/api/seatpilotClient.ts` and expects a Flask backend implementing the four endpoints documented below. All prices, discount calculations, seat capacities, and booking totals **must** be validated server-side.

In the design preview, requests automatically fall back to explicitly labeled demo fixtures (`src/data/demoFixtures.ts`) when no JSON Flask backend is attached.

---

## 1. `GET /api/events`

Returns the list of available events with authoritative server-side ticket prices and live remaining seat counts.

### Response (`200 OK`)

```json
[
  {
    "id": "evt-nocturne-symphony",
    "title": "Nocturne Symphony: Glass & Strings",
    "category": "Chamber & Electronic",
    "dateLabel": "Fri, Dec 11, 2026",
    "timeLabel": "8:00 PM CST",
    "venue": "Meridian Concert Hall",
    "city": "Chicago, IL",
    "unitPrice": 68.0,
    "currency": "USD",
    "availableSeats": 42,
    "maxPerBooking": 8,
    "imageUrl": "/src/assets/images/event_nocturne_strings_1794927064578.jpg",
    "imageAlt": "String quartet and analog synthesizer performing under warm amber stage lights",
    "description": "An intimate candlelit performance pairing acoustic string quartet repertoire with live modular analog synthesis.",
    "highlights": [
      "Reserved acoustically balanced hall seating",
      "90-minute uninterrupted concert program",
      "Doors and acoustic listening lounge open at 7:15 PM"
    ]
  }
]
```

---

## 2. `POST /api/quote`

Computes and validates ticket subtotal, discount eligibility, and final total server-side without creating a booking.

### Request Body (`application/json`)

```json
{
  "eventId": "evt-nocturne-symphony",
  "quantity": 2,
  "discountCode": "EARLY15"
}
```

### Response (`200 OK`)

```json
{
  "eventId": "evt-nocturne-symphony",
  "eventTitle": "Nocturne Symphony: Glass & Strings",
  "quantity": 2,
  "unitPrice": 68.0,
  "subtotal": 136.0,
  "discountCode": "EARLY15",
  "discountLabel": "15% early reservation discount",
  "discountAmount": 20.4,
  "total": 115.6,
  "currency": "USD",
  "validatedBy": "server"
}
```

### Validation Error (`400 Bad Request` / `404 Not Found` / `409 Conflict`)

```json
{
  "error": "INVALID_DISCOUNT_CODE",
  "message": "Discount code \"SUMMER99\" is invalid or expired.",
  "field": "discountCode"
}
```

---

## 3. `POST /api/bookings`

Re-validates event capacity, unit price, discount code, and attendee fields server-side, persists the booking, decrements available inventory, and returns the confirmed booking record.

### Request Body (`application/json`)

```json
{
  "eventId": "evt-nocturne-symphony",
  "quantity": 2,
  "discountCode": "EARLY15",
  "attendee": {
    "fullName": "Clara Vance",
    "email": "clara.vance@example.com",
    "phone": "312-555-0148",
    "notes": "Aisle seating preferred if available."
  }
}
```

### Response (`201 Created`)

```json
{
  "id": "SP-849201",
  "status": "confirmed",
  "createdAt": "2026-11-17T14:52:00.000Z",
  "eventId": "evt-nocturne-symphony",
  "eventTitle": "Nocturne Symphony: Glass & Strings",
  "eventCategory": "Chamber & Electronic",
  "venue": "Meridian Concert Hall",
  "city": "Chicago, IL",
  "dateLabel": "Fri, Dec 11, 2026",
  "timeLabel": "8:00 PM CST",
  "quantity": 2,
  "unitPrice": 68.0,
  "subtotal": 136.0,
  "discountCode": "EARLY15",
  "discountLabel": "15% early reservation discount",
  "discountAmount": 20.4,
  "total": 115.6,
  "currency": "USD",
  "attendee": {
    "fullName": "Clara Vance",
    "email": "clara.vance@example.com",
    "phone": "312-555-0148",
    "notes": "Aisle seating preferred if available."
  },
  "validatedBy": "server"
}
```

---

## 4. `GET /api/bookings/:id`

Retrieves a previously saved booking confirmation by its reference ID so the confirmation view survives page reload.

### Response (`200 OK`)

Returns the same `BookingRecord` JSON schema as `POST /api/bookings`.

### Not Found (`404 Not Found`)

```json
{
  "error": "BOOKING_NOT_FOUND",
  "message": "No booking found with reference \"SP-000000\"."
}
```
