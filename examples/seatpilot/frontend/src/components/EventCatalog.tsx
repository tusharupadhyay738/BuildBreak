import React, { useMemo, useState } from 'react';
import { Calendar, Check, Info, MapPin, Ticket } from 'lucide-react';
import type { DataSourceMode, EventItem } from '../types/booking';
import { formatCurrency } from '../utils/formatters';

interface EventCatalogProps {
  events: EventItem[];
  selectedEventId: string;
  loading: boolean;
  error: string | null;
  dataSource: DataSourceMode;
  onSelectEvent: (eventId: string) => void;
  onInspectEvent: (event: EventItem) => void;
  onRetry: () => void;
}

type CategoryFilter = 'all' | 'music' | 'cinema' | 'design';
type SortOption = 'featured' | 'price-asc' | 'price-desc';

const FILTER_TABS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Programs' },
  { id: 'music', label: 'Chamber Music' },
  { id: 'cinema', label: '35mm Cinema' },
  { id: 'design', label: 'Architecture' },
];

function matchesCategory(event: EventItem, filter: CategoryFilter): boolean {
  if (filter === 'all') return true;
  const cat = event.category.toLowerCase();
  if (filter === 'music') return cat.includes('chamber');
  if (filter === 'cinema') return cat.includes('cinema');
  if (filter === 'design') return cat.includes('design');
  return true;
}

const EventCardImage: React.FC<{ event: EventItem }> = ({ event }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-6 text-center text-white">
        <Ticket className="h-8 w-8 text-[#93C5FD]" aria-hidden="true" />
        <span className="mt-2 font-display text-sm font-semibold">{event.title}</span>
      </div>
    );
  }

  return (
    <div className="aspect-[4/3] w-full overflow-hidden bg-[#18181B]">
      <img
        src={event.imageUrl}
        alt={event.imageAlt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
      />
    </div>
  );
};

export const EventCatalog: React.FC<EventCatalogProps> = ({
  events,
  selectedEventId,
  loading,
  error,
  dataSource,
  onSelectEvent,
  onInspectEvent,
  onRetry,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  const visibleEvents = useMemo(() => {
    const filtered = events.filter((evt) => matchesCategory(evt, categoryFilter));
    if (sortOption === 'price-asc') {
      return [...filtered].sort((a, b) => a.unitPrice - b.unitPrice);
    }
    if (sortOption === 'price-desc') {
      return [...filtered].sort((a, b) => b.unitPrice - a.unitPrice);
    }
    return filtered;
  }, [events, categoryFilter, sortOption]);

  return (
    <section id="events" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#111315] sm:text-3xl">
            Featured Events
          </h2>
          <p className="mt-1.5 text-sm text-[#525866]">
            Select one of the three fictional programs below to inspect schedule details or configure
            tickets.
          </p>
        </div>

        <p className="text-xs font-medium text-[#525866] whitespace-nowrap shrink-0">
          Source:{' '}
          <span className="font-mono text-[#111315]">
            {dataSource === 'demo-fixture' ? 'GET /api/events (Demo Fixture)' : 'GET /api/events'}
          </span>
        </p>
      </div>

      {/* Filter & Sort toolbar */}
      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Filter events by program type"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-[#E4E4E7]/60 p-1 sm:inline-flex"
        >
          {FILTER_TABS.map((tab) => {
            const active = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setCategoryFilter(tab.id)}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#111315] shadow-xs'
                    : 'text-[#525866] hover:text-[#111315]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="event-sort-select" className="text-xs font-medium text-[#525866]">
            Sort:
          </label>
          <select
            id="event-sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="min-h-[40px] rounded-lg border border-[#D4D4D8] bg-white px-3 py-1.5 text-xs font-medium text-[#111315] focus:border-[#1D4ED8] focus:outline-none"
          >
            <option value="featured">Season Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-[#E4E4E7] bg-white"
              aria-hidden="true"
            >
              <div className="aspect-[4/3] w-full bg-[#E4E4E7]/60 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-1/2 rounded bg-[#E4E4E7]" />
                <div className="h-5 w-4/5 rounded bg-[#E4E4E7]" />
                <div className="h-12 w-full rounded bg-[#E4E4E7]/70" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-6 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-display text-base font-semibold text-[#991B1B]">
              Unable to load event catalog
            </p>
            <p className="mt-1 text-sm text-[#7F1D1D]">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] rounded-lg bg-[#991B1B] px-4 py-2 text-sm font-medium text-white hover:bg-[#7F1D1D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {visibleEvents.map((event) => {
            const isSelected = event.id === selectedEventId;
            const soldOut = event.availableSeats <= 0;

            return (
              <article
                key={event.id}
                className={`group flex flex-col overflow-hidden rounded-xl border bg-white transition-all duration-150 ${
                  isSelected
                    ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8]'
                    : 'border-[#E4E4E7] hover:-translate-y-0.5 hover:border-[#D4D4D8]'
                }`}
              >
                <EventCardImage event={event} />

                <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-medium text-[#525866]">
                      {event.category}
                      <span aria-hidden="true" className="mx-1.5 text-[#A1A1AA]">
                        ·
                      </span>
                      <span className="tabular-nums">
                        {soldOut ? 'Sold out' : `${event.availableSeats} seats left`}
                      </span>
                    </p>

                    <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#111315]">
                      {event.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-[#525866]">
                      {event.description}
                    </p>

                    <dl className="mt-4 space-y-1.5 border-t border-[#F4F4F5] pt-4 text-xs text-[#3F4451]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[#525866]" aria-hidden="true" />
                        <dt className="sr-only">Date and time</dt>
                        <dd>
                          {event.dateLabel} · {event.timeLabel}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#525866]" aria-hidden="true" />
                        <dt className="sr-only">Venue</dt>
                        <dd>
                          {event.venue}, {event.city}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#E4E4E7] pt-4">
                    <div>
                      <span className="block text-xs text-[#525866]">Ticket price</span>
                      <span className="font-mono text-lg font-semibold text-[#111315] tabular-nums">
                        {formatCurrency(event.unitPrice, event.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onInspectEvent(event)}
                        aria-label={`Program details for ${event.title}`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs font-medium text-[#525866] hover:bg-[#F7F7F5] hover:text-[#111315] transition-colors cursor-pointer"
                      >
                        <Info className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={() => onSelectEvent(event.id)}
                        className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                          soldOut
                            ? 'bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#1D4ED8] text-white'
                            : 'border border-[#D4D4D8] bg-white text-[#111315] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                        {soldOut ? 'Sold Out' : isSelected ? 'Selected' : 'Select Event'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
