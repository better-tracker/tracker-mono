import { pool } from "../client.js";

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

export async function createProject(project: CreateProject): Promise<Project> {
  const result = await pool.query<Project>(
    `INSERT INTO projects (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description, created_at`,
    [project.name, project.description ?? null]
  );
  return result.rows[0];
}

export async function getProjectById(id: string): Promise<Project | null> {
  const result = await pool.query<Project>(
    `SELECT id, name, description, created_at FROM projects WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function listProjects(limit = 40, offset = 0): Promise<Project[]> {
  const result = await pool.query<Project>(
    `SELECT id, name, description, created_at FROM projects ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function updateProject(id: string, updates: UpdateProject): Promise<Project | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
        fields.push(`name = $${fields.length + 1}`);
        values.push(updates.name);
    }
    if (updates.description !== undefined) {
        fields.push(`description = $${fields.length + 1}`);
        values.push(updates.description);
    }

    if (fields.length === 0) {
        return getProjectById(id);
    }

    values.push(id);
    const result = await pool.query<Project>(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING id, name, description, created_at`, values);
    
    return result.rows[0] || null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

    
