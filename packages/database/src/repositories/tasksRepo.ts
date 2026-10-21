import type { DatabaseConnection } from '../client.js';
import { pool } from '../client.js';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To do' | 'In progress' | 'Complete';
  due_date: string;
  due_time: string;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTask {
  project_id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority?: Task['priority'];
  status?: Task['status'];
  due_date?: string;
  due_time?: string;
  completed_at?: Date | null;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: Task['priority'];
  status?: Task['status'];
  due_date?: string;
  due_time?: string;
  completed_at?: Date | null;
}

export async function createTask(
  task: CreateTask,
  database: DatabaseConnection = pool
): Promise<Task> {
  const result = await database.query<Task>(
    `INSERT INTO tasks (
      project_id,
      title,
      description,
      assignee,
      priority,
      status,
      due_date,
      due_time,
      completed_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    )
    RETURNING *`,
    [
      task.project_id,
      task.title,
      task.description ?? '',
      task.assignee ?? '',
      task.priority ?? 'Medium',
      task.status ?? 'To do',
      task.due_date ?? '',
      task.due_time ?? '',
      task.completed_at ?? null,
    ]
  );

  return result.rows[0];
}

export async function getTaskById(
  id: string,
  database: DatabaseConnection = pool
): Promise<Task | null> {
  const result = await database.query<Task>(
    `SELECT * FROM tasks WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function listTasksByProject(
  projectId: string,
  database: DatabaseConnection = pool
): Promise<Task[]> {
  const result = await database.query<Task>(
    `SELECT *
     FROM tasks
     WHERE project_id = $1
     ORDER BY created_at DESC, id DESC`,
    [projectId]
  );

  return result.rows;
}

export async function updateTask(
  id: string,
  updates: UpdateTask,
  database: DatabaseConnection = pool
): Promise<Task | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) {
    fields.push(`title = $${values.length + 1}`);
    values.push(updates.title);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${values.length + 1}`);
    values.push(updates.description);
  }

  if (updates.assignee !== undefined) {
    fields.push(`assignee = $${values.length + 1}`);
    values.push(updates.assignee);
  }

  if (updates.priority !== undefined) {
    fields.push(`priority = $${values.length + 1}`);
    values.push(updates.priority);
  }

  if (updates.status !== undefined) {
    fields.push(`status = $${values.length + 1}`);
    values.push(updates.status);
  }

  if (updates.due_date !== undefined) {
    fields.push(`due_date = $${values.length + 1}`);
    values.push(updates.due_date);
  }

  if (updates.due_time !== undefined) {
    fields.push(`due_time = $${values.length + 1}`);
    values.push(updates.due_time);
  }

  if (updates.completed_at !== undefined) {
    fields.push(`completed_at = $${values.length + 1}`);
    values.push(updates.completed_at);
  }

  if (fields.length === 0) {
    return getTaskById(id, database);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await database.query<Task>(
    `UPDATE tasks
     SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteTask(
  id: string,
  database: DatabaseConnection = pool
): Promise<boolean> {
  const result = await database.query(
    `DELETE FROM tasks WHERE id = $1`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}