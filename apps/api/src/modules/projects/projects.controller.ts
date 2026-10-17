// Handle project HTTP requests, pass validated input to the project service,
// and translate results into HTTP responses.

/*
    Routes are now wired and work
*/
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  ProjectCreate,
  ProjectUpdate,
} from '@project-tracker/contracts';

import {
  getAllProjects,
  getProject as getProjectService,
  createProject as createProjectService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
} from './projects.service.js';

import type { PaginationQuery } from '../../shared/request-schemas.js';
import { toProjectListItem, toProjectResponse } from '../../shared/responses.js';

type ProjectParams = {
  id: string;
};

export const getProjects = async (
  request: FastifyRequest<{ Querystring: PaginationQuery }>,
  reply: FastifyReply,
) => {
  const projects = await getAllProjects(request.query.limit, request.query.offset);

  return reply.code(200).send(projects.map(toProjectListItem));
};

export const getProject = async (
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  const project = await getProjectService(id);

  if (!project) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found',
      },
    });
  }

  return reply.code(200).send(toProjectResponse(project, project.subtasks));
};

export const createProject = async (
  request: FastifyRequest<{ Body: ProjectCreate }>,
  reply: FastifyReply,
) => {
  const project = await createProjectService(request.body);

  return reply.code(201).send(toProjectResponse(project));
};

export const updateProject = async (
  request: FastifyRequest<{
    Params: ProjectParams;
    Body: ProjectUpdate;
  }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  const project = await updateProjectService(id, request.body);

  if (!project) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found',
      },
    });
  }

  return reply.code(200).send(toProjectResponse(project, project.subtasks));
};

export const deleteProject = async (
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) => {
  const deleted = await deleteProjectService(request.params.id);

  if (!deleted) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found',
      },
    });
  }

  return reply.code(204).send();
};
