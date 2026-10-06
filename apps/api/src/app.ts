// Added subtask routes

import Fastify from 'fastify';
import { projectRoutes } from './modules/projects/projects.routes.js';
import { subtaskRoutes } from './modules/subtasks/subtasks.routes.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(projectRoutes);
  app.register(subtaskRoutes);

  return app;
}

/* Creat and configure fastify.
  Register routes before returning
*/