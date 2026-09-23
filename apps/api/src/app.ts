import Fastify from 'fastify';

export function buildApp() {
  return Fastify({ logger: true });
}
