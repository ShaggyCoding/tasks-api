import { migrate, pool } from '../src/db';

export async function setup(): Promise<void> {
  await migrate();
  await pool.end();
}
