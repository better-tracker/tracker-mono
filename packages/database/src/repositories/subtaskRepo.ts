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

export async function listSubtasksByProject(
  projectId: string,
  limit = 40,
  offset = 0
): Promise<Subtask[]> {
  const result = await pool.query<Subtask>(
    `SELECT id, project_id, completed, description, created_at, updated_at
     FROM subtasks
     WHERE project_id = $1
     ORDER BY created_at, id
     LIMIT $2 OFFSET $3`,
    [projectId, limit, offset]
  );
  return result.rows;
}

export async function updateSubtask(id: string, updates: UpdateSubtask): Promise<Subtask | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.description !== undefined) {
        fields.push(`description = $${fields.length + 1}`);
        values.push(updates.description);
    }
    if (updates.completed !== undefined) {
        fields.push(`completed = $${fields.length + 1}`);
        values.push(updates.completed);
    }


    if (fields.length === 0) {
        return getSubtaskById(id);
    }

    values.push(id);
    const query = `
        UPDATE subtasks
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${fields.length + 1}
        RETURNING id, project_id, completed, description, created_at, updated_at
    `;
    const result = await pool.query<Subtask>(query, values);

    return result.rows[0] || null;
}

export async function deleteSubtask(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM subtasks WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

