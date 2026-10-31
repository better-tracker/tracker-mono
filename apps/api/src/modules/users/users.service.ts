import { StatusCodes } from 'http-status-codes';
import {
  createUser as insertUser,
  deleteUser as removeUser,
  getUserById,
  getUserByAuth0Id,
  getOrCreateUser,
  getUsers as listUsers,
  updateUser as saveUser,
} from '@project-tracker/database';
import type { UserRepository } from '@project-tracker/database';
import type {
  UserCreate,
  UserListResponse,
  UserResponse,
  UserUpdate,
} from '@project-tracker/contracts';

import { toUserResponse } from './users.mapper.js';

export class UserServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

function mapDatabaseError(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    throw new UserServiceError(
      'Username, email, or Auth0 user is already in use',
      StatusCodes.CONFLICT,
    );
  }
  throw error;
}

export function createUsersService(repository: UserRepository) {
  async function getUsers(): Promise<UserListResponse> {
    return (await repository.getUsers()).map(toUserResponse);
  }

  async function ensureUser(
    auth0UserId: string,
    profile: UserCreate,
  ): Promise<UserResponse> {
    try {
      return toUserResponse(
        await repository.getOrCreateUser({
          auth0_user_id: auth0UserId,
          user_name: profile.user_name,
          email: profile.email,
          profile_pic: profile.profile_pic,
        }),
      );
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function getCurrentUser(auth0UserId: string): Promise<UserResponse> {
    const user = await repository.getUserByAuth0Id(auth0UserId);

    if (!user) {
      throw new UserServiceError('User not found', StatusCodes.NOT_FOUND);
    }

    return toUserResponse(user);
  }

  async function updateCurrentUser(
    auth0UserId: string,
    input: UserUpdate,
  ): Promise<UserResponse> {
    const user = await getCurrentUser(auth0UserId);

    return updateUser(user.id, input);
  }

  async function deleteCurrentUser(auth0UserId: string): Promise<void> {
    const user = await getCurrentUser(auth0UserId);

    await deleteUser(user.id);
  }

  async function getUser(id: string): Promise<UserResponse> {
    const user = await repository.getUserById(id);
    if (!user)
      throw new UserServiceError('User not found', StatusCodes.NOT_FOUND);
    return toUserResponse(user);
  }

  async function updateUser(
    id: string,
    input: UserUpdate,
  ): Promise<UserResponse> {
    try {
      const user = await repository.updateUser(id, input);
      if (!user)
        throw new UserServiceError('User not found', StatusCodes.NOT_FOUND);
      return toUserResponse(user);
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function deleteUser(id: string) {
    const deleted = await repository.deleteUser(id);
    if (!deleted)
      throw new UserServiceError('User not found', StatusCodes.NOT_FOUND);
  }

  return {
    getUsers,
    ensureUser,
    getUser,
    updateUser,
    deleteUser,
    getCurrentUser,
    updateCurrentUser,
    deleteCurrentUser,
  };
}

export type UsersService = ReturnType<typeof createUsersService>;

export const {
  getUsers,
  ensureUser,
  getUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
} = createUsersService({
  getUsers: listUsers,
  createUser: insertUser,
  getUserById,
  getUserByAuth0Id,
  getOrCreateUser,
  updateUser: saveUser,
  deleteUser: removeUser,
});
