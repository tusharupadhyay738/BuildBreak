import React, { useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { SAMPLE_DEMO_BOOKING_ID } from '../data/demoFixtures';
import type { BookingRecord } from '../types/booking';

interface BookingLookupBarProps {
  activeBookingId: string | null;
  sessionBookings: BookingRecord[];
  lookupLoading: boolean;
  onLookupBooking: (bookingId: string) => void;
  onResetDemoData: () => void;
}

export const BookingLookupBar: React.FC<BookingLookupBarProps> = ({
  activeBookingId,
  sessionBookings,
  lookupLoading,
  onLookupBooking,
  onResetDemoData,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;
    onLookupBooking(trimmed);
  };

  return (
    <section
      aria-label="Retrieve saved booking"
      className="border-t border-[#E4E4E7] bg-[#F7F7F5] py-8"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-[#E4E4E7] bg-white p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="max-w-lg">
            <h2 className="font-display text-base font-semibold text-[#111315]">
              Retrieve Saved Booking Confirmation
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#525866]">
              Look up any confirmation reference via{' '}
              <span className="font-mono text-[#111315]">GET /api/bookings/:id</span>. Try sample
              reference{' '}
              <button
                type="button"
                onClick={() => {
                  setQuery(SAMPLE_DEMO_BOOKING_ID);
                  onLookupBooking(SAMPLE_DEMO_BOOKING_ID);
                }}
                className="font-mono font-semibold text-[#1D4ED8] hover:underline underline-offset-2 cursor-pointer"
              >
                {SAMPLE_DEMO_BOOKING_ID}
              </button>{' '}
              or pick a recent session pass.
            </p>

            {sessionBookings.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#525866]">
                <span>Session passes:</span>
                {sessionBookings.map((item) => {
                  const isCurrent = item.id === activeBookingId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setQuery(item.id);
                        onLookupBooking(item.id);
                      }}
                      className={`font-mono transition-colors cursor-pointer ${
                        isCurrent
                          ? 'font-semibold text-[#111315] underline underline-offset-4'
                          : 'text-[#1D4ED8] hover:underline underline-offset-2'
                      }`}
                    >
                      {item.id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Booking reference ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  placeholder="SP-204810"
                  className="block w-full min-h-[44px] rounded-lg border border-[#D4D4D8] bg-white pl-9 pr-3 py-2 font-mono text-sm text-[#111315] placeholder:text-[#A1A1AA] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading || !query.trim()}
                className="min-h-[44px] rounded-lg bg-[#111315] px-4 py-2 text-sm font-medium text-white hover:bg-[#27272A] disabled:bg-[#A1A1AA] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {lookupLoading ? 'Loading...' : 'Look Up'}
              </button>
            </form>

            {sessionBookings.length > 0 && (
              <button
                type="button"
                onClick={onResetDemoData}
                title="Clear local booking references; saved server bookings and inventory remain unchanged"
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#D4D4D8] bg-white px-3.5 py-2 text-xs font-medium text-[#525866] hover:bg-[#F7F7F5] hover:text-[#111315] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Clear session
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
