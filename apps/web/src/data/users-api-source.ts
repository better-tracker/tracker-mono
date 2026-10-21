import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from '@project-tracker/api-client';

import type {
  UserCreate,
  UserUpdate,
} from '@project-tracker/contracts';

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Retrieve all users
export async function loadApiUsers() {
  return getUsers(API_URL);
}

// Retrieve a single user
export async function loadApiUser(id: string) {
  return getUser(API_URL, id);
}

// Create a new user
export async function createApiUser(input: UserCreate) {
  return createUser(API_URL, input);
}

// Update an existing user
export async function updateApiUser(
  id: string,
  input: UserUpdate,
) {
  return updateUser(API_URL, id, input);
}

// Delete a user
export async function deleteApiUser(id: string) {
  return deleteUser(API_URL, id);
}
