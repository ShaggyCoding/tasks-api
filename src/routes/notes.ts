import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { parsePageParams, toPage } from '../lib/pagination';
import { HttpError } from '../lib/http-error';
import { NoteRow } from '../types';

const router = Router();
router.use(requireAuth);

const noteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(10000).default(''),
});

const noteUpdateSchema = noteSchema.partial();

async function loadOwnedNote(id: number, userId: number): Promise<NoteRow> {
  const result = await pool.query<NoteRow>('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [id, userId]);
  const note = result.rows[0];
  if (!note) throw new HttpError(404, 'Notiz nicht gefunden');
  return note;
}

router.get('/', async (req, res, next) => {
  try {
    const pageParams = parsePageParams(req.query as Record<string, unknown>);
    const search = typeof req.query.search === 'string' ? `%${req.query.search}%` : null;
    const userId = req.user!.sub;

    const where = search ? 'user_id = $1 AND title ILIKE $2' : 'user_id = $1';
    const params: unknown[] = search ? [userId, search] : [userId];

    const countResult = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM notes WHERE ${where}`, params);
    const total = Number(countResult.rows[0].count);

    const listResult = await pool.query<NoteRow>(
      `SELECT * FROM notes WHERE ${where} ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`,
      [...params, pageParams.pageSize, (pageParams.page - 1) * pageParams.pageSize],
    );

    res.json(toPage(listResult.rows, total, pageParams));
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(noteSchema), async (req, res, next) => {
  try {
    const { title, body } = req.body as z.infer<typeof noteSchema>;
    const result = await pool.query<NoteRow>(
      'INSERT INTO notes (user_id, title, body) VALUES ($1, $2, $3) RETURNING *',
      [req.user!.sub, title, body],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const note = await loadOwnedNote(Number(req.params.id), req.user!.sub);
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validateBody(noteUpdateSchema), async (req, res, next) => {
  try {
    const existing = await loadOwnedNote(Number(req.params.id), req.user!.sub);
    const { title, body } = req.body as z.infer<typeof noteUpdateSchema>;
    const result = await pool.query<NoteRow>(
      'UPDATE notes SET title = $1, body = $2, updated_at = now() WHERE id = $3 RETURNING *',
      [title ?? existing.title, body ?? existing.body, existing.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const note = await loadOwnedNote(Number(req.params.id), req.user!.sub);
    await pool.query('DELETE FROM notes WHERE id = $1', [note.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
