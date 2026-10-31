import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

// Uses the actual SDK registered by buildApp. Missing/malformed tokens must
// be rejected before any profile lookup or database work is attempted.
describe('Auth0 SDK wiring', () => {
  let app: FastifyInstance;
  const query = vi.fn();
  beforeEach(() => {
    query.mockReset();
    app = buildApp({ database: { query } });
  });
  afterEach(async () => { await app.close(); });

  it.each(['GET', 'POST', 'PATCH', 'DELETE'] as const)('rejects a missing token on %s /users/me', async (method) => {
    const response = await app.inject({ method, url: '/v1/users/me',
      ...(method === 'PATCH' ? { payload: { user_name: 'New' } } : {}),
    });
    expect(response.statusCode).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects a malformed bearer token', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/users/me', headers: { authorization: 'Bearer not-a-jwt' } });
    expect(response.statusCode).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
});
