import type { EventItem, BookingInput, Booking } from "../types";

// Backend base URL. On the client this is the public anon-facing API only;
// the service-role Supabase key never leaves the server.
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Errors from the API arrive as { error: string }. We surface that message.
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  // No-content response (e.g. DELETE) -> resolve with null.
  if (res.status === 204) return null as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response (e.g. 502 from proxy) -> fall through to generic error
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : "Something went wrong";
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export const api = {
  listEvents: () => request<EventItem[]>("/events"),
  createEvent: (input: { name: string; date: string; capacity: number }) =>
    request<EventItem>("/events", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createBooking: (eventId: string, input: BookingInput) =>
    request<{ success: true; message: string }>(`/events/${eventId}/bookings`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listEventBookings: (eventId: string) =>
    request<Booking[]>(`/events/${eventId}/bookings`),
  deleteBooking: (id: string) =>
    request<void>(`/bookings/${id}`, { method: "DELETE" }),
};
