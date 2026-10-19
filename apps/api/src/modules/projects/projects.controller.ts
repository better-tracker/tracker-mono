// Placeholder responses; project persistence is not implemented.

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ProjectCreate, ProjectUpdate } from '@project-tracker/contracts';

type ProjectParams = {
  id: string;
};

export const getProjects = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.code(200).send([]);
};

export const getProject = async (
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  return reply.code(200).send({
    id,
    name: 'Example project',
    description: 'Temporary response',
  });
};

export const createProject = async (
  request: FastifyRequest<{ Body: ProjectCreate }>,
  reply: FastifyReply,
) => {
  const { name, description } = request.body;

  return reply.code(201).send({
    id: 'temporary-id',
    name,
    description: description ?? null,
  });
};

export const updateProject = async (
  request: FastifyRequest<{
    Params: ProjectParams;
    Body: ProjectUpdate;
  }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const { name, description } = request.body;

  return reply.code(200).send({
    id,
    name,
    description: description ?? null,
  });
};

export const deleteProject = async (
  _request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) => {
  return reply.code(204).send();
};