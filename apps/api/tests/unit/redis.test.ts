import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { redis, registerRedisLifecycle } from '../../src/lib/redis.js';

describe('optional Redis lifecycle', () => {
  const apps: ReturnType<typeof Fastify>[] = [];

  function setup() {
    const app = Fastify();
    const client = {
      isOpen: false,
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    };
    client.connect.mockImplementation(async () => { client.isOpen = true; });
    client.close.mockImplementation(async () => { client.isOpen = false; });
    apps.push(app);
    registerRedisLifecycle(app, client);
    return { app, client };
  }

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('does not open a connection when the module is imported', () => {
    expect(redis.isOpen).toBe(false);
    expect(redis.options?.disableOfflineQueue).toBe(true);
    expect(redis.options?.socket?.reconnectStrategy).toBe(false);
  });

  it('rejects commands while disconnected instead of waiting for a connection', async () => {
    await expect(redis.bf.exists('bloom:users:email:v1', 'a@example.com')).rejects.toThrow();
  });

  it('connects at startup and closes after the app shuts down', async () => {
    const { app, client } = setup();
    expect(client.connect).not.toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));

    await app.ready();
    expect(client.connect).toHaveBeenCalledOnce();
    await app.close();
    expect(client.close).toHaveBeenCalledOnce();
  });

  it('allows the API to start when Redis is unavailable', async () => {
    const { app, client } = setup();
    const warn = vi.spyOn(app.log, 'warn');
    const failure = new Error('Connection refused');
    client.connect.mockRejectedValueOnce(failure);

    await app.ready();
    expect(warn).toHaveBeenCalledWith(
      { err: failure }, 'Redis unavailable; use database checks',
    );
    await app.close();
    expect(client.close).not.toHaveBeenCalled();
  });

  it('destroys a partially opened connection after startup fails', async () => {
    const { app, client } = setup();
    client.connect.mockImplementationOnce(async () => {
      client.isOpen = true;
      throw new Error('Handshake failed');
    });
    client.destroy.mockImplementation(() => { client.isOpen = false; });

    await app.ready();
    expect(client.destroy).toHaveBeenCalledOnce();
    await app.close();
    expect(client.close).not.toHaveBeenCalled();
  });
});
