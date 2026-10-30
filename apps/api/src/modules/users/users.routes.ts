import type { FastifyInstance } from 'fastify';
import {
  userParamsSchema,
  userCreateSchema,
  userUpdateSchema,
} from '@project-tracker/contracts';
import { validateBody, validateParams } from '../../lib/validation.js';
import { createUserController } from './users.controller.js';
import type { UsersService } from './users.service.js';

export const userRoutes = async (
  app: FastifyInstance,
  options: { service?: UsersService },
) => {
  const { getUsers, createUser, getUser, updateUser, deleteUser } =
    createUserController(options.service);

  const auth0Sub = request.user.sub;

  app.get('/v1/users', {
    preHandler: app.requireAuth(),
    handler: getUsers,
  });

  app.post('/v1/users', {
    preHandler: app.requireAuth(),
    preValidation: validateBody(userCreateSchema),
    handler: createUser,
  });

  app.get('/v1/users/:id', {
    preHandler: app.requireAuth(),
    preValidation: validateUserParams,
    handler: getUser,
  });

  app.put('/v1/users/:id', {
    preHandler: app.requireAuth(),
    preValidation: [validateUserParams, validateBody(userUpdateSchema)],
    handler: updateUser,
  });

  app.delete('/v1/users/:id', {
    preHandler: app.requireAuth(),
    preValidation: validateUserParams,
    handler: deleteUser,
  });
};

const validateUserParams = validateParams(userParamsSchema, 'Invalid user ID');
