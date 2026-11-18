import { demoFixtureBackend, DemoFixtureHttpError } from '../data/demoFixtures';
import type {
  ApiErrorPayload,
  ApiExchangeRecord,
  ApiResult,
  BookingRecord,
  CreateBookingRequest,
  DataSourceMode,
  EventItem,
  QuoteRequest,
  QuoteResponse,
} from '../types/booking';

const ACTIVE_BOOKING_STORAGE_KEY = 'seatpilot_active_booking_id';

export class SeatPilotApiError extends Error {
  status: number;
  code: string;
  field?: string;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'SeatPilotApiError';
    this.status = status;
    this.code = payload.error;
    this.field = payload.field;
  }
}

type ExchangeListener = (record: ApiExchangeRecord) => void;
const exchangeListeners = new Set<ExchangeListener>();

function emitExchange(
  method: 'GET' | 'POST',
  path: string,
  status: number,
  source: DataSourceMode,
  requestBody: unknown,
  responseBody: unknown
) {
  const entry: ApiExchangeRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    method,
    path,
    status,
    source,
    timestamp: new Date().toISOString(),
    requestBody,
    responseBody,
  };
  exchangeListeners.forEach((listener) => listener(entry));
}

export const apiExchangeBus = {
  subscribe(listener: ExchangeListener): () => void {
    exchangeListeners.add(listener);
    return () => {
      exchangeListeners.delete(listener);
    };
  },
};

/** Arena integration: every response must come from the real JSON API.
 * Design fixtures remain in the export as labeled examples; they never replace
 * failed, non-JSON or unavailable API responses in this build.
 */
async function requestWithDemoFallback<T>(
  method: 'GET' | 'POST', path: string, requestBody: unknown,
  _designPreviewOnly: () => Promise<T>
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method, body: requestBody !== undefined ? JSON.stringify(requestBody) : undefined,
      headers: {Accept:'application/json', ...(requestBody !== undefined ? {'Content-Type':'application/json'} : {})},
    });
  } catch {
    throw new SeatPilotApiError(503, {error:'BACKEND_UNAVAILABLE', message:'The real booking API is unavailable. No demo booking was created.'});
  }
  if (!(response.headers.get('content-type') || '').includes('application/json')) {
    throw new SeatPilotApiError(503, {error:'BACKEND_UNAVAILABLE', message:'A real JSON booking API is required. Demo fixture fallback is disabled.'});
  }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new SeatPilotApiError(503, {error:'INVALID_BACKEND_RESPONSE',message:'The booking API returned invalid JSON.'}); }
  emitExchange(method,path,response.status,'flask-api',requestBody,body);
  if (!response.ok) {
    const error = body as ApiErrorPayload;
    throw new SeatPilotApiError(response.status,{error:error?.error || 'SERVER_ERROR',message:error?.message || 'Server rejected the request.',field:error?.field});
  }
  return {data:body as T,source:'flask-api'};
}

export const seatpilotClient = {
  /** GET /api/events */
  async getEvents(): Promise<ApiResult<EventItem[]>> {
    return requestWithDemoFallback<EventItem[]>('GET', '/api/events', undefined, () =>
      demoFixtureBackend.getEvents()
    );
  },

  /** POST /api/quote */
  async getQuote(payload: QuoteRequest): Promise<ApiResult<QuoteResponse>> {
    return requestWithDemoFallback<QuoteResponse>('POST', '/api/quote', payload, () =>
      demoFixtureBackend.createQuote(payload)
    );
  },

  /** POST /api/bookings */
  async createBooking(payload: CreateBookingRequest): Promise<ApiResult<BookingRecord>> {
    const result = await requestWithDemoFallback<BookingRecord>('POST', '/api/bookings', payload, () =>
      demoFixtureBackend.createBooking(payload)
    );
    try {
      const stored = JSON.parse(window.localStorage.getItem('seatpilot_server_booking_refs') || '{}');
      stored[result.data.id] = result.data;
      window.localStorage.setItem('seatpilot_server_booking_refs',JSON.stringify(stored));
    } catch { /* Cache is a convenience, never the authoritative booking lookup. */ }
    return result;
  },

  /** GET /api/bookings/:id */
  async getBookingById(id: string): Promise<ApiResult<BookingRecord>> {
    const encodedId = encodeURIComponent(id.trim());
    return requestWithDemoFallback<BookingRecord>(
      'GET',
      `/api/bookings/${encodedId}`,
      undefined,
      () => demoFixtureBackend.getBookingById(id)
    );
  },
};

export const bookingPersistence = {
  getSavedBookingId(): string | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get('booking');
      if (fromUrl && fromUrl.trim().length > 0) {
        return fromUrl.trim();
      }
      return window.localStorage.getItem(ACTIVE_BOOKING_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  saveBookingId(bookingId: string): void {
    try {
      window.localStorage.setItem(ACTIVE_BOOKING_STORAGE_KEY, bookingId);
      const url = new URL(window.location.href);
      url.searchParams.set('booking', bookingId);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore storage/history errors
    }
  },

  clearSavedBookingId(): void {
    try {
      window.localStorage.removeItem(ACTIVE_BOOKING_STORAGE_KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete('booking');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore storage/history errors
    }
  },

  listSessionBookings(): BookingRecord[] {
    try { return Object.values(JSON.parse(window.localStorage.getItem('seatpilot_server_booking_refs') || '{}')) as BookingRecord[]; } catch { return []; }
  },

  resetAllDemoData(): void {
    this.clearSavedBookingId();
    try { window.localStorage.removeItem('seatpilot_server_booking_refs'); } catch { /* No server records are deleted. */ }
  },
};
