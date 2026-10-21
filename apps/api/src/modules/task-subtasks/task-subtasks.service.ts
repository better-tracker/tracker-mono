import {
  createTaskSubtask,
  getTaskSubtaskById,
  listTaskSubtasksByTask,
  updateTaskSubtask,
  deleteTaskSubtask,
} from '@project-tracker/database';

import type { DatabaseConnection } from '@project-tracker/database';
import type {
  TaskSubtaskCreate,
  TaskSubtaskUpdate,
} from '@project-tracker/contracts';

export function createTaskSubtasksService(
  database?: DatabaseConnection,
) {
  return {
    getSubtasks: (taskId: string) =>
      listTaskSubtasksByTask(taskId, database),

    getSubtask: (id: string) =>
      getTaskSubtaskById(id, database),

    createSubtask: (taskId: string, input: TaskSubtaskCreate) =>
      createTaskSubtask(
        {
          task_id: taskId,
          title: input.title,
          notes: input.notes,
          assignee: input.assignee,
          priority: input.priority,
          completed: input.completed,
          due_date: input.dueDate,
          due_time: input.dueTime,
        },
        database,
      ),

    updateSubtask: (id: string, input: TaskSubtaskUpdate) =>
      updateTaskSubtask(
        id,
        {
          title: input.title,
          notes: input.notes,
          assignee: input.assignee,
          priority: input.priority,
          completed: input.completed,
          due_date: input.dueDate,
          due_time: input.dueTime,
        },
        database,
      ),

    deleteSubtask: (id: string) =>
      deleteTaskSubtask(id, database),
  };
}

export type TaskSubtasksService = ReturnType<
  typeof createTaskSubtasksService
>;

export const taskSubtasksService = createTaskSubtasksService();