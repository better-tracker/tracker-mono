import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from './constants';
import type { Workspace } from './types';
import {
  validateProfile,
  validateProject,
  validateSubtask,
  validateTask,
} from './validation';

const deadlineFields = { dueDate: z.string(), dueTime: z.string() };
const projectSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});
const taskSchema = z.looseObject({
  ...deadlineFields,
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string(),
  assignee: z.string(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  completedAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)))
    .nullable(),
});
const subtaskSchema = z.looseObject({
  ...deadlineFields,
  id: z.string(),
  taskId: z.string(),
  title: z.string(),
  notes: z.string(),
  assignee: z.string(),
  priority: z.enum(TASK_PRIORITIES),
  completed: z.boolean(),
});
const profileSchema = z.looseObject({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  bio: z.string(),
  avatar: z.string().nullable(),
  timezone: z.string(),
  weekStartsOn: z.enum(['Monday', 'Sunday']),
  assignmentEmails: z.boolean(),
  dailySummary: z.boolean(),
});
const workspaceSchema = z.looseObject({
  version: z.literal(1),
  projects: z.array(projectSchema),
  tasks: z.array(taskSchema),
  subtasks: z.array(subtaskSchema),
  profile: profileSchema,
});

function validateWorkspaceIds(workspace: Workspace): void {
  const ids = [
    ...workspace.projects,
    ...workspace.tasks,
    ...workspace.subtasks,
  ].map((item) => item.id);
  if (
    ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error('Saved demo IDs are invalid. Reset the demo to continue.');
  }
}

function validateWorkspaceContents(workspace: Workspace): void {
  const projectIds = new Set(workspace.projects.map((project) => project.id));
  const tasksById = new Map(workspace.tasks.map((task) => [task.id, task]));

  workspace.projects.forEach(validateProject);
  workspace.tasks.forEach((task) => {
    validateTask(task);
    if (!projectIds.has(task.projectId)) {
      throw new Error(
        'A saved task has no project. Reset the demo to continue.',
      );
    }
  });
  workspace.subtasks.forEach((subtask) => {
    const parent = tasksById.get(subtask.taskId);
    if (!parent) {
      throw new Error(
        'A saved subtask has no parent. Reset the demo to continue.',
      );
    }
    validateSubtask(subtask, parent);
  });
  validateProfile(workspace.profile);
}

export function readWorkspace(raw: string): Workspace {
  const unreadableMessage =
    'Saved demo data is unreadable. Retry or reset the demo.';
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(unreadableMessage);
  }

  const result = workspaceSchema.safeParse(value);
  if (!result.success) throw new Error(unreadableMessage);

  validateWorkspaceIds(result.data);
  validateWorkspaceContents(result.data);
  return result.data;
}
