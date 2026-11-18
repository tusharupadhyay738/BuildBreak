import React, { useState } from 'react';
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Printer,
  RotateCcw,
} from 'lucide-react';
import type { BookingRecord, DataSourceMode } from '../types/booking';
import {
  downloadCalendarInvite,
  formatBookingTimestamp,
  formatCurrency,
} from '../utils/formatters';

interface BookingConfirmationProps {
  booking: BookingRecord | null;
  loading: boolean;
  error: string | null;
  source: DataSourceMode | null;
  onStartNewBooking: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  loading,
  error,
  source,
  onStartNewBooking,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReference = async () => {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  if (loading) {
    return (
      <section
        id="confirmation"
        className="border-t border-[#E4E4E7] bg-[#F7F7F5] py-10 sm:py-12"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-white p-6 text-sm text-[#525866]">
            <Loader2 className="h-4 w-4 animate-spin text-[#1D4ED8]" aria-hidden="true" />
            <span>Restoring saved booking confirmation via GET /api/bookings/:id...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="confirmation"
        className="border-t border-[#E4E4E7] bg-[#F7F7F5] py-10 sm:py-12"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-base font-semibold text-[#991B1B]">
                Booking reference not found
              </h2>
              <p className="mt-1 text-sm text-[#7F1D1D]">{error}</p>
            </div>
            <button
              type="button"
              onClick={onStartNewBooking}
              className="min-h-[44px] rounded-lg border border-[#FCA5A5] bg-white px-4 py-2 text-sm font-medium text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <section
      id="confirmation"
      aria-live="polite"
      className="border-t border-[#E4E4E7] bg-[#F7F7F5] py-8 sm:py-12"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-[#D4D4D8] bg-white">
          {/* Top confirmation banner */}
          <div className="flex flex-col justify-between gap-4 border-b border-[#E4E4E7] bg-[#ECFDF5]/70 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-[#047857]"
                aria-hidden="true"
              />
              <div>
                <p className="font-display text-lg font-bold text-[#111315]">
                  Booking Confirmed — Reference{' '}
                  <span className="font-mono">{booking.id}</span>
                </p>
                <p className="mt-0.5 text-xs text-[#3F4451]">
                  Saved on {formatBookingTimestamp(booking.createdAt)}
                  <span aria-hidden="true" className="mx-1.5 text-[#A1A1AA]">
                    ·
                  </span>
                  {source === 'flask-api'
                    ? 'Loaded from GET /api/bookings/:id (Flask Server)'
                    : 'Loaded from GET /api/bookings/:id (Demo Fixture)'}
                  <span aria-hidden="true" className="mx-1.5 text-[#A1A1AA]">
                    ·
                  </span>
                  Survives page reload
                </p>
              </div>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyReference}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-xs font-medium text-[#111315] hover:bg-[#F7F7F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#047857]" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy ID
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => downloadCalendarInvite(booking)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-xs font-medium text-[#111315] hover:bg-[#F7F7F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Add to Calendar
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-xs font-medium text-[#111315] hover:bg-[#F7F7F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Print Pass
              </button>

              <button
                type="button"
                onClick={onStartNewBooking}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#111315] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#27272A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Book Another Event
              </button>
            </div>
          </div>

          {/* Receipt details grid */}
          <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div>
                <p className="text-xs font-medium text-[#525866]">{booking.eventCategory}</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-[#111315]">
                  {booking.eventTitle}
                </h3>
                <p className="mt-1.5 text-sm text-[#3F4451]">
                  {booking.dateLabel} · {booking.timeLabel}
                </p>
                <p className="text-sm text-[#525866]">
                  {booking.venue}, {booking.city}
                </p>
              </div>

              <div className="border-t border-[#E4E4E7] pt-5">
                <h4 className="text-xs font-semibold tracking-wide text-[#525866]">
                  Attendee Information
                </h4>
                <dl className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-[#525866]">Full name</dt>
                    <dd className="mt-0.5 font-medium text-[#111315]">
                      {booking.attendee.fullName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#525866]">Email address</dt>
                    <dd className="mt-0.5 font-medium text-[#111315]">{booking.attendee.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#525866]">Phone number</dt>
                    <dd className="mt-0.5 font-mono text-sm text-[#111315] tabular-nums">
                      {booking.attendee.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#525866]">Admit quantity</dt>
                    <dd className="mt-0.5 font-mono text-sm font-semibold text-[#111315] tabular-nums">
                      {booking.quantity} {booking.quantity === 1 ? 'ticket' : 'tickets'}
                    </dd>
                  </div>
                  {booking.attendee.notes && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-[#525866]">Seating note</dt>
                      <dd className="mt-0.5 text-[#3F4451]">{booking.attendee.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="border-t border-[#E4E4E7] pt-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <h4 className="text-xs font-semibold tracking-wide text-[#525866]">
                Payment &amp; Price Breakdown (Fictional)
              </h4>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#525866]">
                    Unit price × {booking.quantity}
                  </dt>
                  <dd className="font-mono text-[#111315] tabular-nums">
                    {formatCurrency(booking.subtotal, booking.currency)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#525866]">
                    Discount{' '}
                    {booking.discountCode ? (
                      <span className="font-mono text-xs text-[#047857]">
                        ({booking.discountCode})
                      </span>
                    ) : null}
                  </dt>
                  <dd
                    className={`font-mono tabular-nums ${
                      booking.discountAmount > 0 ? 'text-[#047857]' : 'text-[#525866]'
                    }`}
                  >
                    {booking.discountAmount > 0
                      ? `-${formatCurrency(booking.discountAmount, booking.currency)}`
                      : '$0.00'}
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 border-t border-[#E4E4E7] pt-4">
                  <dt className="font-display text-base font-semibold text-[#111315]">
                    Final total
                  </dt>
                  <dd className="font-mono text-2xl font-bold text-[#111315] tabular-nums">
                    {formatCurrency(booking.total, booking.currency)}
                  </dd>
                </div>
              </dl>

              {/* Venue check-in stub */}
              <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-[#E4E4E7] bg-[#F7F7F5] p-4">
                <div>
                  <p className="text-xs font-semibold text-[#111315]">Venue Check-In Pass</p>
                  <p className="mt-0.5 font-mono text-xs text-[#525866]">
                    {booking.id} · ADMIT {booking.quantity}
                  </p>
                </div>
                <svg
                  width="96"
                  height="32"
                  viewBox="0 0 96 32"
                  aria-hidden="true"
                  className="shrink-0 text-[#111315]"
                >
                  <rect x="0" y="2" width="3" height="28" fill="currentColor" />
                  <rect x="6" y="2" width="1" height="28" fill="currentColor" />
                  <rect x="10" y="2" width="4" height="28" fill="currentColor" />
                  <rect x="17" y="2" width="2" height="28" fill="currentColor" />
                  <rect x="22" y="2" width="1" height="28" fill="currentColor" />
                  <rect x="26" y="2" width="3" height="28" fill="currentColor" />
                  <rect x="33" y="2" width="2" height="28" fill="currentColor" />
                  <rect x="38" y="2" width="4" height="28" fill="currentColor" />
                  <rect x="45" y="2" width="1" height="28" fill="currentColor" />
                  <rect x="49" y="2" width="3" height="28" fill="currentColor" />
                  <rect x="55" y="2" width="2" height="28" fill="currentColor" />
                  <rect x="61" y="2" width="1" height="28" fill="currentColor" />
                  <rect x="65" y="2" width="4" height="28" fill="currentColor" />
                  <rect x="72" y="2" width="2" height="28" fill="currentColor" />
                  <rect x="78" y="2" width="3" height="28" fill="currentColor" />
                  <rect x="84" y="2" width="1" height="28" fill="currentColor" />
                  <rect x="88" y="2" width="4" height="28" fill="currentColor" />
                  <rect x="94" y="2" width="2" height="28" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
