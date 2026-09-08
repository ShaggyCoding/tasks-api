import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb } from './setup';

const app = createApp();

describe('POST /auth/register', () => {
  beforeEach(resetDb);

  it('creates a new user and never returns the password hash', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@example.com', password: 'hunter22222' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('a@example.com');
    expect(res.body.password_hash).toBeUndefined();
  });

  it('rejects a weak password', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'hunter22222' });
    const res = await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'hunter22222' });
    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await resetDb();
    await request(app).post('/auth/register').send({ email: 'login@example.com', password: 'hunter22222' });
  });

  it('returns a token for correct credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'hunter22222' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'wrongwrong' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'hunter22222' });
    expect(res.status).toBe(401);
  });
});
