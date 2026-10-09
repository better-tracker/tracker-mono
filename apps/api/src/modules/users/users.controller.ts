/* Users controller
    Set up where the routes get from
*/

import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  UserCreate,
  UserUpdate,
} from '@project-tracker/contracts';

type UserParams = {
  id: string;
};

export const getUsers = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.code(200).send([]);
};

export const createUser = async (
  request: FastifyRequest<{ Body: UserCreate }>,
  reply: FastifyReply,
) => {
  const { user_name, email, profile_pic } = request.body;

  return reply.code(201).send({
    id: crypto.randomUUID(),
    user_name,
    email,
    profile_pic: profile_pic ?? null,
  });
};

export const getUser = async (
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  return reply.code(200).send({
    id,
    user_name: 'Temporary user',
    email: 'temporary@example.com',
    profile_pic: null,
  });
};

export const updateUser = async (
  request: FastifyRequest<{
    Params: UserParams;
    Body: UserUpdate;
  }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const { user_name, email, profile_pic } = request.body;

  return reply.code(200).send({
    id,
    user_name,
    email,
    profile_pic: profile_pic ?? null,
  });
};

export const deleteUser = async (
  _request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply,
) => {
  return reply.code(204).send();
};