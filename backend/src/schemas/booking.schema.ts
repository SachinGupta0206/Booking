import { z } from 'zod';

export const bookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required'),
  seats: z
    .coerce
    .number()
    .int('Seats must be a whole number')
    .min(1, 'Seats must be between 1 and 4')
    .max(4, 'Seats must be between 1 and 4'),
});

export type BookingInput = z.infer<typeof bookingSchema>;
