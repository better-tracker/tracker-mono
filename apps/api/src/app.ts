import Fastify from 'fastify';
import { StatusCodes } from 'http-status-codes';
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
import { getErrorResponse, getErrorStatusCode } from './lib/http-errors.js';
import fastifyAuth0Api from '@auth0/auth0-fastify-api';

/** An injected database is caller-owned and remains open when this app closes. */
export function buildApp(options: { database?: DatabaseConnection } = {}) {
  const app = Fastify({ logger: true });

  app.register(fastifyAuth0Api, {
    domain: env.auth0Domain,
    audience: env.auth0Audience,
  });

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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = getErrorStatusCode(error);

    request.log.error(error);

    return reply.status(statusCode).send(getErrorResponse(error, statusCode));
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.status(StatusCodes.NOT_FOUND).send({
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
