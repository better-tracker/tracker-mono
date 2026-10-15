// Implement project business rules and coordinate repository calls for persistence,
// without depending on Fastify request or reply objects.

import {
  createSubtask as createSubtaskRepo,
  getSubtaskById,
  listSubtasksByProject,
  updateSubtask as updateSubtaskRepo,
  deleteSubtask as deleteSubtaskRepo,
} from '@project-tracker/database';

import type {
  SubtaskCreate,
  SubtaskUpdate,
} from '@project-tracker/contracts';

export const getSubtasksForProject = async (projectId: string) => {
  return listSubtasksByProject(projectId);
};

export const getSubtask = async (id: string) => {
  return getSubtaskById(id);
};

export const createSubtask = async (
  projectId: string,
  data: SubtaskCreate,
) => {
  return createSubtaskRepo({
    project_id: projectId,
    description: data.description,
    completed: data.completed,
  });
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
