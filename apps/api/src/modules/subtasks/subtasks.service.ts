// Implement project business rules and coordinate repository calls for persistence,
// without depending on Fastify request or reply objects.

import {
  createSubtask as createSubtaskRepo,
  getSubtaskById,
  getProjectById,
  listSubtasksByProject,
  updateSubtask as updateSubtaskRepo,
  deleteSubtask as deleteSubtaskRepo,
} from '@project-tracker/database';

import type {
  SubtaskCreate,
  SubtaskUpdate,
} from '@project-tracker/contracts';

export const getSubtasksForProject = async (projectId: string, limit = 40, offset = 0) => {
  if (!await getProjectById(projectId)) return null;
  return listSubtasksByProject(projectId, limit, offset);
};

export const getSubtask = async (id: string) => {
  return getSubtaskById(id);
};

export const createSubtask = async (
  projectId: string,
  data: SubtaskCreate,
) => {
  if (!await getProjectById(projectId)) return null;

  try {
    return await createSubtaskRepo({
      project_id: projectId,
      description: data.description,
      completed: data.completed,
    });
  } catch (error) {
    // The parent can be deleted between the existence check and the insert.
    if (
      typeof error === 'object' && error !== null &&
      'code' in error && error.code === '23503' &&
      'constraint' in error && error.constraint === 'fk_subtasks_project'
    ) {
      return null;
    }
    throw error;
  }
};

export const updateSubtask = async (
  id: string,
  data: SubtaskUpdate,
) => {
  return updateSubtaskRepo(id, {
    description: data.description,
    completed: data.completed,
  });
};

export const deleteSubtask = async (id: string) => {
  return deleteSubtaskRepo(id);
};
