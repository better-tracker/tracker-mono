import type { FastifyReply, FastifyRequest } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import type {
  SubtaskCreate,
  SubtaskUpdate,
  SubtaskParams,
  SubtaskCollectionParams,
} from '@project-tracker/contracts';
import type { Subtask } from '@project-tracker/database';
import {
  subtasksService,
  type SubtasksService,
} from './subtasks.service.js';

function formatSubtask(subtask: Subtask) {
  if (!subtask.description) {
    throw new Error('Subtask description is missing');
  }

  return {
    id: subtask.id,
    description: subtask.description,
    completed: subtask.completed,
    createdAt: subtask.created_at.toISOString(),
    updatedAt: subtask.updated_at.toISOString(),
  };
}

export function createSubtasksController(
  service: SubtasksService = subtasksService,
) {
  return {
    getSubtasks: async (
      request: FastifyRequest<{ Params: SubtaskCollectionParams }>,
      reply: FastifyReply,
    ) => {
      const subtasks = await service.getSubtasks(request.params.projectId);
      return reply.code(StatusCodes.OK).send(subtasks.map(formatSubtask));
    },

    createSubtask: async (
      request: FastifyRequest<{
        Params: SubtaskCollectionParams;
        Body: SubtaskCreate;
      }>,
      reply: FastifyReply,
    ) => {
      const subtask = await service.createSubtask(
        request.params.projectId,
        request.body,
      );

      return reply.code(StatusCodes.CREATED).send(formatSubtask(subtask));
    },

    getSubtask: async (
      request: FastifyRequest<{ Params: SubtaskParams }>,
      reply: FastifyReply,
    ) => {
      const subtask = await service.getSubtask(
        request.params.projectId,
        request.params.id,
      );

      if (!subtask) {
        return reply.code(StatusCodes.NOT_FOUND).send({ message: 'Subtask not found' });
      }

      return reply.code(StatusCodes.OK).send(formatSubtask(subtask));
    },

    updateSubtask: async (
      request: FastifyRequest<{
        Params: SubtaskParams;
        Body: SubtaskUpdate;
      }>,
      reply: FastifyReply,
    ) => {
      const subtask = await service.updateSubtask(
        request.params.projectId,
        request.params.id,
        request.body,
      );

      if (!subtask) {
        return reply.code(StatusCodes.NOT_FOUND).send({ message: 'Subtask not found' });
      }

      return reply.code(StatusCodes.OK).send(formatSubtask(subtask));
    },

    deleteSubtask: async (
      request: FastifyRequest<{ Params: SubtaskParams }>,
      reply: FastifyReply,
    ) => {
      const deleted = await service.deleteSubtask(
        request.params.projectId,
        request.params.id,
      );

      if (!deleted) {
        return reply.code(StatusCodes.NOT_FOUND).send({ message: 'Subtask not found' });
      }

      return reply.code(StatusCodes.NO_CONTENT).send();
    },
  };
}