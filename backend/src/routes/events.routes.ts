import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { HttpError } from "../middleware/error.js";
import { isValidUuid } from "../utils/uuid.js";
import { createEventSchema } from "../schemas/event.schema.js";
import { bookingSchema } from "../schemas/booking.schema.js";
import * as eventsService from "../services/events.service.js";
import * as bookingsService from "../services/bookings.service.js";

const router = Router();

// POST /events — create an event.
router.post(
  "/",
  validateBody(createEventSchema),
  asyncHandler(async (req, res) => {
    const event = await eventsService.createEvent(req.body);
    res.status(201).json(event);
  }),
);

// GET /events — list events with booked + available seat counts.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const events = await eventsService.listEvents();
    res.json(events);
  }),
);

// POST /events/:id/bookings — book seats for an event.
router.post(
  "/:id/bookings",
  (req, _res, next) => {
    if (!isValidUuid(req.params.id)) {
      return next(new HttpError(400, "Invalid event id"));
    }
    next();
  },
  validateBody(bookingSchema),
  asyncHandler(async (req, res) => {
    const result = await bookingsService.createBooking(req.params.id, req.body);
    res.status(201).json(result);
  }),
);

// GET /events/:id/bookings — admin view of all bookings for an event.
router.get(
  "/:id/bookings",
  (req, _res, next) => {
    if (!isValidUuid(req.params.id)) {
      return next(new HttpError(400, "Invalid event id"));
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const bookings = await eventsService.listEventBookings(req.params.id);
    res.json(bookings);
  }),
);

export default router;
