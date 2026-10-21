import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import {
  createUser as insertUser,
  deleteUser as removeUser,
  getUserById,
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

const scrypt = promisify(scryptCallback);

export class UserServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'UserServiceError';
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

function mapDatabaseError(error: unknown): never {
  if (
    typeof error === 'object' && error !== null && 'code' in error &&
    (error.code === '23505')
  ) {
    throw new UserServiceError('Username or email is already in use', 409);
  }
  throw error;
}

export function createUsersService(repository: UserRepository) {
  async function getUsers(): Promise<UserListResponse> {
    return (await repository.getUsers()).map(toUserResponse);
  }

  async function createUser(input: UserCreate): Promise<UserResponse> {
    try {
      return toUserResponse(await repository.createUser({
        user_name: input.user_name,
        email: input.email,
        profile_pic: input.profile_pic,
        passwordHash: await hashPassword(input.password),
      }));
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function getUser(id: string): Promise<UserResponse> {
    const user = await repository.getUserById(id);
    if (!user) throw new UserServiceError('User not found', 404);
    return toUserResponse(user);
  }

  async function updateUser(id: string, input: UserUpdate): Promise<UserResponse> {
    try {
      const user = await repository.updateUser(id, input);
      if (!user) throw new UserServiceError('User not found', 404);
      return toUserResponse(user);
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function deleteUser(id: string) {
    const deleted = await repository.deleteUser(id);
    if (!deleted) throw new UserServiceError('User not found', 404);
  }

  return { getUsers, createUser, getUser, updateUser, deleteUser };
}

export type UsersService = ReturnType<typeof createUsersService>;

export const { getUsers, createUser, getUser, updateUser, deleteUser } = createUsersService({
  getUsers: listUsers,
  createUser: insertUser,
  getUserById,
  updateUser: saveUser,
  deleteUser: removeUser,
});
