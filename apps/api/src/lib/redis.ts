import { createClient } from 'redis';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import {
  REDIS_COMMAND_TIMEOUT_MS,
  REDIS_CONNECT_TIMEOUT_MS,
} from '../config/constants.js';

// Importing the shared client does not connect. The server owns its lifecycle.
export const redis = createClient({
  url: env.redisUrl,
  disableOfflineQueue: true,
  commandOptions: { timeout: REDIS_COMMAND_TIMEOUT_MS },
  socket: {
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    reconnectStrategy: false,
  },
});

export type AppRedisClient = typeof redis;

type RedisConnection = Pick<
  AppRedisClient,
  'connect' | 'close' | 'destroy' | 'isOpen' | 'on'
>;

export function registerRedisLifecycle(
  app: FastifyInstance,
  client: RedisConnection = redis,
) {
  client.on('error', (error: Error) => {
    app.log.warn({ err: error }, 'Redis client error');
  });

  app.addHook('onReady', async () => {
    try {
      await client.connect();
    } catch (error) {
      if (client.isOpen) client.destroy();
      app.log.warn({ err: error }, 'Redis unavailable; use database checks');
    }
  });

  app.addHook('onClose', async () => {
    if (client.isOpen) await client.close();
  });
}
