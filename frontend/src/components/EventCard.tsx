import type { EventItem } from '../types';

interface Props {
  event: EventItem;
  onBook: (event: EventItem) => void;
  onViewBookings: (event: EventItem) => void;
}

function formatDate(date: string): string {
  // Parse as local midnight so the displayed day matches the stored date.
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function EventCard({ event, onBook, onViewBookings }: Props) {
  const soldOut = event.available <= 0;
  const pct =
    event.capacity > 0 ? Math.round((event.booked / event.capacity) * 100) : 0;

  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-slate-900">{event.name}</h3>
          {soldOut && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Sold out
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">{formatDate(event.date)}</p>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{event.available}</span> of{' '}
          {event.capacity} seats available
        </p>
        <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
        </div>
        <button
          onClick={() => onViewBookings(event)}
          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          View bookings
        </button>
      </div>
      <button
        onClick={() => onBook(event)}
        disabled={soldOut}
        className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Book
      </button>
    </li>
  );
}
