import { useState } from 'react';
import { useEvents } from './hooks/useEvents';
import { EventList } from './components/EventList';
import { CreateEventForm } from './components/CreateEventForm';
import { BookingModal } from './components/BookingModal';
import { AdminBookingsModal } from './components/AdminBookingsModal';
import type { EventItem } from './types';

export default function App() {
  const { events, loading, error, reload } = useEvents();
  const [bookingEvent, setBookingEvent] = useState<EventItem | null>(null);
  const [adminEvent, setAdminEvent] = useState<EventItem | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Event Booking</h1>
          <p className="mt-1 text-slate-600">Browse events and reserve your seats.</p>
        </header>

        <CreateEventForm onCreated={reload} />

        <h2 className="mb-3 mt-10 text-xl font-semibold">Upcoming events</h2>
        <EventList
          events={events}
          loading={loading}
          error={error}
          onBook={setBookingEvent}
          onViewBookings={setAdminEvent}
          onRetry={reload}
        />
      </div>

      {bookingEvent && (
        <BookingModal
          event={bookingEvent}
          onClose={() => setBookingEvent(null)}
          onBooked={reload}
        />
      )}

      {adminEvent && (
        <AdminBookingsModal
          event={adminEvent}
          onClose={() => setAdminEvent(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
