// Implement project business rules and coordinate repository calls for persistence,
// without depending on Fastify request or reply objects.

import {
  createProject as createProjectRepo,
  getProjectById,
  listProjects,
  listSubtasksByProject,
  updateProject as updateProjectRepo,
  deleteProject as deleteProjectRepo,
} from '@project-tracker/database';

import type {
  ProjectCreate,
  ProjectUpdate,
} from '@project-tracker/contracts';

export const getAllProjects = async (limit = 40, offset = 0) => {
  return listProjects(limit, offset);
};

export const getProject = async (id: string) => {
  const project = await getProjectById(id);
  if (!project) return null;

  const subtasks = await listSubtasksByProject(id, null);
  return { ...project, subtasks };
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
  const project = await updateProjectRepo(id, {
    name: data.name,
    description: data.description,
  });
  if (!project) return null;

  const subtasks = await listSubtasksByProject(id, null);
  return { ...project, subtasks };
};

export const deleteProject = async (id: string) => {
  return deleteProjectRepo(id);
};
