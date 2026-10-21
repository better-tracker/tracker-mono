import type { FastifyInstance, FastifyRequest } from 'fastify';

import {
  taskSubtaskCollectionParamsSchema,
  taskSubtaskParamsSchema,
  taskSubtaskCreateSchema,
  taskSubtaskUpdateSchema,
} from '@project-tracker/contracts';

import { createTaskSubtasksController } from './task-subtasks.controller.js';
import type { TaskSubtasksService } from './task-subtasks.service.js';
import type { TasksService } from '../tasks/tasks.service.js';

import { parseRequest } from '../../lib/validation.js';

async function validateCollectionParams(request: FastifyRequest) {
  request.params = parseRequest(
    taskSubtaskCollectionParamsSchema,
    request.params,
    'Invalid project or task ID',
  );
}

async function validateSubtaskParams(request: FastifyRequest) {
  request.params = parseRequest(
    taskSubtaskParamsSchema,
    request.params,
    'Invalid project, task, or subtask ID',
  );
}

export const taskSubtaskRoutes = async (
  app: FastifyInstance,
  options: {
    service?: TaskSubtasksService;
    parentTasksService?: TasksService;
  } = {},
) => {
  const {
    getSubtasks,
    getSubtask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
  } = createTaskSubtasksController(
    options.service,
    options.parentTasksService,
  );

  app.get(
    '/v1/projects/:projectId/tasks/:taskId/subtasks',
    {
      preValidation: validateCollectionParams,
      handler: getSubtasks,
    },
  );

  app.post(
    '/v1/projects/:projectId/tasks/:taskId/subtasks',
    {
      preValidation: [
        validateCollectionParams,
        async (request) => {
          request.body = parseRequest(
            taskSubtaskCreateSchema,
            request.body,
          );
        },
      ],
      handler: createSubtask,
    },
  );

  app.get(
    '/v1/projects/:projectId/tasks/:taskId/subtasks/:id',
    {
      preValidation: validateSubtaskParams,
      handler: getSubtask,
    },
  );

  app.put(
    '/v1/projects/:projectId/tasks/:taskId/subtasks/:id',
    {
      preValidation: [
        validateSubtaskParams,
        async (request) => {
          request.body = parseRequest(
            taskSubtaskUpdateSchema,
            request.body,
          );
        },
      ],
      handler: updateSubtask,
    },
  );

  app.delete(
    '/v1/projects/:projectId/tasks/:taskId/subtasks/:id',
    {
      preValidation: validateSubtaskParams,
      handler: deleteSubtask,
    },
  );
};