import type { FastifyInstance } from 'fastify';
import {
  projectCreateSchema,
  projectParamsSchema,
  projectUpdateSchema,
} from '@project-tracker/contracts';
import { createProjectsController } from './projects.controller.js';
import type { ProjectsService } from './projects.service.js';
import type { SubtasksService } from '../subtasks/subtasks.service.js';

import { validateBody, validateParams } from '../../lib/validation.js';

const validateProjectParams = validateParams(
  projectParamsSchema,
  'Invalid project ID',
);

export const projectRoutes = async (
  app: FastifyInstance,
  options: {
    service?: ProjectsService;
    subtaskService?: SubtasksService;
  } = {},
) => {
  const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
  } = createProjectsController(
    options.service,
    options.subtaskService,
  );

  app.get('/v1/projects', getProjects);

  app.post('/v1/projects', {
    preValidation: validateBody(projectCreateSchema),
    handler: createProject,
  });

  app.get('/v1/projects/:id', {
    preValidation: validateProjectParams,
    handler: getProject,
  });

  app.put('/v1/projects/:id', {
    preValidation: [validateProjectParams, validateBody(projectUpdateSchema)],
    handler: updateProject,
  });

  app.delete('/v1/projects/:id', {
    preValidation: validateProjectParams,
    handler: deleteProject,
  });
};
