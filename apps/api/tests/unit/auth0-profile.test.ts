import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuth0Profile } from '../../src/lib/auth0-profile.js';

vi.mock('../../src/config/env.js', () => ({ env: { auth0Domain: 'https://tenant.auth0.com/' } }));
const fetchMock = vi.fn();
const profile = { sub: 'auth0|alice', name: ' Alice ', email: 'alice@example.com', picture: 'https://example.com/avatar.png' };

beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); });

function respond(value: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(value)));
}

describe('Auth0 profile lookup', () => {
  it('forwards the bearer token to the configured HTTPS domain and maps the profile', async () => {
    respond(profile);
    await expect(getAuth0Profile('Bearer token', profile.sub)).resolves.toEqual({
      user_name: 'Alice', email: profile.email, profile_pic: profile.picture,
    });
    expect(fetchMock).toHaveBeenCalledWith('https://tenant.auth0.com/userinfo', expect.objectContaining({
      headers: { Authorization: 'Bearer token', Accept: 'application/json' },
      redirect: 'error', signal: expect.any(AbortSignal),
    }));
  });

  it.each([undefined, '', 'Basic token', 'Bearer', 'Bearer two tokens'])('rejects malformed authorization %s before fetching', async (authorization) => {
    await expect(getAuth0Profile(authorization, profile.sub)).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...profile, name: undefined, nickname: ' Ali ' }, 'Ali'],
    [{ ...profile, name: ' ', nickname: '' }, 'User'],
    [{ ...profile, name: 'a'.repeat(50) }, 'a'.repeat(25)],
  ])('normalizes display names', async (value, expected) => {
    respond(value);
    expect((await getAuth0Profile('Bearer token', profile.sub)).user_name).toBe(expected);
  });

  it('uses null for a missing picture', async () => {
    respond({ ...profile, picture: undefined });
    expect((await getAuth0Profile('Bearer token', profile.sub)).profile_pic).toBeNull();
  });

  it.each([null, [], {}, { ...profile, sub: 'auth0|someone-else' }])('rejects a missing or mismatched subject', async (value) => {
    respond(value);
    await expect(getAuth0Profile('Bearer token', profile.sub)).rejects.toMatchObject({ statusCode: 401 });
  });

  it.each([undefined, 'not-an-email'])('rejects unusable email %s', async (email) => {
    respond({ ...profile, email });
    await expect(getAuth0Profile('Bearer token', profile.sub)).rejects.toMatchObject({ statusCode: 422 });
  });

  it.each([[401, 401], [403, 502], [429, 502], [500, 502]])('maps upstream status %s to %s', async (upstream, expected) => {
    fetchMock.mockResolvedValue(new Response(null, { status: upstream }));
    await expect(getAuth0Profile('Bearer token', profile.sub)).rejects.toMatchObject({ statusCode: expected });
  });

  it.each([new Error('offline'), new DOMException('timeout', 'TimeoutError')])('handles network failures', async (error) => {
    fetchMock.mockRejectedValue(error);
    await expect(getAuth0Profile('Bearer token', profile.sub)).rejects.toMatchObject({ statusCode: 502 });
  });

  it('rejects invalid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json'));
    await expect(getAuth0Profile('Bearer token', profile.sub)).rejects.toMatchObject({ statusCode: 502 });
  });
});
