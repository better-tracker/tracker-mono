import type { FastifyInstance } from 'fastify';
import { userUpdateSchema } from '@project-tracker/contracts';
import { validateBody } from '../../lib/validation.js';
import { createUserController } from './users.controller.js';
import type { UsersService } from './users.service.js';

export const userRoutes = async (
  app: FastifyInstance,
  options: { service?: UsersService },
) => {
  const { ensureUser, getCurrentUser, updateCurrentUser, deleteCurrentUser } =
    createUserController(options.service);

  app.post('/v1/users/me', {
    preHandler: app.requireAuth(),
    handler: ensureUser,
  });

  app.get('/v1/users/me', {
    preHandler: app.requireAuth(),
    handler: getCurrentUser,
  });

  app.patch('/v1/users/me', {
    preHandler: [
      app.requireAuth(),
      validateBody(
        userUpdateSchema
          .strict()
          .refine(
            (updates) =>
              Object.values(updates).some((value) => value !== undefined),
            { message: 'Provide at least one profile field to update' },
          ),
      ),
    ],
    handler: updateCurrentUser,
  });

  app.delete('/v1/users/me', {
    preHandler: app.requireAuth(),
    handler: deleteCurrentUser,
  });
};
