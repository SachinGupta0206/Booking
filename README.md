# Mini Event Booking App

A small full-stack app to browse events and book seats, with race-safe booking.

**Stack:** Node.js + Express + TypeScript (backend), Supabase Postgres (database),
React + Vite + TypeScript + Tailwind (frontend), Zod for validation.

## Features

- Create events, list events with live **booked** / **available** seat counts
- Book 1–4 seats per event (one email per event)
- Race-safe booking via a Postgres function using `SELECT ... FOR UPDATE`
- Client-side + server-side validation; server errors shown in the UI
- Loading / empty / error states; submit button disabled while saving
- Sold-out badge + disabled booking; admin bookings view; cancel a booking (frees seats)

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)

## 1. Database

Open the Supabase dashboard → **SQL Editor → New query** → paste `database/schema.sql` → **Run**.
This creates the `events` and `bookings` tables, the lowercase-email trigger, and the
`book_seats()` function. The script is idempotent (safe to re-run).

## 2. Backend

```bash
cd backend
cp .env.example .env      # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL
npm install
npm run dev               # http://localhost:4000
```

## 3. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev               # http://localhost:5173
```

## API

| Method | Path                 | Purpose                           |
| ------ | -------------------- | --------------------------------- |
| GET    | /health              | health check                      |
| POST   | /events              | create an event                   |
| GET    | /events              | list events with booked/available |
| POST   | /events/:id/bookings | book seats                        |
| GET    | /events/:id/bookings | admin: list bookings for an event |
| DELETE | /bookings/:id        | cancel a booking (frees seats)    |

All errors return `{ "error": "message" }` with the right status (400 / 404 / 409 / 500).
Stack traces are never leaked.

## Testing with curl

```bash
BASE=http://localhost:4000

# Create an event (201) -> copy the "id" into EVENT_ID
curl -s -X POST $BASE/events -H "Content-Type: application/json" \
  -d '{"name":"React Meetup","date":"2026-12-05","capacity":10}'

EVENT_ID=<paste id from the response above>

# List events (200) -> shows booked + available per event
curl -s $BASE/events

# Book seats (201)
curl -s -X POST $BASE/events/$EVENT_ID/bookings -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","seats":2}'

# ---- Failure cases ----

# Past date (400)
curl -s -X POST $BASE/events -H "Content-Type: application/json" \
  -d '{"name":"Old","date":"2020-01-01","capacity":10}'

# Capacity 0 (400)
curl -s -X POST $BASE/events -H "Content-Type: application/json" \
  -d '{"name":"Bad","date":"2026-12-05","capacity":0}'

# Unreal date 2026-02-31 (400)
curl -s -X POST $BASE/events -H "Content-Type: application/json" \
  -d '{"name":"Bad","date":"2026-02-31","capacity":10}'

# Overbooking (409) — make a capacity-1 event, then ask for 2 seats
curl -s -X POST $BASE/events -H "Content-Type: application/json" \
  -d '{"name":"Tiny","date":"2026-12-05","capacity":1}'
TINY_ID=<paste id from above>
curl -s -X POST $BASE/events/$TINY_ID/bookings -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","seats":2}'
# -> {"error":"Only 1 seat left"}

# Duplicate email (409) — same email booking the same event again
curl -s -X POST $BASE/events/$EVENT_ID/bookings -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","seats":1}'
# -> {"error":"You have already booked this event"}

# Unknown event (404)
curl -s -X POST $BASE/events/00000000-0000-4000-8000-000000000000/bookings \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","seats":1}'
# -> {"error":"Event not found"}

# Invalid uuid (400)
curl -s -X POST $BASE/events/not-a-uuid/bookings -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","seats":1}'
# -> {"error":"Invalid event id"}

# Admin: list bookings for an event (200)
curl -s $BASE/events/$EVENT_ID/bookings

# Cancel a booking (204) — frees the seats again
BOOKING_ID=<paste id from the bookings list>
curl -s -X DELETE $BASE/bookings/$BOOKING_ID -o /dev/null -w "%{http_code}\n"
# -> 204
```

## How overbooking is prevented (5 lines)

1. Every booking runs inside one database transaction in the `book_seats()` function.
2. It locks the event row with `SELECT ... FOR UPDATE` before doing anything else.
3. A second concurrent booking blocks on that lock until the first transaction commits.
4. Each transaction then sums already-booked seats and checks against capacity before inserting.
5. So two people grabbing the last seats can never exceed capacity — they serialize safely.

## What I'd do next (3 lines)

- Add Supabase Auth with per-user booking history and admin/organizer roles.
- Add pagination + server-side search/filtering for events and bookings.
- Add idempotency keys on bookings for safe retries, plus a waitlist for sold-out events.

## Deployment

### Step 1: Deploy Backend to Render

**Manual Web Service (Recommended):**

1. Push this repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Name**: `event-booking-api`
   - **Region**: Oregon (or closest)
   - **Root Directory**: `backend` ⚠️ **IMPORTANT**
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **Advanced** → Add **Environment Variables**:
   - `NODE_VERSION` = `20.14.0`
   - `SUPABASE_URL` = `https://heysljqldxsttsqzdnnf.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (paste your full key from above)
   - `FRONTEND_URL` = `http://localhost:5173` (temporary; update after Step 2)
6. Click **Create Web Service** → wait 3-5 minutes for build.
7. Copy the backend URL (e.g., `https://event-booking-api.onrender.com`).
8. Test: `curl https://YOUR-URL.onrender.com/health` → should return `{"status":"ok"}`

**Note:** Render injects `PORT` automatically. Health check endpoint is `/health`.

### Step 2: Deploy Frontend to Vercel

1. Push this repo to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) → **Import Project**.
3. Select your repo → Vercel auto-detects Vite.
4. Set **Root Directory** to `frontend`.
5. Add env var: `VITE_API_URL` = `https://event-booking-api.onrender.com` (your Render URL from Step 1).
6. Deploy → copy the Vercel URL (e.g., `https://your-app.vercel.app`).
7. **Important:** Go back to Render dashboard → update `FRONTEND_URL` to your Vercel URL → redeploy backend.

`frontend/vercel.json` is included for SPA routing.

## Production Checklist

Before going live:

- [ ] Run `database/schema.sql` in Supabase SQL Editor
- [ ] Deploy backend to Render (set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`)
- [ ] Deploy frontend to Vercel (set `VITE_API_URL` to Render backend URL)
- [ ] Update `FRONTEND_URL` in Render to your Vercel URL and redeploy backend
- [ ] Test: create an event, book seats, verify sold-out badge, cancel a booking

## Notes

- The Supabase service role key is used **on the server only**; never in the frontend.
- `.gitignore` excludes `.env`; `.env.example` files document the required variables.
- CORS is restricted to `FRONTEND_URL` — update it after deploying the frontend.
