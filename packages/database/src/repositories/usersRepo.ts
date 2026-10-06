import { pool } from "../client.js"

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

export async function createUser(user: CreateUser): Promise<User> {
    const result = await pool.query<User>(
        `INSERT INTO users (user_name, email, profile_pic, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_name, email, profile_pic`,
        [user.user_name, user.email, user.profile_pic ?? null, user.passwordHash]
    );
    return result.rows[0];  
}

export async function getUserById(id: string): Promise<User | null> {
    const result = await pool.query<User>(
        `SELECT id, user_name, email, profile_pic FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

export async function getUserByEmailForAuth(email: string): Promise<(User & { passwordHash: string }) | null> {
    const result = await pool.query<UserWithPassword>(
        `SELECT id, user_name, email, profile_pic, password FROM users WHERE email = $1`,
        [email]
    );
    const row = result.rows[0];

    if (!row) {
        return null;
    }

    const { password, ...user } = row;
    return { ...user, passwordHash: password };
}


export async function updateUser(id: string, updates: UpdateUser): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.user_name !== undefined) {
        fields.push(`user_name = $${fields.length + 1}`);
        values.push(updates.user_name);
    }
    if (updates.email !== undefined) {
        fields.push(`email = $${fields.length + 1}`);
        values.push(updates.email);
    }
    if (updates.profile_pic !== undefined) {
        fields.push(`profile_pic = $${fields.length + 1}`);
        values.push(updates.profile_pic);
    }
    if (updates.passwordHash !== undefined) {
        fields.push(`password = $${fields.length + 1}`);
        values.push(updates.passwordHash);
    }

    if (fields.length === 0) {
        return getUserById(id);
    }

    values.push(id);
    const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${fields.length + 1}
        RETURNING id, user_name, email, profile_pic
    `;
    const result = await pool.query<User>(query, values);

    return result.rows[0] || null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
