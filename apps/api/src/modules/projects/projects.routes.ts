import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  projectCreateSchema,
  projectParamsSchema,
  projectUpdateSchema,
} from '@project-tracker/contracts';
import { createProjectsController } from './projects.controller.js';
import type { ProjectsService } from './projects.service.js';
import type { SubtasksService } from '../subtasks/subtasks.service.js';

import { parseRequest } from '../../lib/validation.js';

async function validateProjectParams(request: FastifyRequest) {
  request.params = parseRequest(projectParamsSchema, request.params, 'Invalid project ID');
}

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
    preValidation: async (request) => {
      request.body = parseRequest(projectCreateSchema, request.body);
    },
    handler: createProject,
  });

  app.get('/v1/projects/:id', { preValidation: validateProjectParams, handler: getProject });

  app.put('/v1/projects/:id', {
    preValidation: [validateProjectParams, async (request) => {
      request.body = parseRequest(projectUpdateSchema, request.body);
    }],
    handler: updateProject,
  });

  app.delete('/v1/projects/:id', { preValidation: validateProjectParams, handler: deleteProject });
};