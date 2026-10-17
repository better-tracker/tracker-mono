import { randomUUID } from 'node:crypto';
import { vi } from 'vitest';
import type { CreateProject, CreateSubtask, Project, Subtask } from '@project-tracker/database';

export const projectId = '11111111-1111-4111-8111-111111111111';
export const subtaskId = '22222222-2222-4222-8222-222222222222';
const projects = new Map<string, Project>();
const subtasks = new Map<string, Subtask>();

export const database = {
  getProjectById: vi.fn(async (id: string) => projects.get(id.toLowerCase()) ?? null),
  listProjects: vi.fn(async (limit = 40, offset = 0) => [...projects.values()].slice(offset, offset + limit)),
  createProject: vi.fn(async (data: CreateProject) => {
    const project = { id: randomUUID(), name: data.name, description: data.description ?? null, created_at: new Date() };
    projects.set(project.id, project);
    return project;
  }),
  updateProject: vi.fn(async (id: string, data: Partial<CreateProject>) => {
    const project = projects.get(id.toLowerCase());
    if (!project) return null;
    Object.assign(project, data);
    return project;
  }),
  deleteProject: vi.fn(async (id: string) => {
    for (const [key, subtask] of subtasks) {
      if (subtask.project_id === id.toLowerCase()) subtasks.delete(key);
    }
    return projects.delete(id.toLowerCase());
  }),
  getSubtaskById: vi.fn(async (id: string) => subtasks.get(id.toLowerCase()) ?? null),
  listSubtasksByProject: vi.fn(async (id: string, limit: number | null = 40, offset = 0) => {
    const rows = [...subtasks.values()].filter((subtask) => subtask.project_id === id.toLowerCase());
    return limit === null ? rows.slice(offset) : rows.slice(offset, offset + limit);
  }),
  createSubtask: vi.fn(async (data: CreateSubtask) => {
    const subtask = {
      id: randomUUID(), project_id: data.project_id.toLowerCase(), description: data.description ?? null,
      completed: data.completed ?? false, created_at: new Date(), updated_at: new Date(),
    };
    subtasks.set(subtask.id, subtask);
    return subtask;
  }),
  updateSubtask: vi.fn(async (id: string, data: Partial<Pick<Subtask, 'description' | 'completed'>>) => {
    const subtask = subtasks.get(id.toLowerCase());
    if (!subtask) return null;
    Object.assign(subtask, data, { updated_at: new Date() });
    return subtask;
  }),
  deleteSubtask: vi.fn(async (id: string) => subtasks.delete(id.toLowerCase())),
};

export function resetDatabase() {
  projects.clear();
  subtasks.clear();
  for (const mock of Object.values(database)) mock.mockReset();
  projects.set(projectId, { id: projectId, name: 'Test project', description: null, created_at: new Date() });
  subtasks.set(subtaskId, {
    id: subtaskId, project_id: projectId, description: 'Test subtask', completed: false,
    created_at: new Date(), updated_at: new Date(),
  });
}
