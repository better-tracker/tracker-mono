// Barebones set up again, same as projects
// these are temporary responses just for testing

import type { FastifyReply, FastifyRequest } from 'fastify';

type SubtaskParams = {
  projectId: string;
  id?: string;
};

type CreateSubtaskBody = {
  description: string;
  completed?: boolean;
};

type UpdateSubtaskBody = {
  description: string;
  completed: boolean;
};

export const getSubtasks = async (
  _request: FastifyRequest<{
    Params: SubtaskParams;
  }>,
  reply: FastifyReply,
) => {
  return reply.code(200).send([]);
};

export const createSubtask = async (
  request: FastifyRequest<{
    Params: SubtaskParams;
    Body: CreateSubtaskBody;
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
    Body: UpdateSubtaskBody;
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