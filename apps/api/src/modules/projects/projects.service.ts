import {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
} from '@project-tracker/database';

import type { DatabaseConnection } from '@project-tracker/database';
import type {
  ProjectCreate,
  ProjectUpdate,
} from '@project-tracker/contracts';

export function createProjectsService(database?: DatabaseConnection) {
  return {
    getProjects: () => listProjects(undefined, undefined, database),

    getProject: (id: string) => getProjectById(id, database),

    createProject: (input: ProjectCreate) => createProject(input, database),

    updateProject: (id: string, input: ProjectUpdate) =>
      updateProject(id, input, database),

    deleteProject: (id: string) => deleteProject(id, database),
  };
}

export type ProjectsService = ReturnType<typeof createProjectsService>;

export const projectsService = createProjectsService();
