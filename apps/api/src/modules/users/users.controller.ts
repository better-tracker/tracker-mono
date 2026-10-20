import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  UserCreate,
  UserUpdate,
  UserParams,
} from '@project-tracker/contracts';
import * as usersService from './users.service.js';
import type { UsersService } from './users.service.js';

export function createUserController(service: UsersService = usersService) {
  const getUsers = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    return reply.code(200).send(await service.getUsers());
  };

  const createUser = async (
    request: FastifyRequest<{ Body: UserCreate }>,
    reply: FastifyReply,
  ) => {
    return reply.code(201).send(await service.createUser(request.body));
  };

  const getUser = async (
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;

    return reply.code(200).send(await service.getUser(id));
  };

  const updateUser = async (
    request: FastifyRequest<{
      Params: UserParams;
      Body: UserUpdate;
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    return reply.code(200).send(await service.updateUser(id, request.body));
  };

  const deleteUser = async (
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply,
  ) => {
    await service.deleteUser(request.params.id);
    return reply.code(204).send();
  };

  return { getUsers, createUser, getUser, updateUser, deleteUser };
}

export const { getUsers, createUser, getUser, updateUser, deleteUser } = createUserController();
