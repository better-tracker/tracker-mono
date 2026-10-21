import type { FastifyInstance } from 'fastify';
import type { createPool } from '@project-tracker/database';

/** Register only for a pool this application owns; injected pools remain caller-owned. */
export function registerDatabaseLifecycle(app: FastifyInstance, database: Pick<ReturnType<typeof createPool>, 'end'>) {
  app.addHook('onClose', async () => {
    await database.end();
  });
}
