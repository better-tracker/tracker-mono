import { buildUpdateAssignments } from '../update-assignments.js';
import type { DatabaseConnection } from '../client.js';
import { pool } from '../client.js';

export interface User {
  id: string;
  user_name: string;
  email: string;
  profile_pic: string | null;
}

export interface CreateUser {
  user_name: string;
  email: string;
  profile_pic?: string | null;
  passwordHash: string;
}

export interface UpdateUser {
  user_name?: string;
  email?: string;
  profile_pic?: string | null;
  passwordHash?: string;
}

export interface UserWithPassword extends User {
  password: string;
}

export async function createUser(
  user: CreateUser,
  database: DatabaseConnection = pool,
): Promise<User> {
  const result = await database.query<User>(
    `INSERT INTO users (user_name, email, profile_pic, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_name, email, profile_pic`,
    [user.user_name, user.email, user.profile_pic ?? null, user.passwordHash],
  );
  return result.rows[0];
}

export async function getUserById(
  id: string,
  database: DatabaseConnection = pool,
): Promise<User | null> {
  const result = await database.query<User>(
    `SELECT id, user_name, email, profile_pic FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function getUsers(
  database: DatabaseConnection = pool,
): Promise<User[]> {
  const result = await database.query<User>(
    `SELECT id, user_name, email, profile_pic FROM users ORDER BY user_name`,
  );
  return result.rows;
}

export async function getUserByEmailForAuth(
  email: string,
  database: DatabaseConnection = pool,
): Promise<(User & { passwordHash: string }) | null> {
  const result = await database.query<UserWithPassword>(
    `SELECT id, user_name, email, profile_pic, password FROM users WHERE email = $1`,
    [email],
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  const { password, ...user } = row;
  return { ...user, passwordHash: password };
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
    passwordHash: 'password',
  });

  if (fields.length === 0) {
    return getUserById(id, database);
  }

  values.push(id);
  const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${fields.length + 1}
        RETURNING id, user_name, email, profile_pic
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
    updateUser: (id, updates) => updateUser(id, updates, database),
    deleteUser: (id) => deleteUser(id, database),
  };
}
