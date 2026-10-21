import type { FastifyInstance, FastifyRequest } from 'fastify';

import {
  taskCollectionParamsSchema,
  taskParamsSchema,
  taskCreateSchema,
  taskUpdateSchema,
} from '@project-tracker/contracts';

import { createTasksController } from './tasks.controller.js';
import type { TasksService } from './tasks.service.js';
import { parseRequest } from '../../lib/validation.js';

// Validate the project ID in the URL.
async function validateCollectionParams(request: FastifyRequest) {
  request.params = parseRequest(
    taskCollectionParamsSchema,
    request.params,
    'Invalid project ID',
  );
}

// Validate both project ID and task ID.
async function validateTaskParams(request: FastifyRequest) {
  request.params = parseRequest(
    taskParamsSchema,
    request.params,
    'Invalid project or task ID',
  );
}

export const taskRoutes = async (
  app: FastifyInstance,
  options: {
    service?: TasksService;
  } = {},
) => {
  const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
  } = createTasksController(options.service);

  // Retrieve all tasks belonging to a project.
  app.get('/v1/projects/:projectId/tasks', {
    preValidation: validateCollectionParams,
    handler: getTasks,
  });

  // Retrieve one task.
  app.get('/v1/projects/:projectId/tasks/:id', {
    preValidation: validateTaskParams,
    handler: getTask,
  });

  // Create a task.
  app.post('/v1/projects/:projectId/tasks', {
    preValidation: [
      validateCollectionParams,
      async (request) => {
        request.body = parseRequest(
          taskCreateSchema,
          request.body,
        );
      },
    ],
    handler: createTask,
  });

  // Update a task.
  app.put('/v1/projects/:projectId/tasks/:id', {
    preValidation: [
      validateTaskParams,
      async (request) => {
        request.body = parseRequest(
          taskUpdateSchema,
          request.body,
        );
      },
    ],
    handler: updateTask,
  });

  // Delete a task.
  app.delete('/v1/projects/:projectId/tasks/:id', {
    preValidation: validateTaskParams,
    handler: deleteTask,
  });
};