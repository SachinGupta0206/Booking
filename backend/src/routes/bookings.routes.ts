import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../middleware/error.js';
import { isValidUuid } from '../utils/uuid.js';
import * as bookingsService from '../services/bookings.service.js';

const router = Router();

// DELETE /bookings/:id — cancel a booking. Seats are freed automatically
// because available = capacity - sum(seats) is computed live.
router.delete(
  '/:id',
  (req, _res, next) => {
    if (!isValidUuid(req.params.id)) {
      return next(new HttpError(400, 'Invalid booking id'));
    }
    next();
  },
  asyncHandler(async (req, res) => {
    await bookingsService.deleteBooking(req.params.id);
    res.status(204).end();
  })
);

export default router;
