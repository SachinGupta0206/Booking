import { z } from 'zod';

// Validate a real calendar date in YYYY-MM-DD and reject rollovers like
// 2026-02-31. JS Date.UTC rolls invalid days into the next month, so we
// confirm the constructed date matches the input parts.
function isValidCalendarDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

// Today's date as YYYY-MM-DD in UTC; used for the "not in the past" check.
const todayUtc = (): string => new Date().toISOString().slice(0, 10);

export const createEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(isValidCalendarDate, 'Date must be a real calendar date')
    .refine((d) => d >= todayUtc(), 'Date cannot be in the past'),
  capacity: z
    .coerce
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be between 1 and 500')
    .max(500, 'Capacity must be between 1 and 500'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
