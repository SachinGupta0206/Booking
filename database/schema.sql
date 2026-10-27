-- =========================================================
-- Mini Event Booking App — Supabase schema
-- Run this whole file in the Supabase SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- It is idempotent: safe to run more than once.
-- =========================================================

-- 1) Events table ------------------------------------------------
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 100),
  date       date not null,
  capacity   int  not null check (capacity between 1 and 500),
  created_at timestamptz not null default now()
);

-- 2) Bookings table ---------------------------------------------
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null,
  email      text not null,
  seats      int  not null check (seats between 1 and 4),
  created_at timestamptz not null default now(),
  -- One email can book a given event only once.
  unique (event_id, email)
);

-- 3) Always store emails lowercase so the unique constraint
--    behaves case-insensitively.
create or replace function public.lowercase_email()
returns trigger language plpgsql as $$
begin
  new.email = lower(new.email);
  return new;
end;
$$;

drop trigger if exists trg_lowercase_email on public.bookings;
create trigger trg_lowercase_email
before insert or update on public.bookings
for each row execute function public.lowercase_email();

-- 4) book_seats(event_id, name, email, seats) --------------------
-- Books seats atomically inside a single transaction:
--   * locks the event row with SELECT ... FOR UPDATE
--   * sums the seats already booked
--   * inserts the booking, or raises a clear, parseable error
-- Two concurrent bookings can never overbook because the row
-- lock serializes the transactions against the same event.
create or replace function public.book_seats(
  p_event_id uuid,
  p_name     text,
  p_email    text,
  p_seats    int
) returns void language plpgsql as $$
declare
  v_capacity  int;
  v_booked    int;
  v_available int;
begin
  -- Lock this event's row; concurrent book_seats calls wait here.
  select e.capacity
    into v_capacity
  from public.events e
  where e.id = p_event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Total seats already booked for this event.
  select coalesce(sum(b.seats), 0)
    into v_booked
  from public.bookings b
  where b.event_id = p_event_id;

  v_available := v_capacity - v_booked;

  if p_seats > v_available then
    -- Embed the remaining count so the API can build a friendly message.
    raise exception 'NOT_ENOUGH_SEATS:%', v_available using errcode = 'P0003';
  end if;

  -- Insert the booking; the unique(event_id, email) constraint
  -- prevents the same email booking twice.
  insert into public.bookings (event_id, name, email, seats)
  values (p_event_id, p_name, lower(p_email), p_seats);

exception
  when unique_violation then
    raise exception 'DUPLICATE_BOOKING' using errcode = 'P0004';
end;
$$;
