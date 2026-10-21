import {
  createTask,
  getTaskById,
  listTasksByProject,
  updateTask,
  deleteTask,
} from '@project-tracker/database';

import type { DatabaseConnection } from '@project-tracker/database';
import type {
  TaskCreate,
  TaskUpdate,
} from '@project-tracker/contracts';

export function createTasksService(database?: DatabaseConnection) {
  return {
    getTasks: (projectId: string) =>
      listTasksByProject(projectId, database),

    getTask: (id: string) =>
      getTaskById(id, database),

    createTask: (projectId: string, input: TaskCreate) =>
      createTask(
        {
          project_id: projectId,
          title: input.title,
          description: input.description,
          assignee: input.assignee,
          priority: input.priority,
          status: input.status,
          due_date: input.dueDate,
          due_time: input.dueTime,
          completed_at: input.completedAt
            ? new Date(input.completedAt)
            : null,
        },
        database,
      ),

    updateTask: (id: string, input: TaskUpdate) =>
      updateTask(
        id,
        {
          title: input.title,
          description: input.description,
          assignee: input.assignee,
          priority: input.priority,
          status: input.status,
          due_date: input.dueDate,
          due_time: input.dueTime,
          completed_at: input.completedAt
            ? new Date(input.completedAt)
            : null,
        },
        database,
      ),

    deleteTask: (id: string) =>
      deleteTask(id, database),
  };
}

export type TasksService = ReturnType<typeof createTasksService>;

export const tasksService = createTasksService();