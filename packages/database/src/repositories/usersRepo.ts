import { buildUpdateAssignments } from '../update-assignments.js';
import type { DatabaseConnection } from '../client.js';
import { pool } from '../client.js';

export interface User {
  id: string;
  auth0_user_id: string;
  user_name: string;
  email: string;
  profile_pic: string | null;
}

export interface CreateUser {
  auth0_user_id: string;
  user_name: string;
  email: string;
  profile_pic?: string | null;
}

export interface UpdateUser {
  user_name?: string;
  email?: string;
  profile_pic?: string | null;
}

export async function createUser(
  user: CreateUser,
  database: DatabaseConnection = pool,
): Promise<User> {
  const result = await database.query<User>(
    `
      INSERT INTO users (
        auth0_user_id,
        user_name,
        email,
        profile_pic
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        auth0_user_id,
        user_name,
        email,
        profile_pic
    `,
    [user.auth0_user_id, user.user_name, user.email, user.profile_pic ?? null],
  );

  return result.rows[0];
}

export async function getUserById(
  id: string,
  database: DatabaseConnection = pool,
): Promise<User | null> {
  const result = await database.query<User>(
    `
      SELECT
        id,
        auth0_user_id,
        user_name,
        email,
        profile_pic
      FROM users
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
}

export async function getUserByAuth0Id(
  id: string,
  database: DatabaseConnection = pool,
): Promise<User | null> {
  const result = await database.query<User>(
    `
      SELECT
        id,
        auth0_user_id,
        user_name,
        email,
        profile_pic
      FROM users
      WHERE auth0_user_id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
}

export async function getOrCreateUser(
  user: CreateUser,
  database: DatabaseConnection = pool,
): Promise<User> {
  const existing = await getUserByAuth0Id(user.auth0_user_id, database);
  if (existing) return existing;

  const result = await database.query<User>(
    `
      INSERT INTO users (
        auth0_user_id, user_name, email, profile_pic
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (auth0_user_id) DO UPDATE
      SET auth0_user_id = EXCLUDED.auth0_user_id
      RETURNING id, auth0_user_id, user_name, email, profile_pic
    `,
    [user.auth0_user_id, user.user_name, user.email, user.profile_pic ?? null],
  );

  return result.rows[0];
}

export async function getUsers(
  database: DatabaseConnection = pool,
): Promise<User[]> {
  const result = await database.query<User>(
    `
      SELECT
        id,
        auth0_user_id,
        user_name,
        email,
        profile_pic
      FROM users
      ORDER BY user_name
    `,
  );

  return result.rows;
}

export async function updateUser(
  id: string,
  updates: UpdateUser,
  database: DatabaseConnection = pool,
): Promise<User | null> {
  const { fields, values } = buildUpdateAssignments(updates, {
    user_name: 'user_name',
    email: 'email',
    profile_pic: 'profile_pic',
  });

  if (fields.length === 0) {
    return getUserById(id, database);
  }

  values.push(id);
  const query = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${fields.length + 1}
    RETURNING id, auth0_user_id, user_name, email, profile_pic
  `;
  const result = await database.query<User>(query, values);

  return result.rows[0] || null;
}

export async function deleteUser(
  id: string,
  database: DatabaseConnection = pool,
): Promise<boolean> {
  const result = await database.query(`DELETE FROM users WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export interface UserRepository {
  getUsers(): Promise<User[]>;
  createUser(user: CreateUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByAuth0Id(auth0UserId: string): Promise<User | null>;
  getOrCreateUser(user: CreateUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}

export function createUserRepository(
  database: DatabaseConnection,
): UserRepository {
  return {
    getUsers: () => getUsers(database),
    createUser: (user) => createUser(user, database),
    getUserById: (id) => getUserById(id, database),
    getUserByAuth0Id: (auth0UserId) => getUserByAuth0Id(auth0UserId, database),
    getOrCreateUser: (user) => getOrCreateUser(user, database),
    updateUser: (id, updates) => updateUser(id, updates, database),
    deleteUser: (id) => deleteUser(id, database),
  };
}
