import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  UserCreate,
  UserUpdate,
} from '@project-tracker/contracts';
import * as usersService from './users.service.js';

type UserParams = {
  id: string;
};

export const getUsers = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.code(200).send(await usersService.getUsers());
};

export const createUser = async (
  request: FastifyRequest<{ Body: UserCreate }>,
  reply: FastifyReply,
) => {
  return reply.code(201).send(await usersService.createUser(request.body));
};

export const getUser = async (
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  return reply.code(200).send(await usersService.getUser(id));
};

export const updateUser = async (
  request: FastifyRequest<{
    Params: UserParams;
    Body: UserUpdate;
  }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  return reply.code(200).send(await usersService.updateUser(id, request.body));
};

export const deleteUser = async (
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply,
) => {
  await usersService.deleteUser(request.params.id);
  return reply.code(204).send();
};
