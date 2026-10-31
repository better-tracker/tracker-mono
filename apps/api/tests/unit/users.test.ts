import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userResponseSchema } from '@project-tracker/contracts';
import type { UserRepository } from '@project-tracker/database';
import { createUsersService } from '../../src/modules/users/users.service.js';
import { userRoutes } from '../../src/modules/users/users.routes.js';
import { getAuth0Profile } from '../../src/lib/auth0-profile.js';
import { getErrorResponse, getErrorStatusCode } from '../../src/lib/http-errors.js';

vi.mock('../../src/lib/auth0-profile.js', () => ({ getAuth0Profile: vi.fn() }));
const subject = 'auth0|alice';
const row = {
  id: '33333333-3333-4333-8333-333333333333', auth0_user_id: subject,
  user_name: 'Alice', email: 'alice@example.com', profile_pic: null,
};
const profile = { user_name: row.user_name, email: row.email, profile_pic: null };
function makeRepository() {
  return {
    getUsers: vi.fn().mockResolvedValue([row]),
    createUser: vi.fn(),
    getUserById: vi.fn().mockResolvedValue(row),
    getUserByAuth0Id: vi.fn().mockResolvedValue(row),
    getOrCreateUser: vi.fn().mockResolvedValue({ ...row, password: 'private' }),
    updateUser: vi.fn().mockResolvedValue(row),
    deleteUser: vi.fn().mockResolvedValue(true),
  } satisfies UserRepository;
}
let repository: ReturnType<typeof makeRepository>;
let service: ReturnType<typeof createUsersService>;
beforeEach(() => {
  vi.clearAllMocks();
  repository = makeRepository();
  service = createUsersService(repository);
  vi.mocked(getAuth0Profile).mockResolvedValue(profile);
});

describe('Auth0 user service', () => {
  it('creates or retrieves by subject and returns only public fields', async () => {
    expect(await service.ensureUser(subject, profile)).toEqual(row);
    expect(repository.getOrCreateUser).toHaveBeenCalledWith({ ...profile, auth0_user_id: subject });
    expect(repository.createUser).not.toHaveBeenCalled();
  });
  it('returns the same local identity on repeated login', async () => {
    expect(await service.ensureUser(subject, profile)).toEqual(await service.ensureUser(subject, profile));
  });
  it('finds the current user by Auth0 subject', async () => {
    expect(await service.getCurrentUser(subject)).toEqual(row);
    expect(repository.getUserByAuth0Id).toHaveBeenCalledWith(subject);
  });
  it('updates the local UUID resolved from the subject', async () => {
    await service.updateCurrentUser(subject, { user_name: 'Updated' });
    expect(repository.updateUser).toHaveBeenCalledWith(row.id, { user_name: 'Updated' });
  });
  it('deletes the local UUID resolved from the subject', async () => {
    await service.deleteCurrentUser(subject);
    expect(repository.deleteUser).toHaveBeenCalledWith(row.id);
  });
  it.each(['get', 'update', 'delete'])('returns 404 for a missing current user on %s', async (operation) => {
    repository.getUserByAuth0Id.mockResolvedValue(null);
    const action = operation === 'get' ? service.getCurrentUser(subject)
      : operation === 'update' ? service.updateCurrentUser(subject, { user_name: 'New' })
        : service.deleteCurrentUser(subject);
    await expect(action).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.updateUser).not.toHaveBeenCalled();
    expect(repository.deleteUser).not.toHaveBeenCalled();
  });
  it('handles a user disappearing before update', async () => {
    repository.updateUser.mockResolvedValue(null);
    await expect(service.updateCurrentUser(subject, {})).rejects.toMatchObject({ statusCode: 404 });
  });
  it('handles a user disappearing before deletion', async () => {
    repository.deleteUser.mockResolvedValue(false);
    await expect(service.deleteCurrentUser(subject)).rejects.toMatchObject({ statusCode: 404 });
  });
  it.each(['ensure', 'update'])('maps unique conflicts during %s to 409', async (operation) => {
    repository.getOrCreateUser.mockRejectedValue({ code: '23505' });
    repository.updateUser.mockRejectedValue({ code: '23505' });
    await expect(operation === 'ensure' ? service.ensureUser(subject, profile)
      : service.updateCurrentUser(subject, {})).rejects.toMatchObject({ statusCode: 409 });
  });
  it('preserves unexpected database errors', async () => {
    const error = new Error('database unavailable');
    repository.getOrCreateUser.mockRejectedValue(error);
    await expect(service.ensureUser(subject, profile)).rejects.toBe(error);
  });
});

describe('current user routes and controller', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    app = Fastify();
    // Stub the SDK guard: route tests verify enforcement and identity forwarding,
    // not Auth0 JWT signature verification.
    app.decorate('requireAuth', () => async (request: import('fastify').FastifyRequest) => {
      if (request.headers.authorization !== 'Bearer valid-token') {
        throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
      }
      Object.assign(request, { user: { sub: subject } });
    });
    app.setErrorHandler((error, _request, reply) => {
      const status = getErrorStatusCode(error);
      return reply.code(status).send(getErrorResponse(error, status));
    });
    await app.register(userRoutes, { service });
  });
  afterEach(async () => { await app.close(); });
  const headers = { authorization: 'Bearer valid-token' };

  it.each(['POST', 'GET', 'PATCH', 'DELETE'] as const)('requires authentication for %s', async (method) => {
    for (const authorization of [undefined, 'Bearer invalid-token']) {
      const response = await app.inject({ method, url: '/v1/users/me', headers: authorization ? { authorization } : {},
        ...(method === 'PATCH' ? { payload: { user_name: 'New' } } : {}),
      });
      expect(response.statusCode).toBe(401);
    }
    expect(getAuth0Profile).not.toHaveBeenCalled();
    expect(repository.getUserByAuth0Id).not.toHaveBeenCalled();
    expect(repository.getOrCreateUser).not.toHaveBeenCalled();
  });
  it('POST uses the verified subject and server profile, ignoring body identity', async () => {
    const response = await app.inject({ method: 'POST', url: '/v1/users/me', headers,
      payload: { auth0_user_id: 'attacker', email: 'attacker@example.com' },
    });
    expect(response.statusCode).toBe(200);
    expect(userResponseSchema.parse(response.json())).toEqual(row);
    expect(getAuth0Profile).toHaveBeenCalledWith(headers.authorization, subject);
    expect(repository.getOrCreateUser).toHaveBeenCalledWith({ ...profile, auth0_user_id: subject });
  });
  it('GET returns the current user without fetching Auth0 profile', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/users/me', headers });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(row);
    expect(repository.getUserByAuth0Id).toHaveBeenCalledWith(subject);
    expect(getAuth0Profile).not.toHaveBeenCalled();
  });
  it.each([{ user_name: 'New' }, { profile_pic: null }, { profile_pic: 'https://example.com/new.png' }])('PATCH accepts partial profile updates', async (payload) => {
    const response = await app.inject({ method: 'PATCH', url: '/v1/users/me', headers, payload });
    expect(response.statusCode).toBe(200);
    expect(repository.updateUser).toHaveBeenCalledWith(row.id, payload);
  });
  it.each([{}, { email: 'other@example.com' }, { id: row.id }, { auth0_user_id: 'attacker' }, { user_name: '' }, { user_name: 'a'.repeat(26) }, { profile_pic: 42 }])('PATCH rejects invalid or forbidden fields', async (payload) => {
    const response = await app.inject({ method: 'PATCH', url: '/v1/users/me', headers, payload });
    expect(response.statusCode).toBe(400);
    expect(repository.updateUser).not.toHaveBeenCalled();
  });
  it('DELETE returns a bodyless 204', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/v1/users/me', headers });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect(repository.deleteUser).toHaveBeenCalledWith(row.id);
  });
  it('does not create a user if profile retrieval fails', async () => {
    vi.mocked(getAuth0Profile).mockRejectedValueOnce(Object.assign(new Error('Profile failed'), { statusCode: 502 }));
    const response = await app.inject({ method: 'POST', url: '/v1/users/me', headers });
    expect(response.statusCode).toBe(502);
    expect(repository.getOrCreateUser).not.toHaveBeenCalled();
  });
  it('returns 404 for an absent local user', async () => {
    repository.getUserByAuth0Id.mockResolvedValue(null);
    const response = await app.inject({ method: 'GET', url: '/v1/users/me', headers });
    expect(response.statusCode).toBe(404);
  });
  it('does not expose database failure details', async () => {
    repository.getUserByAuth0Id.mockRejectedValue(new Error('secret database detail'));
    const response = await app.inject({ method: 'GET', url: '/v1/users/me', headers });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('secret database detail');
  });
  it.each(['GET', 'PATCH', 'DELETE'] as const)('does not expose arbitrary-ID %s routes', async (method) => {
    expect((await app.inject({ method, url: `/v1/users/${row.id}`, headers })).statusCode).toBe(404);
  });
});
