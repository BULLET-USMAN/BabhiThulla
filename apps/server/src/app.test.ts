import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('Server Application Health & Error Endpoints', () => {
  const app = createApp();

  it('GET /api/health returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('bhabhi-thulla-server');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /api/version returns phase information', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('0.3.0');
    expect(res.body.phase).toBe(3);
    expect(res.body.multiplayerReady).toBe(true);
  });

  it('GET /unknown-route returns 404 JSON', async () => {
    const res = await request(app).get('/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
