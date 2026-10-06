// Handle project HTTP requests, pass validated input to the project service,
// and translate results into HTTP responses.

/* Set up where the routes get from. Bare bones atm
    Routes are now wired and work
*/
import type { FastifyReply, FastifyRequest } from 'fastify';

type ProjectParams = {
  id: string;
};

type CreateProjectBody = {
  name: string;
  description?: string;
};

type UpdateProjectBody = {
  name: string;
  description?: string;
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
  request: FastifyRequest<{ Body: CreateProjectBody }>,
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
    Body: UpdateProjectBody;
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