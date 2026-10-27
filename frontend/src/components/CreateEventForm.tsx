import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { isValidCalendarDate, todayStr } from '../utils/validation';

interface Props {
  onCreated: () => Promise<void>;
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export function CreateEventForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = 'Name is required';
    else if (trimmed.length > 100) e.name = 'Name must be 100 characters or fewer';

    if (!date) e.date = 'Date is required';
    else if (!isValidCalendarDate(date)) e.date = 'Enter a real date';
    else if (date < todayStr()) e.date = 'Date cannot be in the past';

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500)
      e.capacity = 'Capacity must be a whole number from 1 to 500';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function reset() {
    setName('');
    setDate('');
    setCapacity(50);
    setErrors({});
    setServerError(null);
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      await api.createEvent({ name: name.trim(), date, capacity });
      reset();
      setOpen(false);
      await onCreated();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
      >
        + New event
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Create event</h2>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close form"
        >
          ✕
        </button>
      </div>

      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className={inputClass}
          placeholder="React Meetup #3"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Capacity</label>
          <input
            type="number"
            min={1}
            max={500}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className={inputClass}
          />
          {errors.capacity && <p className="mt-1 text-xs text-red-600">{errors.capacity}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create event'}
        </button>
      </div>
    </form>
  );
}
