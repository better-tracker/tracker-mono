import { pool } from "../client.js";
import { CreateProject, Project } from "../index.js";

export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
export interface CreateSubtask {
  name: string;
  description?: string | null;
}

export interface UpdateSubtask {
  name?: string;
  description?: string | null;
  completed?: boolean;
}

export async function createSubtask(subtask: CreateSubtask): Promise<Subtask> {
  const result = await pool.query<Subtask>(
    `INSERT INTO subtasks (name, description)
     VALUES ($1, $2)
     RETURNING id, name, completed, description, created_at, updated_at`,
    [subtask.name, subtask.description ?? null]
  );
  return result.rows[0];
}

export async function getSubtaskById(id: string): Promise<Subtask | null> {
  const result = await pool.query<Subtask>(
    `SELECT id, name, completed, description, created_at, updated_at FROM subtasks WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

//export async function updateSubtask(id: string, updates: UpdateSubtask): Promise<Subtask | null> {