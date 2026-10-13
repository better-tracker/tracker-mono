import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PORT configuration', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('defaults to 3001 when PORT is absent', async () => {
    vi.stubEnv('PORT', undefined);
    expect((await import('../../src/config/env.js')).env.port).toBe(3001);
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
