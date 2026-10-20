import { createPool } from '@project-tracker/database';
import { registerDatabaseLifecycle } from './lib/database.js';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { registerRedisLifecycle } from './lib/redis.js';

const database = createPool(env.databaseUrl);
const app = buildApp({ database });
registerDatabaseLifecycle(app, database);
if (env.redisUrl) registerRedisLifecycle(app);
let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  app.log.info({ signal }, 'Shutting down');

  try {
    await app.close();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

try {
  await app.listen({
    port: env.port,
    host: '0.0.0.0',
  });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
