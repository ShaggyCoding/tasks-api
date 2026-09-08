import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db';
import { validateBody } from '../middleware/validate';
import { signToken } from '../lib/jwt';
import { HttpError } from '../lib/http-error';
import { UserRow } from '../types';

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
});

router.post('/register', validateBody(credentialsSchema), async (req, res, next) => {
  const { email, password } = req.body as z.infer<typeof credentialsSchema>;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query<Pick<UserRow, 'id' | 'email' | 'created_at'>>(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), passwordHash],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code?: string }).code === '23505') {
      next(new HttpError(409, 'E-Mail ist bereits registriert'));
      return;
    }
    next(err);
  }
});

router.post('/login', validateBody(credentialsSchema), async (req, res, next) => {
  const { email, password } = req.body as z.infer<typeof credentialsSchema>;
  try {
    const result = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    const valid = user && (await bcrypt.compare(password, user.password_hash));
    if (!valid) {
      next(new HttpError(401, 'E-Mail oder Passwort falsch'));
      return;
    }
    const token = signToken({ sub: user.id, email: user.email });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
