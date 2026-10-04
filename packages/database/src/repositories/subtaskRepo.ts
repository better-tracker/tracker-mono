import { pool } from "../client.js";

export interface Subtask {
  id: string;
  project_id: string;
  completed: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
export interface CreateSubtask {
  project_id: string;
  description?: string | null;
  completed?: boolean;
}

export interface UpdateSubtask {
  name?: string;
  description?: string | null;
  completed?: boolean;
}

export async function createSubtask(subtask: CreateSubtask): Promise<Subtask> {
  const result = await pool.query<Subtask>(
    `INSERT INTO subtasks (project_id, completed, description)
     VALUES ($1, $2, $3)
     RETURNING id, project_id, completed, description, created_at, updated_at`,
    [subtask.project_id, subtask.completed ?? false, subtask.description ?? null]
  );
  return result.rows[0];
}

export async function getSubtaskById(id: string): Promise<Subtask | null> {
  const result = await pool.query<Subtask>(
    `SELECT id, project_id, completed, description, created_at, updated_at
     FROM subtasks WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

//export async function updateSubtask(id: string, updates: UpdateSubtask): Promise<Subtask | null> {
