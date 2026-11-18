import type { BookingRecord } from '../types/booking';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatBookingTimestamp(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoDate;
  }
}

export function downloadCalendarInvite(booking: BookingRecord): void {
  const startDateMap: Record<string, { start: string; end: string }> = {
    'evt-nocturne-symphony': { start: '20261211T200000', end: '20261211T213000' },
    'evt-solstice-film': { start: '20261219T193000', end: '20261219T212000' },
    'evt-kinetica-forum': { start: '20270114T183000', end: '20270114T203000' },
  };
  const slot = startDateMap[booking.eventId] ?? {
    start: '20261211T200000',
    end: '20261211T213000',
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SeatPilot//Event Reservation//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@seatpilot.local`,
    `DTSTAMP:${new Date(booking.createdAt).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${slot.start}`,
    `DTEND:${slot.end}`,
    `SUMMARY:${booking.eventTitle} (${booking.quantity} Tickets)`,
    `LOCATION:${booking.venue}, ${booking.city}`,
    `DESCRIPTION:SeatPilot Booking Reference ${booking.id} for ${booking.attendee.fullName}. Fictional demo reservation.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${booking.id}-${booking.eventId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
