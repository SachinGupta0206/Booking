import { useCallback, useEffect, useState } from 'react';
import type { EventItem, Booking } from '../types';
import { api, ApiError } from '../api/client';
import { Spinner } from './Spinner';

interface Props {
  event: EventItem;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminBookingsModal({ event, onClose, onChanged }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await api.listEventBookings(event.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function cancel(id: string) {
    setCancellingId(id);
    try {
      await api.deleteBooking(id);
      await load(); // refresh this list
      await onChanged(); // refresh event seat counts behind the modal
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Bookings: {event.name}
            </h3>
            <p className="text-sm text-slate-500">
              {event.booked} of {event.capacity} seats booked
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : bookings.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No bookings yet.
          </p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-auto">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-md border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{b.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {b.email} · {b.seats} {b.seats === 1 ? 'seat' : 'seats'} ·{' '}
                    {formatTime(b.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => cancel(b.id)}
                  disabled={cancellingId === b.id}
                  className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
