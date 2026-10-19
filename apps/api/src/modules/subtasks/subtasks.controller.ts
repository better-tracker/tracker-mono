// Placeholder responses; subtask persistence is not implemented.

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SubtaskCreateInput, SubtaskUpdate } from '@project-tracker/contracts';

type SubtaskCollectionParams = {
  projectId: string;
};

type SubtaskParams = SubtaskCollectionParams & {
  id: string;
};

export const getSubtasks = async (
  _request: FastifyRequest<{
    Params: SubtaskCollectionParams;
  }>,
  reply: FastifyReply,
) => {
  return reply.code(200).send([]);
};

export const createSubtask = async (
  request: FastifyRequest<{
    Params: SubtaskCollectionParams;
    Body: SubtaskCreateInput;
  }>,
  reply: FastifyReply,
) => {
  const { projectId } = request.params;
  const { description, completed } = request.body;

  return reply.code(201).send({
    id: 'temporary-id',
    projectId,
    description,
    completed: completed ?? false,
  });
};

export const getSubtask = async (
  request: FastifyRequest<{
    Params: SubtaskParams;
  }>,
  reply: FastifyReply,
) => {
  const { projectId, id } = request.params;

  return reply.code(200).send({
    id,
    projectId,
    description: 'Temporary subtask',
    completed: false,
  });
};

export const updateSubtask = async (
  request: FastifyRequest<{
    Params: SubtaskParams;
    Body: SubtaskUpdate;
  }>,
  reply: FastifyReply,
) => {
  const { projectId, id } = request.params;
  const { description, completed } = request.body;

  return reply.code(200).send({
    id,
    projectId,
    description,
    completed,
  });
};

export const deleteSubtask = async (
  _request: FastifyRequest<{
    Params: SubtaskParams;
  }>,
  reply: FastifyReply,
) => {
  return reply.code(204).send();
};