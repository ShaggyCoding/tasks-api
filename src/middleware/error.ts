import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http-error';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Keine Route für ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
}
