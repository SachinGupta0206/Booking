import { supabase } from "../db/supabase.js";
import { HttpError } from "../middleware/error.js";

type BookingInput = {
  name: string;
  email: string;
  seats: number;
};

export async function createBooking(
  eventId: string,
  input: BookingInput,
): Promise<{ success: true; message: string }> {
  // All the atomic logic (row lock, seat check, insert) lives in the
  // book_seats SQL function so it is race-safe even under concurrency.
  const { error } = await supabase.rpc("book_seats", {
    p_event_id: eventId,
    p_name: input.name,
    p_email: input.email,
    p_seats: input.seats,
  });

  if (error) {
    throw mapBookingError(error);
  }

  return { success: true, message: "Booking confirmed" };
}

// Cancel a booking. Because "available" is computed live as
// capacity - sum(seats), deleting the row immediately frees those seats.
export async function deleteBooking(id: string): Promise<void> {
  const { error, count } = await supabase
    .from("bookings")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    console.error("deleteBooking failed:", error);
    throw new HttpError(500, "Failed to delete booking");
  }

  // count is the number of rows actually deleted; 0 means it didn't exist.
  if (!count) {
    throw new HttpError(404, "Booking not found");
  }
}

// Translate the custom messages raised by book_seats into HTTP errors.
function mapBookingError(error: { message?: string }): HttpError {
  const msg = (error.message ?? "").trim();

  if (msg === "EVENT_NOT_FOUND") {
    return new HttpError(404, "Event not found");
  }

  // Function raises "NOT_ENOUGH_SEATS:<available>" so we can phrase it.
  if (msg.startsWith("NOT_ENOUGH_SEATS")) {
    const available = Number(msg.split(":")[1] ?? 0);
    return new HttpError(
      409,
      available > 0
        ? `Only ${available} ${available === 1 ? "seat" : "seats"} left`
        : "This event is sold out",
    );
  }

  if (msg === "DUPLICATE_BOOKING") {
    return new HttpError(409, "You have already booked this event");
  }

  console.error("Unexpected booking error:", error);
  return new HttpError(500, "Booking failed");
}
