import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PORT configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('AUTH0_DOMAIN', 'tenant.auth0.com');
    vi.stubEnv('AUTH0_AUDIENCE', 'https://tracker.example.test');
    vi.stubEnv('REDIS_URL', undefined);
    vi.stubEnv(
      'DATABASE_URL',
      'postgresql://test:test@localhost:5432/test_db'
    );
  });
  afterEach(() => { vi.unstubAllEnvs(); });
  it('rejects a missing DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', undefined);

    await expect(
      import('../../src/config/env.js')
    ).rejects.toThrow('DATABASE_URL is required');
  });

  it('defaults to 3001 when PORT is absent', async () => {
    vi.stubEnv('PORT', undefined);
    expect((await import('../../src/config/env.js')).env.port).toBe(3001);
  });

  it.each([undefined, ''])('leaves Redis disabled for REDIS_URL=%s', async (value) => {
    vi.stubEnv('REDIS_URL', value);
    expect((await import('../../src/config/env.js')).env.redisUrl).toBeUndefined();
  });

  it.each(['redis://localhost:6379', 'rediss://cache.example.com:6379'])('accepts %s', async (url) => {
    vi.stubEnv('REDIS_URL', url);
    expect((await import('../../src/config/env.js')).env.redisUrl).toBe(url);
  });

  it.each(['http://localhost:6379', 'not-a-url', 'redis://'])('rejects invalid Redis URL %s', async (url) => {
    vi.stubEnv('REDIS_URL', url);
    await expect(import('../../src/config/env.js')).rejects.toThrow(
      'REDIS_URL must be a valid redis:// or rediss:// URL',
    );
  });

  it.each(['1', '3001', '6969', '65535'])('accepts %s', async (port) => {
    vi.stubEnv('PORT', port);
    expect((await import('../../src/config/env.js')).env.port).toBe(Number(port));
  });

  it.each(['', '0', '-1', '65536', '1.5', 'not-a-port', 'Infinity'])('rejects %s', async (port) => {
    vi.stubEnv('PORT', port);
    await expect(import('../../src/config/env.js')).rejects.toThrow(
      'PORT must be an integer between 1 and 65535',
    );
  });
});


describe('Auth0 configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
    vi.stubEnv('AUTH0_DOMAIN', 'tenant.auth0.com');
    vi.stubEnv('AUTH0_AUDIENCE', 'https://tracker.example.test');
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it.each(['AUTH0_DOMAIN', 'AUTH0_AUDIENCE'])('requires %s', async (key) => {
    vi.stubEnv(key, undefined);
    await expect(import('../../src/config/env.js')).rejects.toThrow(`${key} is not configured`);
  });

  it('exposes the configured issuer domain and audience', async () => {
    const { env } = await import('../../src/config/env.js');
    expect(env.auth0Domain).toBe('tenant.auth0.com');
    expect(env.auth0Audience).toBe('https://tracker.example.test');
  });
});
