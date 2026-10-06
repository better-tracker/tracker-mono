// Set up the exact same as regular tasks with the 'same' desired endpoints


import type { FastifyInstance } from 'fastify';
import {
  getSubtasks,
  createSubtask,
  getSubtask,
  updateSubtask,
  deleteSubtask,
} from './subtasks.controller.js';

export const subtaskRoutes = async (app: FastifyInstance) => {
  app.get('/v1/projects/:projectId/subtasks', getSubtasks);

  app.post('/v1/projects/:projectId/subtasks', createSubtask);

  app.get('/v1/projects/:projectId/subtasks/:id', getSubtask);

  app.put('/v1/projects/:projectId/subtasks/:id', updateSubtask);

  app.delete('/v1/projects/:projectId/subtasks/:id', deleteSubtask);
};