import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  userParamsSchema,
  userCreateSchema,
  userUpdateSchema,
} from '@project-tracker/contracts';
import { parseRequest } from '../../lib/validation.js';
import { createUserController } from './users.controller.js';
import type { UsersService } from './users.service.js';

export const userRoutes = async (
  app: FastifyInstance,
  options: { service?: UsersService },
) => {
  const { getUsers, createUser, getUser, updateUser, deleteUser } = createUserController(options.service);
  app.get('/v1/users', getUsers);

  app.post('/v1/users', {
    preValidation: async (request) => {
      request.body = parseRequest(userCreateSchema, request.body);
    },
    handler: createUser,
  });

  app.get('/v1/users/:id', {
    preValidation: validateUserParams,
    handler: getUser,
  });

  app.put('/v1/users/:id', {
    preValidation: [validateUserParams, async (request) => {
      request.body = parseRequest(userUpdateSchema, request.body);
    }],
    handler: updateUser,
  });

  app.delete('/v1/users/:id', {
    preValidation: validateUserParams,
    handler: deleteUser,
  });
};

async function validateUserParams(request: FastifyRequest) {
  request.params = parseRequest(userParamsSchema, request.params, 'Invalid user ID');
}
