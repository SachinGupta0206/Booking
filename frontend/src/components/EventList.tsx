import type { EventItem } from '../types';
import { EventCard } from './EventCard';
import { Spinner } from './Spinner';

interface Props {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  onBook: (event: EventItem) => void;
  onViewBookings: (event: EventItem) => void;
  onRetry: () => void;
}

export function EventList({
  events,
  loading,
  error,
  onBook,
  onViewBookings,
  onRetry,
}: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p className="font-medium">Could not load events.</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-slate-500">
        No events yet. Create one above to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onBook={onBook}
          onViewBookings={onViewBookings}
        />
      ))}
    </ul>
  );
}
