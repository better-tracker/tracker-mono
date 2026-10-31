import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserUpdate } from '@project-tracker/contracts';
import { StatusCodes } from 'http-status-codes';
import { getAuth0Profile } from '../../lib/auth0-profile.js';
import * as usersService from './users.service.js';
import type { UsersService } from './users.service.js';

export function createUserController(service: UsersService = usersService) {
  const ensureUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const auth0UserId = request.user.sub;

    const profile = await getAuth0Profile(
      request.headers.authorization,
      auth0UserId,
    );

    const user = await service.ensureUser(auth0UserId, profile);

    return reply.code(StatusCodes.OK).send(user);
  };

  const getCurrentUser = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const user = await service.getCurrentUser(request.user.sub);

    return reply.code(StatusCodes.OK).send(user);
  };

  const updateCurrentUser = async (
    request: FastifyRequest<{ Body: UserUpdate }>,
    reply: FastifyReply,
  ) => {
    const user = await service.updateCurrentUser(
      request.user.sub,
      request.body,
    );

    return reply.code(StatusCodes.OK).send(user);
  };

  const deleteCurrentUser = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    await service.deleteCurrentUser(request.user.sub);

    return reply.code(StatusCodes.NO_CONTENT).send();
  };

  return {
    ensureUser,
    getCurrentUser,
    updateCurrentUser,
    deleteCurrentUser,
  };
}

export const {
  ensureUser,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
} = createUserController();
