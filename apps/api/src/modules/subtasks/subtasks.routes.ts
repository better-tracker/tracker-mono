// Set up the exact same as regular tasks with the 'same' desired endpoints


import type { FastifyInstance } from 'fastify';
import {
  subtaskCreateSchema,
  subtaskUpdateSchema,
} from '@project-tracker/contracts';
import {
  getSubtasks,
  createSubtask,
  getSubtask,
  updateSubtask,
  deleteSubtask,
} from './subtasks.controller.js';

import { paginationQuerySchema, uuidParamsSchema } from '../../shared/request-schemas.js';

const collectionParams = uuidParamsSchema('projectId');
const itemParams = uuidParamsSchema('projectId', 'id');

export const subtaskRoutes = async (app: FastifyInstance) => {
  app.get('/v1/projects/:projectId/subtasks', {
    schema: { params: collectionParams, querystring: paginationQuerySchema },
  }, getSubtasks);

  app.post('/v1/projects/:projectId/subtasks', {
    schema: { params: collectionParams },
    preValidation: async (request) => {
      subtaskCreateSchema.parse(request.body);
    },
    handler: createSubtask,
  });

  app.get('/v1/projects/:projectId/subtasks/:id', { schema: { params: itemParams } }, getSubtask);

  app.put('/v1/projects/:projectId/subtasks/:id', {
    schema: { params: itemParams },
    preValidation: async (request) => {
      subtaskUpdateSchema.parse(request.body);
    },
    handler: updateSubtask,
  });

  app.delete(
    '/v1/projects/:projectId/subtasks/:id',
    { schema: { params: itemParams } },
    deleteSubtask,
  );
};