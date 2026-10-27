import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { EventItem } from '../types';
import { api, ApiError } from '../api/client';
import { isValidEmail } from '../utils/validation';

interface Props {
  event: EventItem;
  onClose: () => void;
  onBooked: () => Promise<void>;
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export function BookingModal({ event, onClose, onBooked }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [seats, setSeats] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Close on Escape. Clean up the listener.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!isValidEmail(email.trim())) e.email = 'Enter a valid email';
    if (seats < 1 || seats > 4) e.seats = 'Choose 1 to 4 seats';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.createBooking(event.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        seats,
      });
      setSuccess(res.message);
      // Refresh counts in the background (no full page reload).
      void onBooked();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Booking failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Book: {event.name}</h3>
            <p className="text-sm text-slate-500">
              {event.available} of {event.capacity} seats available
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

        {success ? (
          <div className="rounded-md bg-green-50 p-4 text-green-700">
            <p className="font-medium">{success}</p>
            <button
              onClick={onClose}
              className="mt-3 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Jane Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="jane@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Seats</label>
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className={inputClass}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'seat' : 'seats'}
                  </option>
                ))}
              </select>
              {errors.seats && <p className="mt-1 text-xs text-red-600">{errors.seats}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
