import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiExchangeBus,
  bookingPersistence,
  SeatPilotApiError,
  seatpilotClient,
} from './api/seatpilotClient';
import { ApiContractDocs } from './components/ApiContractDocs';
import { BookingConfirmation } from './components/BookingConfirmation';
import { BookingLookupBar } from './components/BookingLookupBar';
import { CheckoutPanel } from './components/CheckoutPanel';
import { EventCatalog } from './components/EventCatalog';
import { EventDetailModal } from './components/EventDetailModal';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import type {
  ApiExchangeRecord,
  AttendeeDetails,
  BookingRecord,
  DataSourceMode,
  EventItem,
  QuoteResponse,
} from './types/booking';

export default function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceMode>('demo-fixture');

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [inspectedEvent, setInspectedEvent] = useState<EventItem | null>(null);
  const [quantity, setQuantity] = useState<number>(2);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string>('');

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteSource, setQuoteSource] = useState<DataSourceMode>('demo-fixture');
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorField, setSubmitErrorField] = useState<string | undefined>(undefined);

  const [savedBooking, setSavedBooking] = useState<BookingRecord | null>(null);
  const [savedBookingLoading, setSavedBookingLoading] = useState<boolean>(false);
  const [savedBookingError, setSavedBookingError] = useState<string | null>(null);
  const [savedBookingSource, setSavedBookingSource] = useState<DataSourceMode | null>(null);
  const [sessionBookings, setSessionBookings] = useState<BookingRecord[]>([]);

  const [exchanges, setExchanges] = useState<ApiExchangeRecord[]>([]);

  const quoteRequestCounter = useRef(0);

  const refreshSessionBookings = useCallback(() => {
    setSessionBookings(bookingPersistence.listSessionBookings());
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const result = await seatpilotClient.getEvents();
      setEvents(result.data);
      setDataSource(result.source);
      setSelectedEventId((prev) => {
        if (prev && result.data.some((e) => e.id === prev)) {
          return prev;
        }
        return result.data[0]?.id ?? '';
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to fetch events from backend.';
      setEventsError(message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const lookupBookingById = useCallback(async (bookingId: string, scrollToView: boolean) => {
    setSavedBookingLoading(true);
    setSavedBookingError(null);
    try {
      const result = await seatpilotClient.getBookingById(bookingId);
      bookingPersistence.saveBookingId(result.data.id);
      setSavedBooking(result.data);
      setSavedBookingSource(result.source);
      if (scrollToView) {
        window.setTimeout(() => {
          document.getElementById('confirmation')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    } catch (err) {
      const message =
        err instanceof SeatPilotApiError
          ? err.message
          : 'Saved booking confirmation could not be restored.';
      setSavedBooking(null);
      setSavedBookingError(message);
      bookingPersistence.clearSavedBookingId();
    } finally {
      setSavedBookingLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = apiExchangeBus.subscribe((record) => {
      setExchanges((prev) => [record, ...prev].slice(0, 8));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    void loadEvents();
    refreshSessionBookings();
    const savedId = bookingPersistence.getSavedBookingId();
    if (savedId) {
      void lookupBookingById(savedId, false);
    }
  }, [loadEvents, lookupBookingById, refreshSessionBookings]);

  // Recalculate server/demo-fixture quote whenever selection, quantity, or discount code changes
  useEffect(() => {
    if (!selectedEventId) return;
    const selectedEvent = events.find((e) => e.id === selectedEventId);
    if (!selectedEvent || selectedEvent.availableSeats <= 0) {
      setQuote(null);
      return;
    }

    const requestId = ++quoteRequestCounter.current;
    setQuoteLoading(true);
    setQuoteError(null);

    const runQuote = async () => {
      try {
        const result = await seatpilotClient.getQuote({
          eventId: selectedEventId,
          quantity,
          discountCode: appliedDiscountCode || undefined,
        });
        if (requestId !== quoteRequestCounter.current) return;
        setQuote(result.data);
        setQuoteSource(result.source);
      } catch (err) {
        if (requestId !== quoteRequestCounter.current) return;
        const apiErr = err instanceof SeatPilotApiError ? err : null;
        setQuoteError(
          apiErr?.message ?? 'Unable to validate quote for the selected configuration.'
        );

        // Keep an accurate base quote without the invalid discount code
        if (appliedDiscountCode) {
          setAppliedDiscountCode('');
          try {
            const baseResult = await seatpilotClient.getQuote({
              eventId: selectedEventId,
              quantity,
            });
            if (requestId === quoteRequestCounter.current) {
              setQuote(baseResult.data);
              setQuoteSource(baseResult.source);
            }
          } catch {
            // Ignore secondary fallback errors
          }
        }
      } finally {
        if (requestId === quoteRequestCounter.current) {
          setQuoteLoading(false);
        }
      }
    };

    void runQuote();
  }, [selectedEventId, quantity, appliedDiscountCode, events]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  const handleSelectEvent = (eventId: string, shouldScroll: boolean = false) => {
    const nextEvent = events.find((e) => e.id === eventId);
    setSelectedEventId(eventId);
    setSubmitError(null);
    setSubmitErrorField(undefined);

    if (nextEvent && nextEvent.availableSeats > 0) {
      const cap = Math.min(nextEvent.maxPerBooking, nextEvent.availableSeats);
      setQuantity((prev) => Math.max(1, Math.min(prev, cap)));
    }

    if (shouldScroll) {
      document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplyDiscount = (code: string) => {
    setQuoteError(null);
    setAppliedDiscountCode(code.trim().toUpperCase());
  };

  const handleRemoveDiscount = () => {
    setQuoteError(null);
    setAppliedDiscountCode('');
  };

  const handleSubmitBooking = async (attendee: AttendeeDetails) => {
    if (!selectedEvent) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitErrorField(undefined);

    try {
      const result = await seatpilotClient.createBooking({
        eventId: selectedEvent.id,
        quantity,
        discountCode: quote?.discountCode ?? undefined,
        attendee,
      });

      bookingPersistence.saveBookingId(result.data.id);
      setSavedBooking(result.data);
      setSavedBookingSource(result.source);
      setSavedBookingError(null);
      refreshSessionBookings();

      // Refresh event inventory counts after reservation
      await loadEvents();

      window.setTimeout(() => {
        document.getElementById('confirmation')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } catch (err) {
      if (err instanceof SeatPilotApiError) {
        setSubmitError(err.message);
        setSubmitErrorField(err.field);
      } else {
        setSubmitError('Booking could not be submitted. Please check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewBooking = () => {
    bookingPersistence.clearSavedBookingId();
    setSavedBooking(null);
    setSavedBookingError(null);
    setSavedBookingSource(null);
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetDemoData = () => {
    bookingPersistence.resetAllDemoData();
    setSavedBooking(null);
    setSavedBookingError(null);
    setSavedBookingSource(null);
    setAppliedDiscountCode('');
    setQuantity(2);
    refreshSessionBookings();
    void loadEvents();
  };

  const handleNavbarPrimaryAction = () => {
    if (savedBooking) {
      document.getElementById('confirmation')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-[#111315]">
      <Navbar
        hasSavedBooking={Boolean(savedBooking)}
        onPrimaryAction={handleNavbarPrimaryAction}
      />

      <main className="flex-1">
        <HeroSection dataSource={dataSource} eventCount={events.length || 3} />

        {/* Booking Lookup & Session Passes */}
        <BookingLookupBar
          activeBookingId={savedBooking?.id ?? null}
          sessionBookings={sessionBookings}
          lookupLoading={savedBookingLoading}
          onLookupBooking={(id) => void lookupBookingById(id, true)}
          onResetDemoData={handleResetDemoData}
        />

        {/* Saved booking confirmation sits prominently when active */}
        {(savedBooking || savedBookingLoading || savedBookingError) && (
          <BookingConfirmation
            booking={savedBooking}
            loading={savedBookingLoading}
            error={savedBookingError}
            source={savedBookingSource}
            onStartNewBooking={handleStartNewBooking}
          />
        )}

        <EventCatalog
          events={events}
          selectedEventId={selectedEventId}
          loading={eventsLoading}
          error={eventsError}
          dataSource={dataSource}
          onSelectEvent={(id) => handleSelectEvent(id, true)}
          onInspectEvent={(evt) => setInspectedEvent(evt)}
          onRetry={() => void loadEvents()}
        />

        <CheckoutPanel
          events={events}
          selectedEvent={selectedEvent}
          quantity={quantity}
          appliedDiscountCode={appliedDiscountCode}
          quote={quote}
          quoteSource={quoteSource}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          submitting={submitting}
          submitError={submitError}
          submitErrorField={submitErrorField}
          onSelectEvent={(id) => handleSelectEvent(id, false)}
          onQuantityChange={setQuantity}
          onApplyDiscount={handleApplyDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          onSubmitBooking={handleSubmitBooking}
        />

        <ApiContractDocs exchanges={exchanges} />
      </main>

      <EventDetailModal
        event={inspectedEvent}
        isSelected={inspectedEvent?.id === selectedEventId}
        onClose={() => setInspectedEvent(null)}
        onReserveEvent={(id) => handleSelectEvent(id, true)}
      />

      <Footer dataSource={dataSource} />
    </div>
  );
}
