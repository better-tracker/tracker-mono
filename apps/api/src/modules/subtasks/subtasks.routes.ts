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

export const subtaskRoutes = async (app: FastifyInstance) => {
  app.get('/v1/projects/:projectId/subtasks', getSubtasks);

  app.post('/v1/projects/:projectId/subtasks', {
    preValidation: async (request) => {
      subtaskCreateSchema.parse(request.body);
    },
    handler: createSubtask,
  });

  app.get('/v1/projects/:projectId/subtasks/:id', getSubtask);

  app.put('/v1/projects/:projectId/subtasks/:id', {
    preValidation: async (request) => {
      subtaskUpdateSchema.parse(request.body);
    },
    handler: updateSubtask,
  });

  app.delete(
    '/v1/projects/:projectId/subtasks/:id',
    deleteSubtask,
  );
};