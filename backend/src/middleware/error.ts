import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Throw this for any expected, recoverable failure. Carries an HTTP status.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

// Central error handler. Every response is { error: message } with the right
// status. Stack traces are never sent to the client.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    // Fallback for any schema parsed with .parse() instead of safeParse.
    res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  // Malformed JSON body rejected by express.json().
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

// 404 handler for any route that is not matched.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' });
};
