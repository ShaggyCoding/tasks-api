import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthTokenPayload } from '../types';

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '2h' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}
