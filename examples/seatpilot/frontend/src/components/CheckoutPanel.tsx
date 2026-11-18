import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Minus, Plus, Tag, UserCheck, X } from 'lucide-react';
import { DEMO_DISCOUNT_CODES } from '../data/demoFixtures';
import type {
  AttendeeDetails,
  DataSourceMode,
  EventItem,
  QuoteResponse,
} from '../types/booking';
import { formatCurrency } from '../utils/formatters';

interface CheckoutPanelProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  quantity: number;
  appliedDiscountCode: string;
  quote: QuoteResponse | null;
  quoteSource: DataSourceMode;
  quoteLoading: boolean;
  quoteError: string | null;
  submitting: boolean;
  submitError: string | null;
  submitErrorField?: string;
  onSelectEvent: (eventId: string) => void;
  onQuantityChange: (nextQty: number) => void;
  onApplyDiscount: (code: string) => void;
  onRemoveDiscount: () => void;
  onSubmitBooking: (attendee: AttendeeDetails) => void;
}

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  events,
  selectedEvent,
  quantity,
  appliedDiscountCode,
  quote,
  quoteSource,
  quoteLoading,
  quoteError,
  submitting,
  submitError,
  submitErrorField,
  onSelectEvent,
  onQuantityChange,
  onApplyDiscount,
  onRemoveDiscount,
  onSubmitBooking,
}) => {
  const [discountInput, setDiscountInput] = useState(appliedDiscountCode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [localFieldErrors, setLocalFieldErrors] = useState<Record<string, string>>({});

  if (!selectedEvent) {
    return null;
  }

  const maxAllowed = Math.max(1, Math.min(selectedEvent.maxPerBooking, selectedEvent.availableSeats));
  const soldOut = selectedEvent.availableSeats <= 0;

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyDiscount(discountInput.trim());
  };

  const handleQuickDemoCode = (code: string) => {
    setDiscountInput(code);
    onApplyDiscount(code);
  };

  const handleClearDiscount = () => {
    setDiscountInput('');
    onRemoveDiscount();
  };

  const handleFillSampleAttendee = () => {
    setFullName('Clara Vance');
    setEmail('clara.vance@example.com');
    setPhone('312-555-0148');
    setNotes('Aisle seating preferred if available.');
    setLocalFieldErrors({});
  };

  const handleBookingFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (fullName.trim().length < 2) {
      errors.fullName = 'Enter attendee full name (minimum 2 characters).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address (e.g. alex@example.com).';
    }
    if (phone.replace(/\D/g, '').length < 7) {
      errors.phone = 'Enter a fictional phone number with at least 7 digits.';
    }

    setLocalFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    onSubmitBooking({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim() || undefined,
    });
  };

  const getFieldError = (field: string): string | undefined => {
    if (localFieldErrors[field]) return localFieldErrors[field];
    if (submitErrorField === field && submitError) return submitError;
    return undefined;
  };

  return (
    <section
      id="checkout"
      className="border-t border-[#E4E4E7] bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#111315] sm:text-3xl">
            Configure Tickets &amp; Booking Details
          </h2>
          <p className="mt-1.5 text-sm text-[#525866]">
            Choose ticket quantity, test a promotional code, and submit fictional attendee details.
            No real payment or account is required.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left column: Steps 1-3 */}
          <div className="space-y-8 lg:col-span-7">
            {/* Step 1: Event & Quantity */}
            <div className="rounded-xl border border-[#E4E4E7] bg-[#F7F7F5]/60 p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-[#111315]">
                01. Event &amp; Ticket Quantity
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-7">
                  <label
                    htmlFor="checkout-event-select"
                    className="block text-xs font-medium text-[#3F4451]"
                  >
                    Selected event
                  </label>
                  <select
                    id="checkout-event-select"
                    value={selectedEvent.id}
                    onChange={(e) => onSelectEvent(e.target.value)}
                    className="mt-1.5 block w-full min-h-[44px] rounded-lg border border-[#D4D4D8] bg-white px-3.5 py-2 text-sm font-medium text-[#111315] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  >
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({formatCurrency(evt.unitPrice, evt.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <span className="block text-xs font-medium text-[#3F4451]">
                    Ticket quantity
                  </span>
                  <div className="mt-1.5 flex items-center justify-between rounded-lg border border-[#D4D4D8] bg-white px-2 py-1">
                    <button
                      type="button"
                      aria-label="Decrease ticket quantity"
                      disabled={soldOut || quantity <= 1}
                      onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-md text-[#111315] hover:bg-[#F4F4F5] disabled:text-[#A1A1AA] disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <span
                      aria-live="polite"
                      className="font-mono text-base font-semibold text-[#111315] tabular-nums"
                    >
                      {soldOut ? 0 : quantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Increase ticket quantity"
                      disabled={soldOut || quantity >= maxAllowed}
                      onClick={() => onQuantityChange(Math.min(maxAllowed, quantity + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-md text-[#111315] hover:bg-[#F4F4F5] disabled:text-[#A1A1AA] disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-[#525866]">
                {selectedEvent.venue}, {selectedEvent.city}
                <span aria-hidden="true" className="mx-1.5 text-[#A1A1AA]">
                  ·
                </span>
                {selectedEvent.dateLabel}
                <span aria-hidden="true" className="mx-1.5 text-[#A1A1AA]">
                  ·
                </span>
                <span className="tabular-nums">
                  {soldOut
                    ? '0 seats available'
                    : `Up to ${maxAllowed} tickets per booking (${selectedEvent.availableSeats} remaining)`}
                </span>
              </p>
            </div>

            {/* Step 2: Discount Code */}
            <div className="rounded-xl border border-[#E4E4E7] bg-[#F7F7F5]/60 p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-[#111315]">
                02. Promotional Discount Code
              </h3>

              <form onSubmit={handleDiscountSubmit} className="mt-4">
                <label htmlFor="discount-code-input" className="block text-xs font-medium text-[#3F4451]">
                  Discount code (optional)
                </label>
                <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row">
                  <div className="relative flex-1">
                    <Tag
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                      aria-hidden="true"
                    />
                    <input
                      id="discount-code-input"
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g. EARLY15)"
                      className="block w-full min-h-[44px] rounded-lg border border-[#D4D4D8] bg-white pl-10 pr-10 py-2 font-mono text-sm text-[#111315] placeholder:font-sans placeholder:text-[#A1A1AA] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                    />
                    {(discountInput || appliedDiscountCode) && (
                      <button
                        type="button"
                        onClick={handleClearDiscount}
                        aria-label="Clear discount code"
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#111315] cursor-pointer"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={quoteLoading || soldOut}
                    className="min-h-[44px] rounded-lg border border-[#D4D4D8] bg-white px-5 py-2 text-sm font-medium text-[#111315] hover:bg-[#F4F4F5] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {quoteLoading ? 'Checking...' : 'Apply Code'}
                  </button>
                </div>
              </form>

              {quoteError && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 text-xs font-medium text-[#B91C1C]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{quoteError}</span>
                </div>
              )}

              {!quoteError && quote?.discountCode && (
                <div className="mt-3 flex items-start gap-2 text-xs font-medium text-[#047857]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Applied <span className="font-mono">{quote.discountCode}</span> —{' '}
                    {quote.discountLabel}
                  </span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#525866]">
                <span>Try demo codes:</span>
                {DEMO_DISCOUNT_CODES.map((rule) => (
                  <button
                    key={rule.code}
                    type="button"
                    onClick={() => handleQuickDemoCode(rule.code)}
                    className="font-mono font-medium text-[#1D4ED8] hover:underline underline-offset-2 cursor-pointer"
                    title={rule.label}
                  >
                    {rule.code}
                  </button>
                ))}
                <span aria-hidden="true" className="text-[#A1A1AA]">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickDemoCode('EXPIRED50')}
                  className="font-medium text-[#525866] hover:text-[#B91C1C] hover:underline underline-offset-2 cursor-pointer"
                >
                  Test invalid code
                </button>
              </div>
            </div>

            {/* Step 3: Fictional Booking Details */}
            <form
              id="booking-details-form"
              onSubmit={handleBookingFormSubmit}
              noValidate
              className="rounded-xl border border-[#E4E4E7] bg-[#F7F7F5]/60 p-5 sm:p-6"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-[#111315]">
                    03. Attendee Details (Fictional)
                  </h3>
                  <span className="text-xs text-[#525866]">No real payment collected</span>
                </div>

                <button
                  type="button"
                  onClick={handleFillSampleAttendee}
                  className="inline-flex min-h-[36px] items-center gap-1.5 self-start rounded-md border border-[#D4D4D8] bg-white px-3 py-1.5 text-xs font-medium text-[#3F4451] hover:bg-[#F4F4F5] hover:text-[#111315] transition-colors whitespace-nowrap shrink-0 cursor-pointer sm:self-auto"
                >
                  <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Fill Sample Attendee
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="attendee-name" className="block text-xs font-medium text-[#3F4451]">
                    Full name
                  </label>
                  <input
                    id="attendee-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (localFieldErrors.fullName) {
                        setLocalFieldErrors((prev) => ({ ...prev, fullName: '' }));
                      }
                    }}
                    placeholder="Clara Vance"
                    className="mt-1.5 block w-full min-h-[44px] rounded-lg border border-[#D4D4D8] bg-white px-3.5 py-2 text-sm text-[#111315] placeholder:text-[#A1A1AA] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                  {getFieldError('fullName') && (
                    <p className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                      {getFieldError('fullName')}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="attendee-email" className="block text-xs font-medium text-[#3F4451]">
                    Email address
                  </label>
                  <input
                    id="attendee-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (localFieldErrors.email) {
                        setLocalFieldErrors((prev) => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="clara.vance@example.com"
                    className="mt-1.5 block w-full min-h-[44px] rounded-lg border border-[#D4D4D8] bg-white px-3.5 py-2 text-sm text-[#111315] placeholder:text-[#A1A1AA] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                  {getFieldError('email') && (
                    <p className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                      {getFieldError('email')}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="attendee-phone" className="block text-xs font-medium text-[#3F4451]">
                    Phone number
                  </label>
                  <input
                    id="attendee-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (localFieldErrors.phone) {
                        setLocalFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="312-555-0148"
                    className="mt-1.5 block w-full min-h-[44px] rounded-lg border border-[#D4D4D8] bg-white px-3.5 py-2 text-sm text-[#111315] placeholder:text-[#A1A1AA] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                  {getFieldError('phone') && (
                    <p className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                      {getFieldError('phone')}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="attendee-notes" className="block text-xs font-medium text-[#3F4451]">
                    Seating or accessibility note (optional)
                  </label>
                  <textarea
                    id="attendee-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Aisle seating preferred if available"
                    className="mt-1.5 block w-full rounded-lg border border-[#D4D4D8] bg-white px-3.5 py-2.5 text-sm text-[#111315] placeholder:text-[#A1A1AA] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>
              </div>

              {submitError && !submitErrorField && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs font-medium text-[#991B1B]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              )}
            </form>
          </div>

          {/* Right column: Sticky Quote & Subtotal Summary */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-xl border border-[#E4E4E7] bg-white p-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#E4E4E7] pb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#111315]">
                    Order Summary
                  </h3>
                  <p className="mt-0.5 text-xs text-[#525866]">
                    {quoteSource === 'demo-fixture'
                      ? 'Demo Fixture Quote · POST /api/quote'
                      : 'Server-Validated Quote · POST /api/quote'}
                  </p>
                </div>
                {quoteLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#1D4ED8]" aria-label="Updating quote" />
                )}
              </div>

              <div className="mt-5">
                <p className="font-display text-base font-semibold text-[#111315]">
                  {selectedEvent.title}
                </p>
                <p className="mt-1 text-xs text-[#525866]">
                  {selectedEvent.dateLabel} · {selectedEvent.timeLabel}
                </p>
                <p className="mt-0.5 text-xs text-[#525866]">
                  {selectedEvent.venue}, {selectedEvent.city}
                </p>
              </div>

              <dl className="mt-6 space-y-3 border-t border-[#E4E4E7] pt-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#525866]">
                    Tickets ({quote ? quote.quantity : quantity} ×{' '}
                    <span className="font-mono tabular-nums">
                      {formatCurrency(selectedEvent.unitPrice, selectedEvent.currency)}
                    </span>
                    )
                  </dt>
                  <dd className="font-mono font-medium text-[#111315] tabular-nums">
                    {quote
                      ? formatCurrency(quote.subtotal, quote.currency)
                      : formatCurrency(selectedEvent.unitPrice * quantity, selectedEvent.currency)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#525866]">
                    Discount
                    {quote?.discountCode ? (
                      <span className="ml-1.5 font-mono text-xs text-[#047857]">
                        ({quote.discountCode})
                      </span>
                    ) : null}
                  </dt>
                  <dd
                    className={`font-mono font-medium tabular-nums ${
                      quote && quote.discountAmount > 0 ? 'text-[#047857]' : 'text-[#525866]'
                    }`}
                  >
                    {quote && quote.discountAmount > 0
                      ? `-${formatCurrency(quote.discountAmount, quote.currency)}`
                      : '$0.00'}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#525866]">Box office fee</dt>
                  <dd className="font-mono text-[#525866] tabular-nums">$0.00</dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 border-t border-[#E4E4E7] pt-4">
                  <dt className="font-display text-base font-semibold text-[#111315]">
                    Final total
                  </dt>
                  <dd className="font-mono text-2xl font-bold text-[#111315] tabular-nums">
                    {quote
                      ? formatCurrency(quote.total, quote.currency)
                      : formatCurrency(selectedEvent.unitPrice * quantity, selectedEvent.currency)}
                  </dd>
                </div>
              </dl>

              <button
                type="submit"
                form="booking-details-form"
                disabled={submitting || soldOut || quoteLoading}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:bg-[#93C5FD] transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {soldOut
                  ? 'Event Sold Out'
                  : submitting
                  ? 'Confirming Reservation...'
                  : 'Confirm Fictional Booking'}
              </button>

              <p className="mt-3 text-center text-xs text-[#525866]">
                Confirmation ID is saved locally and restored via{' '}
                <span className="font-mono text-[#111315]">GET /api/bookings/:id</span> on reload.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
