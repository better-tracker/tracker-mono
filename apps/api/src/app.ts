// Added subtask routes

import Fastify from 'fastify';
import { projectRoutes } from './modules/projects/projects.routes.js';
import { subtaskRoutes } from './modules/subtasks/subtasks.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import cors from '@fastify/cors';
import { env } from './config/env.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origin === env.corsOrigin) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode =
      error instanceof Error &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 600
        ? error.statusCode
        : 500;

    const message =
      statusCode >= 500
        ? 'An unexpected error occurred.'
        : error instanceof Error
          ? error.message
          : 'Invalid request';

    request.log.error(error);

    return reply.status(statusCode).send({
      error: {
        code: statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
        message,
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  app.register(projectRoutes);
  app.register(userRoutes);
  app.register(subtaskRoutes);

  return app;
}

/* Creat and configure fastify.
  Register routes before returning
*/