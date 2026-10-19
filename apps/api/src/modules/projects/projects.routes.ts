import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  projectCreateSchema,
  projectParamsSchema,
  projectUpdateSchema,
} from '@project-tracker/contracts';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from './projects.controller.js';

import { parseRequest } from '../../lib/validation.js';

async function validateProjectParams(request: FastifyRequest) {
  request.params = parseRequest(projectParamsSchema, request.params, 'Invalid project ID');
}

export const projectRoutes = async (app: FastifyInstance) => {
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