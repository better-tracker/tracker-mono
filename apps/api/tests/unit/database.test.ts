import type { FastifyInstance } from 'fastify';
import { pool } from '@project-tracker/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../src/app.js';
import { registerDatabaseLifecycle } from '../../src/lib/database.js';

const apps: FastifyInstance[] = [];
const id = '33333333-3333-4333-8333-333333333333';
function database(userName: string) {
  return {
    query: vi.fn().mockResolvedValue({
      rows: [{ id, auth0_user_id: 'auth0|alice', user_name: userName, email: `${userName}@example.com`, profile_pic: null, password: 'private' }],
      rowCount: 1,
    }),
    end: vi.fn().mockResolvedValue(undefined),
  };
}
function appWith(connection: ReturnType<typeof database>) {
  const app = buildApp({ database: connection });
  app.addHook('onReady', async () => {
    vi.spyOn(app.auth0Client!, 'verifyAccessToken').mockResolvedValue({ sub: 'auth0|alice' });
  });
  apps.push(app);
  return app;
}
beforeEach(() => {
  vi.spyOn(pool, 'query').mockImplementation(() => { throw new Error('Unexpected default database access'); });
});
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  vi.restoreAllMocks();
});

describe('application database ownership', () => {
  it('isolates two applications and leaves injected connections caller-owned', async () => {
    const first = database('alice');
    const second = database('bob');
    const firstApp = appWith(first);
    const secondApp = appWith(second);
    await Promise.all([firstApp.ready(), secondApp.ready()]);
    expect(first.query).not.toHaveBeenCalled();
    expect(second.query).not.toHaveBeenCalled();
    const responses = await Promise.all([firstApp, secondApp].map((app) => app.inject({ method: 'GET', url: '/v1/users/me', headers: { authorization: 'Bearer test-token' } })));
    expect(responses.map((response) => response.json().user_name)).toEqual(['alice', 'bob']);
    expect(responses[0].json()).not.toHaveProperty('password');
    await firstApp.close();
    expect(first.end).not.toHaveBeenCalled();
    expect((await secondApp.inject({ method: 'GET', url: '/v1/users/me', headers: { authorization: 'Bearer test-token' } })).statusCode).toBe(200);
    await secondApp.close();
    expect(second.end).not.toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('closes a server-owned pool exactly once, without querying it during startup', async () => {
    const owned = database('alice');
    const app = appWith(owned);
    registerDatabaseLifecycle(app, owned);
    await app.ready();
    expect(owned.query).not.toHaveBeenCalled();
    expect(owned.end).not.toHaveBeenCalled();
    await app.close();
    await app.close();
    expect(owned.end).toHaveBeenCalledOnce();
  });

  it('can release an owned pool after startup fails', async () => {
    const owned = database('alice');
    const app = appWith(owned);
    registerDatabaseLifecycle(app, owned);
    app.addHook('onReady', async () => { throw new Error('Startup failed'); });
    await expect(app.ready()).rejects.toThrow('Startup failed');
    await app.close();
    expect(owned.end).toHaveBeenCalledOnce();
  });

  it.each(['GET', 'PATCH', 'DELETE'] as const)('keeps the existing missing-user 404 for %s', async (method) => {
    const connection = database('alice');
    connection.query.mockResolvedValue({ rows: [], rowCount: 0 });
    const app = appWith(connection);
    const response = await app.inject({
      method, url: '/v1/users/me', headers: { authorization: 'Bearer test-token' },
      ...(method === 'PATCH' ? { payload: { user_name: 'alice' } } : {}),
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'REQUEST_ERROR', message: 'User not found' } });
  });

  it('keeps duplicate-user errors at 409', async () => {
    const connection = database('alice');
    connection.query.mockReset().mockResolvedValueOnce({ rows: [{ id, auth0_user_id: 'auth0|alice', user_name: 'alice', email: 'alice@example.com', profile_pic: null }], rowCount: 1 }).mockRejectedValueOnce({ code: '23505' });
    const response = await appWith(connection).inject({
      method: 'PATCH', url: '/v1/users/me', headers: { authorization: 'Bearer test-token' }, payload: { user_name: 'alice' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ error: { code: 'REQUEST_ERROR', message: 'Username, email, or Auth0 user is already in use' } });
  });
});
