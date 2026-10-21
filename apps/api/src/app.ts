import Fastify from 'fastify';
import { projectRoutes } from './modules/projects/projects.routes.js';
import { subtaskRoutes } from './modules/subtasks/subtasks.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { createUserRepository } from '@project-tracker/database';
import type { DatabaseConnection } from '@project-tracker/database';
import { createUsersService } from './modules/users/users.service.js';
import { createProjectsService } from './modules/projects/projects.service.js';
import { createSubtasksService } from './modules/subtasks/subtasks.service.js';
import { taskRoutes } from './modules/tasks/tasks.routes.js';
import { createTasksService } from './modules/tasks/tasks.service.js';
import { taskSubtaskRoutes } from './modules/task-subtasks/task-subtasks.routes.js';
import { createTaskSubtasksService } from './modules/task-subtasks/task-subtasks.service.js';

/** An injected database is caller-owned and remains open when this app closes. */
export function buildApp(options: { database?: DatabaseConnection } = {}) {
  const app = Fastify({ logger: true });

  const projectsService = options.database
    ? createProjectsService(options.database)
    : undefined;

  const subtasksService = options.database
    ? createSubtasksService(options.database)
    : undefined;

  const tasksService = options.database
    ? createTasksService(options.database)
    : undefined;

  const taskSubtasksService = options.database
    ? createTaskSubtasksService(options.database)
    : undefined;

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origin === env.corsOrigin) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
        : error instanceof Error && 'code' in error && error.code === 'FST_ERR_CTP_INVALID_JSON_BODY'
          ? 'Invalid JSON body'
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

  app.register(projectRoutes, {
    service: projectsService,
    subtaskService: subtasksService,
  });

  app.register(userRoutes, {
    service: options.database
      ? createUsersService(createUserRepository(options.database))
      : undefined,
  });

  app.register(subtaskRoutes, {
    service: subtasksService,
  });

  app.register(taskRoutes, {
    service: tasksService,
  });

  app.register(taskSubtaskRoutes, {
    service: taskSubtasksService,
    parentTasksService: tasksService,
  });

  return app;
}
