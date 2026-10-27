import type { ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { HttpError } from './error.js';

// Middleware factory: parses req.body with a zod schema.
// On failure it forwards a 400 HttpError with the first issue's message.
// On success it replaces req.body with the sanitized, typed value.
export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new HttpError(400, result.error.issues[0]?.message ?? 'Invalid input'));
      return;
    }
    req.body = result.data;
    next();
  };
