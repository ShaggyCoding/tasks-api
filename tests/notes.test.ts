import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb } from './setup';

const app = createApp();

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/auth/register').send({ email, password: 'hunter22222' });
  const res = await request(app).post('/auth/login').send({ email, password: 'hunter22222' });
  return res.body.token as string;
}

describe('notes', () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    token = await registerAndLogin('notes@example.com');
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/notes');
    expect(res.status).toBe(401);
  });

  it('creates and reads back a note', async () => {
    const create = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Einkaufsliste', body: 'Milch, Eier' });
    expect(create.status).toBe(201);
    expect(create.body.title).toBe('Einkaufsliste');

    const get = await request(app).get(`/notes/${create.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.body).toBe('Milch, Eier');
  });

  it('paginates notes and reports totals', async () => {
    for (let i = 0; i < 25; i++) {
      await request(app).post('/notes').set('Authorization', `Bearer ${token}`).send({ title: `Notiz ${i}` });
    }

    const firstPage = await request(app).get('/notes?page=1&pageSize=10').set('Authorization', `Bearer ${token}`);
    expect(firstPage.body.items).toHaveLength(10);
    expect(firstPage.body.total).toBe(25);
    expect(firstPage.body.totalPages).toBe(3);

    const lastPage = await request(app).get('/notes?page=3&pageSize=10').set('Authorization', `Bearer ${token}`);
    expect(lastPage.body.items).toHaveLength(5);
  });

  it('updates a note with PATCH', async () => {
    const create = await request(app).post('/notes').set('Authorization', `Bearer ${token}`).send({ title: 'Alt' });
    const update = await request(app)
      .patch(`/notes/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Neu' });
    expect(update.status).toBe(200);
    expect(update.body.title).toBe('Neu');
  });

  it('deletes a note', async () => {
    const create = await request(app).post('/notes').set('Authorization', `Bearer ${token}`).send({ title: 'Weg' });
    const del = await request(app).delete(`/notes/${create.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/notes/${create.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  it('does not let one user see another user\'s notes', async () => {
    const create = await request(app).post('/notes').set('Authorization', `Bearer ${token}`).send({ title: 'Geheim' });
    const otherToken = await registerAndLogin('other@example.com');

    const get = await request(app).get(`/notes/${create.body.id}`).set('Authorization', `Bearer ${otherToken}`);
    expect(get.status).toBe(404);
  });
});
