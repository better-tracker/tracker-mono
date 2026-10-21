import type { DatabaseConnection } from '../client.js';
import { pool } from '../client.js';

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  notes: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  due_date: string;
  due_time: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskSubtask {
  task_id: string;
  title: string;
  notes?: string;
  assignee?: string;
  priority?: TaskSubtask['priority'];
  completed?: boolean;
  due_date?: string;
  due_time?: string;
}

export interface UpdateTaskSubtask {
  title?: string;
  notes?: string;
  assignee?: string;
  priority?: TaskSubtask['priority'];
  completed?: boolean;
  due_date?: string;
  due_time?: string;
}

export async function createTaskSubtask(
  subtask: CreateTaskSubtask,
  database: DatabaseConnection = pool
): Promise<TaskSubtask> {
  const result = await database.query<TaskSubtask>(
    `INSERT INTO task_subtasks (
      task_id,
      title,
      notes,
      assignee,
      priority,
      completed,
      due_date,
      due_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      subtask.task_id,
      subtask.title,
      subtask.notes ?? '',
      subtask.assignee ?? '',
      subtask.priority ?? 'Medium',
      subtask.completed ?? false,
      subtask.due_date ?? '',
      subtask.due_time ?? '',
    ]
  );

  return result.rows[0];
}

export async function getTaskSubtaskById(
  id: string,
  database: DatabaseConnection = pool
): Promise<TaskSubtask | null> {
  const result = await database.query<TaskSubtask>(
    `SELECT *
     FROM task_subtasks
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function listTaskSubtasksByTask(
  taskId: string,
  database: DatabaseConnection = pool
): Promise<TaskSubtask[]> {
  const result = await database.query<TaskSubtask>(
    `SELECT *
     FROM task_subtasks
     WHERE task_id = $1
     ORDER BY created_at DESC, id DESC`,
    [taskId]
  );

  return result.rows;
}

export async function updateTaskSubtask(
  id: string,
  updates: UpdateTaskSubtask,
  database: DatabaseConnection = pool
): Promise<TaskSubtask | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) {
    fields.push(`title = $${values.length + 1}`);
    values.push(updates.title);
  }

  if (updates.notes !== undefined) {
    fields.push(`notes = $${values.length + 1}`);
    values.push(updates.notes);
  }

  if (updates.assignee !== undefined) {
    fields.push(`assignee = $${values.length + 1}`);
    values.push(updates.assignee);
  }

  if (updates.priority !== undefined) {
    fields.push(`priority = $${values.length + 1}`);
    values.push(updates.priority);
  }

  if (updates.completed !== undefined) {
    fields.push(`completed = $${values.length + 1}`);
    values.push(updates.completed);
  }

  if (updates.due_date !== undefined) {
    fields.push(`due_date = $${values.length + 1}`);
    values.push(updates.due_date);
  }

  if (updates.due_time !== undefined) {
    fields.push(`due_time = $${values.length + 1}`);
    values.push(updates.due_time);
  }

  if (fields.length === 0) {
    return getTaskSubtaskById(id, database);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await database.query<TaskSubtask>(
    `UPDATE task_subtasks
     SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteTaskSubtask(
  id: string,
  database: DatabaseConnection = pool
): Promise<boolean> {
  const result = await database.query(
    `DELETE FROM task_subtasks WHERE id = $1`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}