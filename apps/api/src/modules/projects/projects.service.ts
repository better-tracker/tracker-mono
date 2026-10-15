// Implement project business rules and coordinate repository calls for persistence,
// without depending on Fastify request or reply objects.

import {
  createProject as createProjectRepo,
  getProjectById,
  listProjects,
  updateProject as updateProjectRepo,
  deleteProject as deleteProjectRepo,
} from '@project-tracker/database';

import type {
  ProjectCreate,
  ProjectUpdate,
} from '@project-tracker/contracts';

export const getAllProjects = async () => {
  return listProjects();
};

export const getProject = async (id: string) => {
  return getProjectById(id);
};

export const createProject = async (data: ProjectCreate) => {
  return createProjectRepo({
    name: data.name,
    description: data.description ?? null,
  });
};

export const updateProject = async (
  id: string,
  data: ProjectUpdate,
) => {
  return updateProjectRepo(id, {
    name: data.name,
    description: data.description,
  });
};

export const deleteProject = async (id: string) => {
  return deleteProjectRepo(id);
};