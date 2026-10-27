import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRoute = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

// Wraps an async route so rejected promises flow to the error handler.
export const asyncHandler =
  (fn: AsyncRoute): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
