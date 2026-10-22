import type { FastifyInstance } from 'fastify';
import {
  subtaskCreateSchema,
  subtaskCollectionParamsSchema,
  subtaskParamsSchema,
  subtaskUpdateSchema,
} from '@project-tracker/contracts';
import { createSubtasksController } from './subtasks.controller.js';
import type { SubtasksService } from './subtasks.service.js';
import { validateBody, validateParams } from '../../lib/validation.js';

const validateCollectionParams = validateParams(
  subtaskCollectionParamsSchema,
  'Invalid project ID',
);

const validateSubtaskParams = validateParams(
  subtaskParamsSchema,
  'Invalid project or subtask ID',
);

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

  app.get('/v1/projects/:projectId/subtasks', {
    preValidation: validateCollectionParams,
    handler: getSubtasks,
  });

  app.post('/v1/projects/:projectId/subtasks', {
    preValidation: [
      validateCollectionParams,
      validateBody(subtaskCreateSchema),
    ],
    handler: createSubtask,
  });

  app.get('/v1/projects/:projectId/subtasks/:id', {
    preValidation: validateSubtaskParams,
    handler: getSubtask,
  });

  app.put('/v1/projects/:projectId/subtasks/:id', {
    preValidation: [validateSubtaskParams, validateBody(subtaskUpdateSchema)],
    handler: updateSubtask,
  });

  app.delete('/v1/projects/:projectId/subtasks/:id', {
    preValidation: validateSubtaskParams,
    handler: deleteSubtask,
  });
};
