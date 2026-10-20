// Load API settings without importing the database package.

const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

const redisUrl = process.env.REDIS_URL || undefined;

if (redisUrl) {
  try {
    const url = new URL(redisUrl);
    if (!['redis:', 'rediss:'].includes(url.protocol) || !url.hostname) {
      throw new Error('Invalid Redis URL');
    }
  } catch {
    throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL');
  }
}

export const env = {
  port,
  databaseUrl,
  corsOrigin,
  redisUrl,
};
