import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import type { ApiExchangeRecord } from '../types/booking';

interface EndpointSpec {
  id: string;
  label: string;
  method: 'GET' | 'POST' | 'FLASK';
  path: string;
  summary: string;
  validationNotes: string[];
  requestExample: string | null;
  responseStatus: string;
  responseExample: string;
}

const FLASK_REFERENCE_SNIPPET = `from flask import Flask, jsonify, request
import uuid

app = Flask(__name__)

EVENTS = {
    "evt-nocturne-symphony": {"id": "evt-nocturne-symphony", "title": "Nocturne Symphony: Glass & Strings", "unitPrice": 68.0, "availableSeats": 42, "maxPerBooking": 8},
    "evt-solstice-film": {"id": "evt-solstice-film", "title": "Solstice Film & Sound Retrospective", "unitPrice": 44.0, "availableSeats": 28, "maxPerBooking": 8},
    "evt-kinetica-forum": {"id": "evt-kinetica-forum", "title": "Kinetica Architecture & Light Forum", "unitPrice": 95.0, "availableSeats": 19, "maxPerBooking": 6},
}
DISCOUNTS = {"EARLY15": ("percent", 15, 0), "MATINEE10": ("flat", 10.0, 50.0), "MEMBER25": ("percent", 25, 0)}
BOOKINGS = {}

def calculate_quote(event_id, quantity, code):
    event = EVENTS.get(event_id)
    if not event:
        return None, ({"error": "EVENT_NOT_FOUND", "message": "Event not found."}, 404)
    if not isinstance(quantity, int) or quantity < 1 or quantity > event["maxPerBooking"]:
        return None, ({"error": "INVALID_QUANTITY", "message": "Invalid ticket quantity."}, 400)
    if quantity > event["availableSeats"]:
        return None, ({"error": "INSUFFICIENT_SEATS", "message": "Not enough seats available."}, 409)
    subtotal = round(event["unitPrice"] * quantity, 2)
    discount_amount = 0.0
    if code:
        rule = DISCOUNTS.get(code.strip().upper())
        if not rule:
            return None, ({"error": "INVALID_DISCOUNT_CODE", "message": "Invalid discount code."}, 400)
        kind, value, min_sub = rule
        if subtotal < min_sub:
            return None, ({"error": "DISCOUNT_MINIMUM_NOT_MET", "message": "Order subtotal too low."}, 400)
        discount_amount = round(subtotal * (value / 100), 2) if kind == "percent" else value
        discount_amount = min(discount_amount, subtotal)
    return {"eventId": event_id, "quantity": quantity, "unitPrice": event["unitPrice"], "subtotal": subtotal, "discountCode": code or None, "discountAmount": discount_amount, "total": round(subtotal - discount_amount, 2), "currency": "USD", "validatedBy": "server"}, None

@app.get("/api/events")
def list_events():
    return jsonify(list(EVENTS.values())), 200

@app.post("/api/quote")
def create_quote():
    data = request.get_json(silent=True) or {}
    quote, err = calculate_quote(data.get("eventId"), data.get("quantity"), data.get("discountCode"))
    return (jsonify(err[0]), err[1]) if err else (jsonify(quote), 200)

@app.post("/api/bookings")
def create_booking():
    data = request.get_json(silent=True) or {}
    quote, err = calculate_quote(data.get("eventId"), data.get("quantity"), data.get("discountCode"))
    if err:
        return jsonify(err[0]), err[1]
    booking_id = f"SP-{str(uuid.uuid4().int)[:6]}"
    EVENTS[data["eventId"]]["availableSeats"] -= quote["quantity"]
    BOOKINGS[booking_id] = {"id": booking_id, "status": "confirmed", **quote, "attendee": data.get("attendee", {})}
    return jsonify(BOOKINGS[booking_id]), 201

@app.get("/api/bookings/<booking_id>")
def get_booking(booking_id):
    record = BOOKINGS.get(booking_id)
    if not record:
        return jsonify({"error": "BOOKING_NOT_FOUND", "message": "Booking not found."}), 404
    return jsonify(record), 200`;

const ENDPOINTS: EndpointSpec[] = [
  {
    id: 'events',
    label: 'GET /api/events',
    method: 'GET',
    path: '/api/events',
    summary:
      'Returns the three fictional events with authoritative server-side ticket prices and live remaining capacity.',
    validationNotes: [
      'Unit prices are returned from the Flask catalog and never trusted from client submissions.',
      'availableSeats reflects remaining hall capacity after confirmed bookings.',
    ],
    requestExample: null,
    responseStatus: '200 OK',
    responseExample: `[
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
    "maxPerBooking": 8
  }
]`,
  },
  {
    id: 'quote',
    label: 'POST /api/quote',
    method: 'POST',
    path: '/api/quote',
    summary:
      'Calculates subtotal, validates promotional discount codes, and returns the server-verified final total.',
    validationNotes: [
      'Server looks up unitPrice by eventId and rejects unknown events (404).',
      'Validates integer quantity >= 1, <= maxPerBooking (400), and <= availableSeats (409).',
      'Checks discountCode eligibility, minimum subtotal threshold, and caps discount <= subtotal.',
    ],
    requestExample: `{
  "eventId": "evt-nocturne-symphony",
  "quantity": 2,
  "discountCode": "EARLY15"
}`,
    responseStatus: '200 OK',
    responseExample: `{
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
}`,
  },
  {
    id: 'create-booking',
    label: 'POST /api/bookings',
    method: 'POST',
    path: '/api/bookings',
    summary:
      'Re-validates event capacity, discount rules, and attendee details server-side, then persists and returns the confirmed booking.',
    validationNotes: [
      'Ignores any client-supplied totals and recomputes subtotal, discountAmount, and total in Flask.',
      'Validates attendee.fullName, attendee.email, and attendee.phone before assigning SP-XXXXXX.',
      'Returns 201 Created with the persisted BookingRecord.',
    ],
    requestExample: `{
  "eventId": "evt-nocturne-symphony",
  "quantity": 2,
  "discountCode": "EARLY15",
  "attendee": {
    "fullName": "Clara Vance",
    "email": "clara.vance@example.com",
    "phone": "312-555-0148",
    "notes": "Aisle seating preferred"
  }
}`,
    responseStatus: '201 Created',
    responseExample: `{
  "id": "SP-849201",
  "status": "confirmed",
  "createdAt": "2026-11-17T14:52:00.000Z",
  "eventId": "evt-nocturne-symphony",
  "eventTitle": "Nocturne Symphony: Glass & Strings",
  "quantity": 2,
  "unitPrice": 68.0,
  "subtotal": 136.0,
  "discountCode": "EARLY15",
  "discountAmount": 20.4,
  "total": 115.6,
  "currency": "USD",
  "validatedBy": "server"
}`,
  },
  {
    id: 'get-booking',
    label: 'GET /api/bookings/:id',
    method: 'GET',
    path: '/api/bookings/:id',
    summary:
      'Retrieves a previously confirmed booking by reference ID so confirmation passes survive browser reload.',
    validationNotes: [
      'Returns 200 OK with the full BookingRecord JSON if found.',
      'Returns 404 Not Found with { "error": "BOOKING_NOT_FOUND", "message": "..." } if missing.',
    ],
    requestExample: null,
    responseStatus: '200 OK',
    responseExample: `{
  "id": "SP-849201",
  "status": "confirmed",
  "createdAt": "2026-11-17T14:52:00.000Z",
  "eventId": "evt-nocturne-symphony",
  "eventTitle": "Nocturne Symphony: Glass & Strings",
  "venue": "Meridian Concert Hall",
  "city": "Chicago, IL",
  "dateLabel": "Fri, Dec 11, 2026",
  "timeLabel": "8:00 PM CST",
  "quantity": 2,
  "subtotal": 136.0,
  "discountAmount": 20.4,
  "total": 115.6,
  "attendee": {
    "fullName": "Clara Vance",
    "email": "clara.vance@example.com",
    "phone": "312-555-0148"
  }
}`,
  },
  {
    id: 'flask-blueprint',
    label: 'Flask Reference (app.py)',
    method: 'FLASK',
    path: 'app.py',
    summary:
      'Starter Flask implementation demonstrating server-side price lookup, discount enforcement, capacity deduction, and booking retrieval.',
    validationNotes: [
      'Run alongside the Vite frontend or serve built static files from Flask.',
      'Frontend client automatically switches from Demo Fixtures to Flask when JSON responses are detected.',
    ],
    requestExample: null,
    responseStatus: 'Python / Flask',
    responseExample: FLASK_REFERENCE_SNIPPET,
  },
];

interface ApiContractDocsProps {
  exchanges: ApiExchangeRecord[];
}

export const ApiContractDocs: React.FC<ApiContractDocsProps> = ({ exchanges }) => {
  const [activeId, setActiveId] = useState<string>(ENDPOINTS[0].id);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showLiveExchanges, setShowLiveExchanges] = useState(false);

  const current = ENDPOINTS.find((ep) => ep.id === activeId) ?? ENDPOINTS[0];

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(current.responseExample);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <section
      id="api-contracts"
      className="border-t border-[#E4E4E7] bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#111315] sm:text-3xl">
              Flask Backend API Contracts
            </h2>
            <p className="mt-1.5 text-sm text-[#525866]">
              Frontend data access is isolated in the API client layer. Implement these four
              endpoints in Flask to validate all prices, discounts, and totals server-side.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLiveExchanges((prev) => !prev)}
            className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg border border-[#D4D4D8] bg-white px-3.5 py-2 text-xs font-medium text-[#111315] hover:bg-[#F7F7F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer sm:self-auto"
          >
            {showLiveExchanges ? (
              <>
                Hide Demo Exchanges ({exchanges.length})
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Inspect Demo Exchanges ({exchanges.length})
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {/* Segmented endpoint tabs */}
        <div
          role="tablist"
          aria-label="Backend API endpoints"
          className="mt-6 flex flex-wrap gap-1.5 rounded-lg bg-[#F4F4F5] p-1.5 sm:inline-flex"
        >
          {ENDPOINTS.map((ep) => {
            const active = ep.id === current.id;
            return (
              <button
                key={ep.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveId(ep.id)}
                className={`min-h-[40px] rounded-md px-3.5 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#111315] shadow-xs'
                    : 'text-[#525866] hover:text-[#111315]'
                }`}
              >
                {ep.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-[#E4E4E7] bg-[#F7F7F5]/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E7] pb-4">
            <h3 className="font-mono text-base font-semibold text-[#111315]">
              {current.label}
            </h3>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium text-[#047857]">
                {current.responseStatus}
              </span>
              <button
                type="button"
                onClick={handleCopyResponse}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-[#D4D4D8] bg-white px-2.5 py-1 text-xs font-medium text-[#3F4451] hover:text-[#111315] cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#047857]" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#3F4451]">{current.summary}</p>

          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-xs text-[#525866]">
            {current.validationNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>

          <div
            className={`mt-6 grid grid-cols-1 gap-6 ${
              current.requestExample ? 'lg:grid-cols-2' : ''
            }`}
          >
            {current.requestExample && (
              <div>
                <p className="mb-2 text-xs font-semibold text-[#3F4451]">
                  Request Body (application/json)
                </p>
                <pre className="overflow-x-auto rounded-lg border border-[#E4E4E7] bg-[#111315] p-4 font-mono text-xs leading-relaxed text-[#F4F4F5]">
                  <code>{current.requestExample}</code>
                </pre>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold text-[#3F4451]">
                {current.id === 'flask-blueprint'
                  ? 'Flask Reference Implementation'
                  : `Response Body (${current.responseStatus})`}
              </p>
              <pre className="max-h-[420px] overflow-auto rounded-lg border border-[#E4E4E7] bg-[#111315] p-4 font-mono text-xs leading-relaxed text-[#F4F4F5]">
                <code>{current.responseExample}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Collapsible Live Request/Response Inspector for Demo Walkthroughs */}
        {showLiveExchanges && (
          <div className="mt-6 rounded-xl border border-[#E4E4E7] bg-[#F7F7F5] p-6">
            <h3 className="font-display text-base font-semibold text-[#111315]">
              Recent API Exchanges (Demo Walkthrough Inspector)
            </h3>
            <p className="mt-1 text-xs text-[#525866]">
              Shows the most recent payloads exchanged between the SeatPilot UI and the data access
              layer during this browser session.
            </p>

            {exchanges.length === 0 ? (
              <p className="mt-4 text-xs text-[#525866]">
                Interact with events, discount codes, or bookings to record API payloads here.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {exchanges.map((ex) => (
                  <div
                    key={ex.id}
                    className="rounded-lg border border-[#E4E4E7] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-[#111315]">
                        {ex.method} {ex.path}
                      </span>
                      <span className="font-mono text-[#525866]">
                        HTTP {ex.status} · {ex.source}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {ex.requestBody !== undefined && (
                        <div>
                          <span className="block text-[11px] font-medium text-[#525866]">
                            Request JSON
                          </span>
                          <pre className="mt-1 max-h-44 overflow-auto rounded bg-[#111315] p-3 font-mono text-[11px] text-[#F4F4F5]">
                            {JSON.stringify(ex.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className={ex.requestBody === undefined ? 'lg:col-span-2' : ''}>
                        <span className="block text-[11px] font-medium text-[#525866]">
                          Response JSON
                        </span>
                        <pre className="mt-1 max-h-44 overflow-auto rounded bg-[#111315] p-3 font-mono text-[11px] text-[#F4F4F5]">
                          {JSON.stringify(ex.responseBody, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
