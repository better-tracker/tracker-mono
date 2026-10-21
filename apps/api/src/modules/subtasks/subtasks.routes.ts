import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  subtaskCreateSchema,
  subtaskCollectionParamsSchema,
  subtaskParamsSchema,
  subtaskUpdateSchema,
} from '@project-tracker/contracts';
import { createSubtasksController } from './subtasks.controller.js';
import type { SubtasksService } from './subtasks.service.js';
import { parseRequest } from '../../lib/validation.js';

async function validateCollectionParams(request: FastifyRequest) {
  request.params = parseRequest(subtaskCollectionParamsSchema, request.params, 'Invalid project ID');
}

async function validateSubtaskParams(request: FastifyRequest) {
  request.params = parseRequest(subtaskParamsSchema, request.params, 'Invalid project or subtask ID');
}

export const subtaskRoutes = async (
  app: FastifyInstance,
  options: { service?: SubtasksService } = {},
) => {
  const {
    getSubtasks,
    createSubtask,
    getSubtask,
    updateSubtask,
    deleteSubtask,
  } = createSubtasksController(options.service);

  app.get('/v1/projects/:projectId/subtasks', { preValidation: validateCollectionParams, handler: getSubtasks });

  app.post('/v1/projects/:projectId/subtasks', {
    preValidation: [validateCollectionParams, async (request) => {
      request.body = parseRequest(subtaskCreateSchema, request.body);
    }],
    handler: createSubtask,
  });

  app.get('/v1/projects/:projectId/subtasks/:id', { preValidation: validateSubtaskParams, handler: getSubtask });

  app.put('/v1/projects/:projectId/subtasks/:id', {
    preValidation: [validateSubtaskParams, async (request) => {
      request.body = parseRequest(subtaskUpdateSchema, request.body);
    }],
    handler: updateSubtask,
  });

  app.delete(
    '/v1/projects/:projectId/subtasks/:id',
    { preValidation: validateSubtaskParams, handler: deleteSubtask },
  );
};