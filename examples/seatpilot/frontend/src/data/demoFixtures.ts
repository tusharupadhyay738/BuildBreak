import type {
  ApiErrorPayload,
  BookingRecord,
  CreateBookingRequest,
  EventItem,
  QuoteRequest,
  QuoteResponse,
} from '../types/booking';

/**
 * EXPLICIT DEMO FIXTURES FOR DESIGN PREVIEW
 * ---------------------------------------------------------------------------
 * These fixtures mirror the expected Flask backend responses for:
 *   GET  /api/events
 *   POST /api/quote
 *   POST /api/bookings
 *   GET  /api/bookings/:id
 *
 * In production, all pricing, discount validation, and booking creation
 * are executed server-side in Flask.
 */

export const HERO_VENUE_IMAGE = '/src/assets/images/hero_concert_hall_1794927063726.jpg';

export const DEMO_EVENTS: EventItem[] = [
  {
    id: 'evt-nocturne-symphony',
    title: 'Nocturne Symphony: Glass & Strings',
    category: 'Chamber & Electronic',
    dateLabel: 'Fri, Dec 11, 2026',
    timeLabel: '8:00 PM CST',
    doorsOpenLabel: 'Doors open at 7:15 PM',
    durationLabel: '90 min, no intermission',
    venue: 'Meridian Concert Hall',
    city: 'Chicago, IL',
    unitPrice: 68.0,
    currency: 'USD',
    availableSeats: 42,
    totalSeats: 120,
    maxPerBooking: 8,
    imageUrl: '/src/assets/images/event_nocturne_strings_1794927064578.jpg',
    imageAlt: 'String quartet and analog synthesizer performing under warm amber stage lights',
    description:
      'An intimate candlelit performance pairing acoustic string quartet repertoire with live modular analog synthesis.',
    highlights: [
      'Reserved acoustically balanced hall seating',
      '90-minute uninterrupted concert program',
      'Doors and acoustic listening lounge open at 7:15 PM',
    ],
  },
  {
    id: 'evt-solstice-film',
    title: 'Solstice Film & Sound Retrospective',
    category: '35mm Cinema & Live Score',
    dateLabel: 'Sat, Dec 19, 2026',
    timeLabel: '7:30 PM PST',
    doorsOpenLabel: 'Doors open at 6:45 PM',
    durationLabel: '110 min + Q&A',
    venue: 'The Astor Conservatory',
    city: 'Seattle, WA',
    unitPrice: 44.0,
    currency: 'USD',
    availableSeats: 28,
    totalSeats: 96,
    maxPerBooking: 8,
    imageUrl: '/src/assets/images/event_solstice_cinema_1794927063910.jpg',
    imageAlt: 'Restored historic theater interior with 35mm projector beam illuminated toward stage',
    description:
      'Archival 35mm short films projected in full conservatory fidelity with an original live score for cello and percussion.',
    highlights: [
      'Dual-projector 35mm archival print presentation',
      'Live electro-acoustic accompaniment on stage',
      'Illustrated program booklet included with ticket',
    ],
  },
  {
    id: 'evt-kinetica-forum',
    title: 'Kinetica Architecture & Light Forum',
    category: 'Design Forum & Exhibition',
    dateLabel: 'Thu, Jan 14, 2027',
    timeLabel: '6:30 PM EST',
    doorsOpenLabel: 'Doors open at 5:45 PM',
    durationLabel: '2 hrs twilight access',
    venue: 'Foundry Civic Pavilion',
    city: 'Boston, MA',
    unitPrice: 95.0,
    currency: 'USD',
    availableSeats: 19,
    totalSeats: 80,
    maxPerBooking: 6,
    imageUrl: '/src/assets/images/event_kinetica_pavilion_1794927064811.jpg',
    imageAlt: 'Concrete and glass exhibition pavilion illuminated at twilight with geometric light sculptures',
    description:
      'Twilight keynote talks by spatial architects and acoustic sculptors, followed by after-hours access to the light pavilion.',
    highlights: [
      'Main pavilion keynote & moderated Q&A',
      'Private twilight walkthrough of six kinetic light works',
      'Complimentary espresso and winter tea reception',
    ],
  },
];

export interface DemoDiscountRule {
  code: string;
  label: string;
  type: 'percent' | 'flat';
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number | null;
}

export const DEMO_DISCOUNT_CODES: DemoDiscountRule[] = [
  {
    code: 'EARLY15',
    label: '15% early reservation discount',
    type: 'percent',
    value: 15,
    minSubtotalCents: 0,
    maxDiscountCents: null,
  },
  {
    code: 'MATINEE10',
    label: '$10.00 off orders of $50.00 or more',
    type: 'flat',
    value: 1000,
    minSubtotalCents: 5000,
    maxDiscountCents: 1000,
  },
  {
    code: 'MEMBER25',
    label: '25% patron discount (up to $60.00)',
    type: 'percent',
    value: 25,
    minSubtotalCents: 0,
    maxDiscountCents: 6000,
  },
];

export const SAMPLE_DEMO_BOOKING_ID = 'SP-204810';

const SEEDED_DEMO_BOOKING: BookingRecord = {
  id: SAMPLE_DEMO_BOOKING_ID,
  status: 'confirmed',
  createdAt: '2026-11-17T12:30:00.000Z',
  eventId: 'evt-nocturne-symphony',
  eventTitle: 'Nocturne Symphony: Glass & Strings',
  eventCategory: 'Chamber & Electronic',
  venue: 'Meridian Concert Hall',
  city: 'Chicago, IL',
  dateLabel: 'Fri, Dec 11, 2026',
  timeLabel: '8:00 PM CST',
  quantity: 2,
  unitPrice: 68.0,
  subtotal: 136.0,
  discountCode: 'EARLY15',
  discountLabel: '15% early reservation discount',
  discountAmount: 20.4,
  total: 115.6,
  currency: 'USD',
  attendee: {
    fullName: 'Julian Mercer',
    email: 'julian.mercer@example.com',
    phone: '312-555-0192',
    notes: 'Center balcony preferred',
  },
  validatedBy: 'demo-fixture',
};

const DEMO_BOOKINGS_STORAGE_KEY = 'seatpilot_demo_bookings_v1';

export class DemoFixtureHttpError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.status = status;
    this.payload = payload;
  }
}

function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

function readStoredBookings(): Record<string, BookingRecord> {
  try {
    const raw = window.localStorage.getItem(DEMO_BOOKINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, BookingRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredBookings(bookings: Record<string, BookingRecord>): void {
  try {
    window.localStorage.setItem(DEMO_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // Ignore storage quota errors in restricted preview contexts
  }
}

function countBookedSeatsForEvent(eventId: string): number {
  const bookings = readStoredBookings();
  return Object.values(bookings)
    .filter((b) => b.eventId === eventId)
    .reduce((sum, b) => sum + b.quantity, 0);
}

function getDemoEventsWithAdjustedAvailability(): EventItem[] {
  return DEMO_EVENTS.map((evt) => {
    const booked = countBookedSeatsForEvent(evt.id);
    return {
      ...evt,
      availableSeats: Math.max(0, evt.availableSeats - booked),
    };
  });
}

function computeDemoQuote(request: QuoteRequest): QuoteResponse {
  const events = getDemoEventsWithAdjustedAvailability();
  const event = events.find((e) => e.id === request.eventId);

  if (!event) {
    throw new DemoFixtureHttpError(404, {
      error: 'EVENT_NOT_FOUND',
      message: 'The selected event does not exist.',
      field: 'eventId',
    });
  }

  const quantity = Number(request.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new DemoFixtureHttpError(400, {
      error: 'INVALID_QUANTITY',
      message: 'Ticket quantity must be at least 1.',
      field: 'quantity',
    });
  }

  if (quantity > event.maxPerBooking) {
    throw new DemoFixtureHttpError(400, {
      error: 'MAX_QUANTITY_EXCEEDED',
      message: `Maximum ${event.maxPerBooking} tickets allowed per booking for this event.`,
      field: 'quantity',
    });
  }

  if (quantity > event.availableSeats) {
    throw new DemoFixtureHttpError(409, {
      error: 'INSUFFICIENT_SEATS',
      message: `Only ${event.availableSeats} seats remain for ${event.title}.`,
      field: 'quantity',
    });
  }

  const unitCents = toCents(event.unitPrice);
  const subtotalCents = unitCents * quantity;

  const rawCode = (request.discountCode ?? '').trim().toUpperCase();
  let appliedCode: string | null = null;
  let appliedLabel: string | null = null;
  let discountCents = 0;

  if (rawCode.length > 0) {
    const rule = DEMO_DISCOUNT_CODES.find((d) => d.code === rawCode);
    if (!rule) {
      throw new DemoFixtureHttpError(400, {
        error: 'INVALID_DISCOUNT_CODE',
        message: `Discount code "${rawCode}" is invalid or expired. Try EARLY15, MATINEE10, or MEMBER25.`,
        field: 'discountCode',
      });
    }

    if (subtotalCents < rule.minSubtotalCents) {
      throw new DemoFixtureHttpError(400, {
        error: 'DISCOUNT_MINIMUM_NOT_MET',
        message: `${rule.code} requires a subtotal of at least $${fromCents(rule.minSubtotalCents).toFixed(2)}.`,
        field: 'discountCode',
      });
    }

    if (rule.type === 'percent') {
      discountCents = Math.round((subtotalCents * rule.value) / 100);
    } else {
      discountCents = rule.value;
    }

    if (rule.maxDiscountCents !== null) {
      discountCents = Math.min(discountCents, rule.maxDiscountCents);
    }
    discountCents = Math.min(discountCents, subtotalCents);

    appliedCode = rule.code;
    appliedLabel = rule.label;
  }

  const totalCents = Math.max(0, subtotalCents - discountCents);

  return {
    eventId: event.id,
    eventTitle: event.title,
    quantity,
    unitPrice: fromCents(unitCents),
    subtotal: fromCents(subtotalCents),
    discountCode: appliedCode,
    discountLabel: appliedLabel,
    discountAmount: fromCents(discountCents),
    total: fromCents(totalCents),
    currency: event.currency,
    validatedBy: 'demo-fixture',
  };
}

function validateAttendee(attendee: CreateBookingRequest['attendee']): void {
  const fullName = (attendee?.fullName ?? '').trim();
  const email = (attendee?.email ?? '').trim();
  const phone = (attendee?.phone ?? '').trim();

  if (fullName.length < 2) {
    throw new DemoFixtureHttpError(400, {
      error: 'INVALID_ATTENDEE_NAME',
      message: 'Please enter a full name (at least 2 characters).',
      field: 'fullName',
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new DemoFixtureHttpError(400, {
      error: 'INVALID_ATTENDEE_EMAIL',
      message: 'Please enter a valid email address for ticket delivery.',
      field: 'email',
    });
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) {
    throw new DemoFixtureHttpError(400, {
      error: 'INVALID_ATTENDEE_PHONE',
      message: 'Please enter a valid fictional phone number (at least 7 digits).',
      field: 'phone',
    });
  }
}

function generateBookingReference(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `SP-${randomDigits}`;
}

export const demoFixtureBackend = {
  async getEvents(): Promise<EventItem[]> {
    return getDemoEventsWithAdjustedAvailability();
  },

  async createQuote(request: QuoteRequest): Promise<QuoteResponse> {
    return computeDemoQuote(request);
  },

  async createBooking(request: CreateBookingRequest): Promise<BookingRecord> {
    validateAttendee(request.attendee);
    const quote = computeDemoQuote({
      eventId: request.eventId,
      quantity: request.quantity,
      discountCode: request.discountCode,
    });

    const event = DEMO_EVENTS.find((e) => e.id === request.eventId)!;
    const bookingId = generateBookingReference();

    const record: BookingRecord = {
      id: bookingId,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      eventId: event.id,
      eventTitle: event.title,
      eventCategory: event.category,
      venue: event.venue,
      city: event.city,
      dateLabel: event.dateLabel,
      timeLabel: event.timeLabel,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      subtotal: quote.subtotal,
      discountCode: quote.discountCode,
      discountLabel: quote.discountLabel,
      discountAmount: quote.discountAmount,
      total: quote.total,
      currency: quote.currency,
      attendee: {
        fullName: request.attendee.fullName.trim(),
        email: request.attendee.email.trim(),
        phone: request.attendee.phone.trim(),
        notes: request.attendee.notes?.trim() || undefined,
      },
      validatedBy: 'demo-fixture',
    };

    const existing = readStoredBookings();
    existing[bookingId] = record;
    writeStoredBookings(existing);

    return record;
  },

  async getBookingById(id: string): Promise<BookingRecord> {
    const cleanId = id.trim().toUpperCase();
    const existing = readStoredBookings();
    const record = existing[cleanId] ?? (cleanId === SAMPLE_DEMO_BOOKING_ID ? SEEDED_DEMO_BOOKING : undefined);
    if (!record) {
      throw new DemoFixtureHttpError(404, {
        error: 'BOOKING_NOT_FOUND',
        message: `No booking found with reference "${cleanId}". Try ${SAMPLE_DEMO_BOOKING_ID} or submit a new booking.`,
      });
    }
    return record;
  },

  listSavedBookings(): BookingRecord[] {
    const existing = readStoredBookings();
    const list = Object.values(existing).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  },

  resetDemoState(): void {
    try {
      window.localStorage.removeItem(DEMO_BOOKINGS_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};
