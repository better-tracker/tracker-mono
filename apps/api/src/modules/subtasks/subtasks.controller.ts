// Same as project, hooks up the endpoints to the service layer, but for subtasks. 
// The service layer is where the business logic lives
// and the controller layer is where the HTTP request/response handling lives.

import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  SubtaskCreate,
  SubtaskUpdate,
} from '@project-tracker/contracts';

import {
  getSubtasksForProject,
  getSubtask as getSubtaskService,
  createSubtask as createSubtaskService,
  updateSubtask as updateSubtaskService,
  deleteSubtask as deleteSubtaskService,
} from './subtasks.service.js';

type SubtaskParams = {
  projectId: string;
  id: string;
};

const toResponse = (subtask: {
  id: string;
  completed: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}) => ({
  id: subtask.id,
  completed: subtask.completed,
  description: subtask.description,
  createdAt: subtask.created_at.toISOString(),
  updatedAt: subtask.updated_at.toISOString(),
});

export const getSubtasks = async (
  request: FastifyRequest<{
    Params: Pick<SubtaskParams, 'projectId'>;
  }>,
  reply: FastifyReply,
) => {
  const subtasks = await getSubtasksForProject(
    request.params.projectId,
  );

  return reply.code(200).send(subtasks.map(toResponse));
};

export const createSubtask = async (
  request: FastifyRequest<{
    Params: Pick<SubtaskParams, 'projectId'>;
    Body: SubtaskCreate;
  }>,
  reply: FastifyReply,
) => {
  const subtask = await createSubtaskService(
    request.params.projectId,
    request.body,
  );

  return reply.code(201).send(toResponse(subtask));
};

export const getSubtask = async (
  request: FastifyRequest<{
    Params: SubtaskParams;
  }>,
  reply: FastifyReply,
) => {
  const subtask = await getSubtaskService(request.params.id);

  if (!subtask || subtask.project_id !== request.params.projectId) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Subtask not found',
      },
    });
  }

  return reply.code(200).send(toResponse(subtask));
};

export const updateSubtask = async (
  request: FastifyRequest<{
    Params: SubtaskParams;
    Body: SubtaskUpdate;
  }>,
  reply: FastifyReply,
) => {
  const existing = await getSubtaskService(request.params.id);

  if (
    !existing ||
    existing.project_id !== request.params.projectId
  ) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Subtask not found',
      },
    });
  }

  const subtask = await updateSubtaskService(
    request.params.id,
    request.body,
  );

  if (!subtask) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Subtask not found',
      },
    });
  }

  return reply.code(200).send(toResponse(subtask));
};

export const deleteSubtask = async (
  request: FastifyRequest<{
    Params: SubtaskParams;
  }>,
  reply: FastifyReply,
) => {
  const existing = await getSubtaskService(request.params.id);

  if (
    !existing ||
    existing.project_id !== request.params.projectId
  ) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Subtask not found',
      },
    });
  }

  const deleted = await deleteSubtaskService(request.params.id);

  if (!deleted) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Subtask not found',
      },
    });
  }

  return reply.code(204).send();
};