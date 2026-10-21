import { seedWorkspace } from './seed';
import { TASK_PRIORITIES, TASK_STATUSES } from './constants';
import {
  validateDeadline,
  validateProfile,
  validateProject,
  validateSubtask,
  validateTask,
} from './validation';
import type { FrontendDataSource, Workspace } from './types';

export const WORKSPACE_KEY = 'project-tracker.workspace.v1';

function readWorkspace(raw: string): Workspace {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Saved demo data is unreadable. Retry or reset the demo.');
  }
  const record = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;
  const strings = (v: Record<string, unknown>, keys: string[]) =>
    keys.every((key) => typeof v[key] === 'string');
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.subtasks) ||
    !record(value.profile)
  )
    throw new Error('Saved demo data is unreadable. Retry or reset the demo.');
  if (
    !value.projects.every(
      (v: unknown) => record(v) && strings(v, ['id', 'name', 'description']),
    ) ||
    !value.tasks.every(
      (v: unknown) =>
        record(v) &&
        strings(v, [
          'id',
          'projectId',
          'title',
          'description',
          'assignee',
          'dueDate',
          'dueTime',
        ]) &&
        TASK_PRIORITIES.some((priority) => priority === String(v.priority)) &&
        TASK_STATUSES.some((status) => status === String(v.status)) &&
        (v.completedAt === null ||
          (typeof v.completedAt === 'string' &&
            !Number.isNaN(Date.parse(v.completedAt)))),
    ) ||
    !value.subtasks.every(
      (v: unknown) =>
        record(v) &&
        strings(v, [
          'id',
          'taskId',
          'title',
          'notes',
          'assignee',
          'dueDate',
          'dueTime',
        ]) &&
        TASK_PRIORITIES.some((priority) => priority === String(v.priority)) &&
        typeof v.completed === 'boolean',
    ) ||
    !strings(value.profile, [
      'firstName',
      'lastName',
      'email',
      'bio',
      'timezone',
    ]) ||
    !['Monday', 'Sunday'].includes(String(value.profile.weekStartsOn)) ||
    typeof value.profile.assignmentEmails !== 'boolean' ||
    typeof value.profile.dailySummary !== 'boolean' ||
    !(value.profile.avatar === null || typeof value.profile.avatar === 'string')
  )
    throw new Error('Saved demo data is unreadable. Retry or reset the demo.');
  const workspace = value as unknown as Workspace;
  const ids = [
    ...workspace.projects,
    ...workspace.tasks,
    ...workspace.subtasks,
  ].map((v) => v.id);
  if (
    ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) ||
    new Set(ids).size !== ids.length
  )
    throw new Error('Saved demo IDs are invalid. Reset the demo to continue.');
  workspace.projects.forEach(validateProject);
  workspace.tasks.forEach((task) => {
    validateTask(task);
    if (!workspace.projects.some((project) => project.id === task.projectId))
      throw new Error(
        'A saved task has no project. Reset the demo to continue.',
      );
  });
  workspace.subtasks.forEach((subtask) => {
    const parent = workspace.tasks.find((task) => task.id === subtask.taskId);
    if (!parent)
      throw new Error(
        'A saved subtask has no parent. Reset the demo to continue.',
      );
    validateSubtask(subtask, parent);
  });
  validateProfile(workspace.profile);
  return workspace;
}

export function createLocalDataSource(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  now: () => Date = () => new Date(),
  storageKey: string = WORKSPACE_KEY,
  seed: (now: Date) => Workspace = seedWorkspace,
): FrontendDataSource & {
  syncProjects(projects: Workspace['projects']): Promise<Workspace>;
} {
  const save = (workspace: Workspace) => {
    try {
      storage.setItem(storageKey, JSON.stringify(workspace));
    } catch {
      throw new Error(
        'Your browser could not save this change. Free some storage or allow site storage, then retry.',
      );
    }
    return workspace;
  };
  const load = async () => {
    let raw: string | null;
    try {
      raw = storage.getItem(storageKey);
    } catch {
      throw new Error(
        'Your browser blocked demo storage. Allow site storage and retry.',
      );
    }
    return raw === null ? save(seed(now())) : readWorkspace(raw);
  };
  let pending: Promise<unknown> = Promise.resolve();
  const enqueue = (operation: () => Promise<Workspace>) => {
    const result = pending.then(operation);
    pending = result.catch(() => undefined);
    return result;
  };
  const change = (mutate: (workspace: Workspace) => void) =>
    enqueue(async () => {
      const workspace = await load();
      mutate(workspace);
      return save(workspace);
    });
 const syncProjects = (projects: Workspace['projects']) =>
  change((workspace) => {
    const projectIds = new Set(
      projects.map((project) => project.id),
    );

    const hasMissingProject = workspace.tasks.some(
      (task) => !projectIds.has(task.projectId),
    );

    if (hasMissingProject) {
      throw new Error(
        'Some local tasks reference missing backend projects. ' +
          'Synchronization stopped to protect your data.',
      );
    }

    workspace.projects = projects;
  });

  const find = <T extends { id: string }>(records: T[], id: string): T => {
    const value = records.find((item) => item.id === id);
    if (!value)
      throw new Error(
        'This record no longer exists. Return to the list and try again.',
      );
    return value;
  };
  return {
    load,
    syncProjects,
    reset: () => enqueue(async () => save(seed(now()))),
    createProject: (input) =>
      change((w) => {
        validateProject(input);
        w.projects.push({
          ...input,
          name: input.name.trim(),
          id: crypto.randomUUID(),
        });
      }),
    updateProject: (id, input) =>
      change((w) => {
        validateProject(input);
        Object.assign(find(w.projects, id), input, { name: input.name.trim() });
      }),
    deleteProject: (id) =>
      change((w) => {
        find(w.projects, id);
        const taskIds = w.tasks
          .filter((task) => task.projectId === id)
          .map((task) => task.id);
        w.subtasks = w.subtasks.filter(
          (subtask) => !taskIds.includes(subtask.taskId),
        );
        w.tasks = w.tasks.filter((task) => task.projectId !== id);
        w.projects = w.projects.filter((project) => project.id !== id);
      }),
    createTask: (input, drafts) =>
      change((w) => {
        validateTask(input);
        find(w.projects, input.projectId);
        drafts.forEach((draft) => validateSubtask(draft, input));
        const id = crypto.randomUUID();
        w.tasks.push({
          ...input,
          title: input.title.trim(),
          id,
          completedAt: input.status === 'Complete' ? now().toISOString() : null,
        });
        w.subtasks.push(
          ...drafts.map((draft) => ({
            ...draft,
            title: draft.title.trim(),
            id: crypto.randomUUID(),
            taskId: id,
          })),
        );
      }),
    updateTask: (id, input) =>
      change((w) => {
        validateTask(input);
        find(w.projects, input.projectId);
        const task = find(w.tasks, id);
        w.subtasks
          .filter((subtask) => subtask.taskId === id)
          .forEach((subtask) => validateDeadline(subtask, input));
        Object.assign(task, input, {
          title: input.title.trim(),
          completedAt:
            input.status === 'Complete'
              ? (task.completedAt ?? now().toISOString())
              : null,
        });
      }),
    deleteTask: (id) =>
      change((w) => {
        find(w.tasks, id);
        w.tasks = w.tasks.filter((task) => task.id !== id);
        w.subtasks = w.subtasks.filter((subtask) => subtask.taskId !== id);
      }),
    createSubtask: (taskId, input) =>
      change((w) => {
        validateSubtask(input, find(w.tasks, taskId));
        w.subtasks.push({
          ...input,
          title: input.title.trim(),
          id: crypto.randomUUID(),
          taskId,
        });
      }),
    updateSubtask: (id, input) =>
      change((w) => {
        const subtask = find(w.subtasks, id);
        validateSubtask(input, find(w.tasks, subtask.taskId));
        Object.assign(subtask, input, { title: input.title.trim() });
      }),
    deleteSubtask: (id) =>
      change((w) => {
        find(w.subtasks, id);
        w.subtasks = w.subtasks.filter((subtask) => subtask.id !== id);
      }),
    saveProfile: (input) =>
      change((w) => {
        validateProfile(input);
        w.profile = {
          ...input,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim(),
        };
      }),
  };
}
