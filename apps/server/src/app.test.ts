import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { initDatabase, closeDatabase } from './db/connection.js';

describe('Server Application REST API Endpoints', () => {
  const app = createApp();

  beforeAll(async () => {
    await initDatabase(true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('GET /api/health returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('bhabhi-thulla-server');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /api/ready returns 200 with operational readiness', async () => {
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.database.connected).toBe(true);
    expect(typeof res.body.activeRooms).toBe('number');
  });

  it('GET /api/version returns Phase 5 information', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('0.5.0');
    expect(res.body.phase).toBe(5);
    expect(res.body.persistentStorage).toBe(true);
    expect(res.body.authoritativeStats).toBe(true);
  });

  it('POST /api/guest/register registers a guest and returns credentials', async () => {
    const res = await request(app)
      .post('/api/guest/register')
      .send({ displayName: 'TestGuest', avatarId: 'avatar-1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.guest.displayName).toBe('TestGuest');
    expect(res.body.data.sessionToken).toBeDefined();

    const guestId = res.body.data.guest.id;
    const sessionToken = res.body.data.sessionToken;

    // Verify GET /api/guest/me
    const meRes = await request(app)
      .get('/api/guest/me')
      .set('Authorization', `Bearer ${sessionToken}`)
      .set('x-guest-id', guestId);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(guestId);
    expect(meRes.body.data.displayName).toBe('TestGuest');

    // Verify GET /api/stats/:guestId
    const statsRes = await request(app).get(`/api/stats/${guestId}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.guestIdentityId).toBe(guestId);
    expect(statsRes.body.data.totalGames).toBe(0);
  });

  it('GET /api/guest/me rejects unauthorized requests', async () => {
    const res = await request(app).get('/api/guest/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/matches/history returns array of completed matches', async () => {
    const res = await request(app).get('/api/matches/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/rooms/:roomCode/leaderboard returns room leaderboard', async () => {
    const res = await request(app).get('/api/rooms/LEADTEST/leaderboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /unknown-route returns 404 JSON', async () => {
    const res = await request(app).get('/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
