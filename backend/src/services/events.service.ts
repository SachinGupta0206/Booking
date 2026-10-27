import { supabase } from "../db/supabase.js";
import { HttpError } from "../middleware/error.js";
import type { Booking } from "../types.js";

export type EventWithCounts = {
  id: string;
  name: string;
  date: string;
  capacity: number;
  created_at: string;
  booked: number;
  available: number;
};

export async function createEvent(input: {
  name: string;
  date: string;
  capacity: number;
}): Promise<EventWithCounts> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      name: input.name,
      date: input.date,
      capacity: input.capacity,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createEvent failed:", error);
    throw new HttpError(500, "Failed to create event");
  }

  return { ...data, booked: 0, available: data.capacity } as EventWithCounts;
}

export async function listEvents(): Promise<EventWithCounts[]> {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (error || !events) {
    console.error("listEvents failed:", error);
    throw new HttpError(500, "Failed to load events");
  }

  // One query for all booking rows, then aggregate in JS. Keeps it simple and
  // avoids a second SQL view.
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("event_id, seats");

  if (bookingsError) {
    console.error("listEvents bookings failed:", bookingsError);
    throw new HttpError(500, "Failed to load events");
  }

  const bookedByEvent = new Map<string, number>();
  for (const b of bookings ?? []) {
    bookedByEvent.set(
      b.event_id,
      (bookedByEvent.get(b.event_id) ?? 0) + b.seats,
    );
  }

  return events.map((e) => {
    const booked = bookedByEvent.get(e.id) ?? 0;
    return { ...e, booked, available: e.capacity - booked } as EventWithCounts;
  });
}

// Admin view: every booking for one event. 404 if the event itself is missing.
export async function listEventBookings(eventId: string): Promise<Booking[]> {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    console.error("listEventBookings event check failed:", eventError);
    throw new HttpError(500, "Failed to load bookings");
  }
  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listEventBookings failed:", error);
    throw new HttpError(500, "Failed to load bookings");
  }

  return (bookings ?? []) as Booking[];
}
