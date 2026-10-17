import type { Project, Subtask } from '@project-tracker/database';

export const toSubtaskResponse = (subtask: Subtask) => ({
  id: subtask.id,
  completed: subtask.completed,
  description: subtask.description,
  createdAt: subtask.created_at.toISOString(),
  updatedAt: subtask.updated_at.toISOString(),
});

export const toProjectListItem = (project: Project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  createdAt: project.created_at.toISOString(),
});

export const toProjectResponse = (project: Project, subtasks: Subtask[] = []) => ({
  ...toProjectListItem(project),
  subtasks: subtasks.map(toSubtaskResponse),
});
