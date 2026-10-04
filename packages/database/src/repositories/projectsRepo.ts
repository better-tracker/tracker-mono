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

//export async function updateProject(id: string, updates: UpdateProject): Promise<Project | null> {

