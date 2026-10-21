import {
  createSubtask,
  getSubtaskById,
  listSubtasksByProject,
  updateSubtask,
  deleteSubtask,
} from '@project-tracker/database';

import type { DatabaseConnection } from '@project-tracker/database';
import type {
  SubtaskCreate,
  SubtaskUpdate,
} from '@project-tracker/contracts';

export function createSubtasksService(database?: DatabaseConnection) {
  return {
    getSubtasks: (projectId: string) =>
      listSubtasksByProject(projectId, undefined, undefined, database),

    getSubtask: async (projectId: string, id: string) => {
      const subtask = await getSubtaskById(id, database);

      if (!subtask || subtask.project_id !== projectId) {
        return null;
      }

      return subtask;
    },

    createSubtask: (projectId: string, input: SubtaskCreate) =>
      createSubtask(
        {
          project_id: projectId,
          description: input.description,
          completed: input.completed,
        },
        database,
      ),

    updateSubtask: async (
      projectId: string,
      id: string,
      input: SubtaskUpdate,
    ) => {
      const subtask = await getSubtaskById(id, database);

      if (!subtask || subtask.project_id !== projectId) {
        return null;
      }

      return updateSubtask(id, input, database);
    },

    deleteSubtask: async (projectId: string, id: string) => {
      const subtask = await getSubtaskById(id, database);

      if (!subtask || subtask.project_id !== projectId) {
        return false;
      }

      return deleteSubtask(id, database);
    },
  };
}

export type SubtasksService = ReturnType<typeof createSubtasksService>;

export const subtasksService = createSubtasksService();
