import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  ProjectCreate,
  ProjectUpdate,
  ProjectParams,
} from '@project-tracker/contracts';
import type { Project } from '@project-tracker/database';
import {
  projectsService,
  type ProjectsService,
} from './projects.service.js';
import { subtasksService } from '../subtasks/subtasks.service.js';

function formatProject(project: Project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.created_at.toISOString(),
  };
}

export function createProjectsController(
  service: ProjectsService = projectsService,
  subtaskService = subtasksService,
) {
  return {
    getProjects: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const projects = await service.getProjects();
      return reply.code(200).send(projects.map(formatProject));
    },

    getProject: async (
      request: FastifyRequest<{ Params: ProjectParams }>,
      reply: FastifyReply,
    ) => {
      const project = await service.getProject(request.params.id);

      if (!project) {
        return reply.code(404).send({ message: 'Project not found' });
      }

      const subtasks = await subtaskService.getSubtasks(project.id);

      return reply.code(200).send({
        ...formatProject(project),
        subtasks: subtasks.map((subtask) => ({
          id: subtask.id,
          description: subtask.description,
          completed: subtask.completed,
          createdAt: subtask.created_at.toISOString(),
          updatedAt: subtask.updated_at.toISOString(),
        })),
      });
    },

    createProject: async (
      request: FastifyRequest<{ Body: ProjectCreate }>,
      reply: FastifyReply,
    ) => {
      const project = await service.createProject(request.body);

      return reply.code(201).send({
        ...formatProject(project),
        subtasks: [],
      });
    },

    updateProject: async (
      request: FastifyRequest<{
        Params: ProjectParams;
        Body: ProjectUpdate;
      }>,
      reply: FastifyReply,
    ) => {
      const project = await service.updateProject(
        request.params.id,
        request.body,
      );

      if (!project) {
        return reply.code(404).send({ message: 'Project not found' });
      }

      const subtasks = await subtaskService.getSubtasks(project.id);

      return reply.code(200).send({
        ...formatProject(project),
        subtasks: subtasks.map((subtask) => ({
          id: subtask.id,
          description: subtask.description,
          completed: subtask.completed,
          createdAt: subtask.created_at.toISOString(),
          updatedAt: subtask.updated_at.toISOString(),
        })),
      });
    },

    deleteProject: async (
      request: FastifyRequest<{ Params: ProjectParams }>,
      reply: FastifyReply,
    ) => {
      const deleted = await service.deleteProject(request.params.id);

      if (!deleted) {
        return reply.code(404).send({ message: 'Project not found' });
      }

      return reply.code(204).send();
    },
  };
}