/* Users module
    Get all users, create a user, get a user by id, update a user by id, delete a user by id
    Each route connected to controller
*/

import type { FastifyInstance } from 'fastify';
import {
  userCreateSchema,
  userUpdateSchema,
} from '@project-tracker/contracts';
import {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from './users.controller.js';

export const userRoutes = async (app: FastifyInstance) => {
  app.get('/v1/users', getUsers);

  app.post('/v1/users', {
    preValidation: async (request) => {
      userCreateSchema.parse(request.body);
    },
    handler: createUser,
  });

  app.get('/v1/users/:id', getUser);

  app.put('/v1/users/:id', {
    preValidation: async (request) => {
      userUpdateSchema.parse(request.body);
    },
    handler: updateUser,
  });

  app.delete('/v1/users/:id', deleteUser);
};