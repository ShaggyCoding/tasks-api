import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const payload = token && verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Nicht angemeldet' });
    return;
  }
  req.user = payload;
  next();
}
