export type DataSourceMode = 'flask-api' | 'demo-fixture';

export interface EventItem {
  id: string;
  title: string;
  category: string;
  dateLabel: string;
  timeLabel: string;
  doorsOpenLabel?: string;
  durationLabel?: string;
  venue: string;
  city: string;
  unitPrice: number;
  currency: 'USD';
  availableSeats: number;
  totalSeats?: number;
  maxPerBooking: number;
  imageUrl: string;
  imageAlt: string;
  description: string;
  highlights: string[];
}

export interface QuoteRequest {
  eventId: string;
  quantity: number;
  discountCode?: string;
}

export interface QuoteResponse {
  eventId: string;
  eventTitle: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountCode: string | null;
  discountLabel: string | null;
  discountAmount: number;
  total: number;
  currency: 'USD';
  validatedBy: 'server' | 'demo-fixture';
}

export interface AttendeeDetails {
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface CreateBookingRequest {
  eventId: string;
  quantity: number;
  discountCode?: string;
  attendee: AttendeeDetails;
}

export interface BookingRecord {
  id: string;
  status: 'confirmed';
  createdAt: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  venue: string;
  city: string;
  dateLabel: string;
  timeLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountCode: string | null;
  discountLabel: string | null;
  discountAmount: number;
  total: number;
  currency: 'USD';
  attendee: AttendeeDetails;
  validatedBy: 'server' | 'demo-fixture';
}

export interface ApiErrorPayload {
  error: string;
  message: string;
  field?: string;
}

export interface ApiResult<T> {
  data: T;
  source: DataSourceMode;
}

export interface ApiExchangeRecord {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  status: number;
  source: DataSourceMode;
  timestamp: string;
  requestBody?: unknown;
  responseBody: unknown;
}
