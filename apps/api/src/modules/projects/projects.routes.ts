import type { FastifyInstance } from 'fastify';
import {
  projectCreateSchema,
  projectUpdateSchema,
} from '@project-tracker/contracts';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from './projects.controller.js';

export const projectRoutes = async (app: FastifyInstance) => {
  app.get('/v1/projects', getProjects);

  app.post('/v1/projects', {
    preValidation: async (request) => {
      projectCreateSchema.parse(request.body);
    },
    handler: createProject,
  });

  app.get('/v1/projects/:id', getProject);

  app.put('/v1/projects/:id', {
    preValidation: async (request) => {
      projectUpdateSchema.parse(request.body);
    },
    handler: updateProject,
  });

  app.delete('/v1/projects/:id', deleteProject);
};