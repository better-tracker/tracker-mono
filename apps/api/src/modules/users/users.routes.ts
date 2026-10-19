import type { FastifyInstance } from 'fastify';
import {
  userIdSchema,
  userCreateSchema,
  userUpdateSchema,
} from '@project-tracker/contracts';
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
      const result = userCreateSchema.safeParse(request.body);
      if (!result.success) {
        throw Object.assign(new Error(result.error.issues[0]?.message ?? 'Invalid request body'), { statusCode: 400 });
      }
      request.body = result.data;
    },
    handler: createUser,
  });

  app.get('/v1/users/:id', {
    preValidation: async (request) => {
      validateUserId(request.params);
    },
    handler: getUser,
  });

  app.put('/v1/users/:id', {
    preValidation: async (request) => {
      validateUserId(request.params);
      const result = userUpdateSchema.safeParse(request.body);
      if (!result.success) {
        throw Object.assign(new Error(result.error.issues[0]?.message ?? 'Invalid request body'), { statusCode: 400 });
      }
      request.body = result.data;
    },
    handler: updateUser,
  });

  app.delete('/v1/users/:id', {
    preValidation: async (request) => {
      validateUserId(request.params);
    },
    handler: deleteUser,
  });
};

function validateUserId(params: unknown) {
  const result = userIdSchema.safeParse(
    typeof params === 'object' && params !== null && 'id' in params
      ? params.id
      : undefined,
  );
  if (!result.success) {
    throw Object.assign(new Error('Invalid user ID'), { statusCode: 400 });
  }
}
