import { pool } from '../src/db';

export async function resetDb(): Promise<void> {
  await pool.query('TRUNCATE TABLE notes, users RESTART IDENTITY CASCADE');
}
