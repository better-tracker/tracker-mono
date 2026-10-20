import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import {
  createUser as insertUser,
  deleteUser as removeUser,
  getUserById,
  getUsers as listUsers,
  updateUser as saveUser,
} from '@project-tracker/database';
import type { UserCreate, UserUpdate } from '@project-tracker/contracts';

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

export async function getUsers() {
  return listUsers();
}

export async function createUser(input: UserCreate) {
  try {
    return await insertUser({
      user_name: input.user_name,
      email: input.email,
      profile_pic: input.profile_pic,
      passwordHash: await hashPassword(input.password),
    });
  } catch (error) {
    return mapDatabaseError(error);
  }
}

export async function getUser(id: string) {
  const user = await getUserById(id);
  if (!user) throw new UserServiceError('User not found', 404);
  return user;
}

export async function updateUser(id: string, input: UserUpdate) {
  try {
    const user = await saveUser(id, input);
    if (!user) throw new UserServiceError('User not found', 404);
    return user;
  } catch (error) {
    return mapDatabaseError(error);
  }
}

export async function deleteUser(id: string) {
  const deleted = await removeUser(id);
  if (!deleted) throw new UserServiceError('User not found', 404);
}
