// This file means env can be used without touching the database

const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

export const env = {
  port,
  databaseUrl,
  corsOrigin,
};
