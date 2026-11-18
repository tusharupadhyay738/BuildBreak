import React, { useEffect, useState } from 'react';
import { Calendar, Check, Clock, MapPin, Ticket, X } from 'lucide-react';
import type { EventItem } from '../types/booking';
import { formatCurrency } from '../utils/formatters';

interface EventDetailModalProps {
  event: EventItem | null;
  isSelected: boolean;
  onClose: () => void;
  onReserveEvent: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isSelected,
  onClose,
  onReserveEvent,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [event?.id]);

  useEffect(() => {
    if (!event) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const totalSeats = event.totalSeats ?? 100;
  const soldOut = event.availableSeats <= 0;
  const occupancyPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalSeats - event.availableSeats) / totalSeats) * 100))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111315]/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#E4E4E7] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close program details"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 text-[#111315] shadow-sm hover:bg-white cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="aspect-[16/9] w-full overflow-hidden bg-[#18181B]">
          {!imageFailed ? (
            <img
              src={event.imageUrl}
              alt={event.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white">
              <Ticket className="h-10 w-10 text-[#93C5FD]" aria-hidden="true" />
              <p className="mt-2 font-display text-base font-semibold">{event.title}</p>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-medium text-[#525866]">
            {event.category}
            <span aria-hidden="true" className="mx-2 text-[#A1A1AA]">
              ·
            </span>
            <span className="tabular-nums">
              {soldOut ? 'Sold out' : `${event.availableSeats} of ${totalSeats} seats remaining`}
            </span>
          </p>

          <h3
            id="event-modal-title"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-[#111315]"
          >
            {event.title}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-[#3F4451]">{event.description}</p>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-y border-[#E4E4E7] py-5 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#525866]" aria-hidden="true" />
              <div>
                <dt className="text-xs text-[#525866]">Date &amp; Time</dt>
                <dd className="font-medium text-[#111315]">
                  {event.dateLabel} · {event.timeLabel}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#525866]" aria-hidden="true" />
              <div>
                <dt className="text-xs text-[#525866]">Venue</dt>
                <dd className="font-medium text-[#111315]">
                  {event.venue}, {event.city}
                </dd>
              </div>
            </div>

            {(event.doorsOpenLabel || event.durationLabel) && (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#525866]" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-[#525866]">Schedule</dt>
                  <dd className="font-medium text-[#111315]">
                    {event.doorsOpenLabel}
                    {event.durationLabel ? ` · ${event.durationLabel}` : ''}
                  </dd>
                </div>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-[#525866]">
              <span>Hall capacity reserved</span>
              <span className="font-mono tabular-nums">{occupancyPercent}% claimed</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F4F4F5]">
              <div
                className="h-full rounded-full bg-[#1D4ED8] transition-all"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-semibold tracking-wide text-[#525866]">
              Included With Ticket
            </h4>
            <ul className="mt-3 space-y-2">
              {event.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#3F4451]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#047857]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-[#E4E4E7] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="block text-xs text-[#525866]">Admission per seat</span>
              <span className="font-mono text-2xl font-bold text-[#111315] tabular-nums">
                {formatCurrency(event.unitPrice, event.currency)}
              </span>
            </div>

            <button
              type="button"
              disabled={soldOut}
              onClick={() => {
                onReserveEvent(event.id);
                onClose();
              }}
              className="min-h-[44px] rounded-lg bg-[#1D4ED8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:bg-[#A1A1AA] transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              {soldOut
                ? 'Sold Out'
                : isSelected
                ? 'Continue to Reservation'
                : 'Select Event & Reserve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
