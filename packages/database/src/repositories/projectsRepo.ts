import { buildUpdateAssignments } from '../update-assignments.js';
import type { DatabaseConnection } from '../client.js';
import { pool } from '../client.js';
import { DEFAULT_PAGE_SIZE } from '../constants.js';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
}

export interface CreateProject {
  name: string;
  description?: string | null;
}

export interface UpdateProject {
  name?: string;
  description?: string | null;
}

export async function createProject(
  project: CreateProject,
  database: DatabaseConnection = pool,
): Promise<Project> {
  const result = await database.query<Project>(
    `INSERT INTO projects (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description, created_at`,
    [project.name, project.description ?? null],
  );
  return result.rows[0];
}

export async function getProjectById(
  id: string,
  database: DatabaseConnection = pool,
): Promise<Project | null> {
  const result = await database.query<Project>(
    `SELECT id, name, description, created_at FROM projects WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function listProjects(
  limit = DEFAULT_PAGE_SIZE,
  offset = 0,
  database: DatabaseConnection = pool,
): Promise<Project[]> {
  const result = await database.query<Project>(
    `SELECT id, name, description, created_at FROM projects ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}

export async function updateProject(
  id: string,
  updates: UpdateProject,
  database: DatabaseConnection = pool,
): Promise<Project | null> {
  const { fields, values } = buildUpdateAssignments(updates, {
    name: 'name',
    description: 'description',
  });

  if (fields.length === 0) {
    return getProjectById(id, database);
  }

  values.push(id);
  const result = await database.query<Project>(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING id, name, description, created_at`,
    values,
  );

  return result.rows[0] || null;
}

export async function deleteProject(
  id: string,
  database: DatabaseConnection = pool,
): Promise<boolean> {
  const result = await database.query(`DELETE FROM projects WHERE id = $1`, [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}
