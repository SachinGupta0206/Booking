export interface EventItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  capacity: number;
  created_at: string;
  booked: number;
  available: number;
}

export interface BookingInput {
  name: string;
  email: string;
  seats: number;
}

export interface Booking {
  id: string;
  event_id: string;
  name: string;
  email: string;
  seats: number;
  created_at: string;
}
