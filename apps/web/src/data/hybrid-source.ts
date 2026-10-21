import { createLocalDataSource } from './local-source';
import { seedHybridWorkspace } from './seed';

import {
  loadApiProjects,
  createApiProject,
  updateApiProject,
  deleteApiProject,
  loadApiTasks,
  createApiTask,
  updateApiTask,
  deleteApiTask,
  loadApiTaskSubtasks,
  createApiTaskSubtask,
  updateApiTaskSubtask,
  deleteApiTaskSubtask,
} from './api-source';

import type {
  FrontendDataSource,
  Workspace,
  DemoTask,
  DemoSubtask,
} from './types';

export function createHybridDataSource(): FrontendDataSource {
  const local = createLocalDataSource(
    {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
    },
    () => new Date(),
    'project-tracker.hybrid.v1',
    seedHybridWorkspace,
  );

  // Projects, tasks, and task subtasks come from the backend.
  // Profile settings remain stored locally.
  const load = async (): Promise<Workspace> => {
    const projects = await loadApiProjects();

    // Preserve local data if a project disappears from the backend.
    await local.syncProjects(projects);

    const workspace = await local.load();

    const tasksByProject = await Promise.all(
      projects.map(async (project) => {
        const tasks = await loadApiTasks(project.id);

        return Promise.all(
          tasks.map(async (task) => {
            const subtasks = await loadApiTaskSubtasks(
              project.id,
              task.id,
            );

            const demoTask: DemoTask = {
              id: task.id,
              projectId: task.projectId,
              title: task.title,
              description: task.description,
              assignee: task.assignee,
              priority: task.priority,
              status: task.status,
              dueDate: task.dueDate,
              dueTime: task.dueTime,
              completedAt: task.completedAt,
            };

            const demoSubtasks: DemoSubtask[] = subtasks.map(
              (subtask) => ({
                id: subtask.id,
                taskId: subtask.taskId,
                title: subtask.title,
                notes: subtask.notes,
                assignee: subtask.assignee,
                priority: subtask.priority,
                completed: subtask.completed,
                dueDate: subtask.dueDate,
                dueTime: subtask.dueTime,
              }),
            );

            return {
              task: demoTask,
              subtasks: demoSubtasks,
            };
          }),
        );
      }),
    );

    const results = tasksByProject.flat();

    workspace.tasks = results.map(({ task }) => task);
    workspace.subtasks = results.flatMap(
      ({ subtasks }) => subtasks,
    );

    return workspace;
  };

  return {
    load,

    createProject: async (input) => {
      await createApiProject(input);
      return load();
    },

    updateProject: async (id, input) => {
      await updateApiProject(id, input);
      return load();
    },

    deleteProject: async (id) => {
      const workspace = await load();

      if (workspace.tasks.some((task) => task.projectId === id)) {
        throw new Error(
          'This project has tasks. Delete its tasks before deleting the project.',
        );
      }

      await deleteApiProject(id);
      return load();
    },

    reset: async () => {
      await local.reset();
      return load();
    },

    createTask: async (input, drafts) => {
      const { projectId, ...taskInput } = input;

      const completedAt =
        input.status === 'Complete'
          ? new Date().toISOString()
          : null;

      const task = await createApiTask(projectId, {
        ...taskInput,
        completedAt,
      });

      // Create draft subtasks after the parent task exists.
      for (const draft of drafts) {
        await createApiTaskSubtask(projectId, task.id, draft);
      }

      return load();
    },

    updateTask: async (id, input) => {
      const workspace = await load();
      const existingTask = workspace.tasks.find(
        (task) => task.id === id,
      );

      if (!existingTask) {
        throw new Error('Task not found.');
      }

      const completedAt =
        input.status === 'Complete'
          ? existingTask.completedAt ?? new Date().toISOString()
          : null;

      await updateApiTask(input.projectId, id, {
        ...input,
        completedAt,
      });

      return load();
    },

    deleteTask: async (id) => {
      const workspace = await load();
      const task = workspace.tasks.find(
        (item) => item.id === id,
      );

      if (!task) {
        throw new Error('Task not found.');
      }

      await deleteApiTask(task.projectId, id);
      return load();
    },

    createSubtask: async (taskId, input) => {
      const workspace = await load();
      const task = workspace.tasks.find(
        (item) => item.id === taskId,
      );

      if (!task) {
        throw new Error('Parent task not found.');
      }

      await createApiTaskSubtask(task.projectId, taskId, input);
      return load();
    },

    updateSubtask: async (id, input) => {
      const workspace = await load();
      const subtask = workspace.subtasks.find(
        (item) => item.id === id,
      );

      if (!subtask) {
        throw new Error('Subtask not found.');
      }

      const task = workspace.tasks.find(
        (item) => item.id === subtask.taskId,
      );

      if (!task) {
        throw new Error('Parent task not found.');
      }

      await updateApiTaskSubtask(
        task.projectId,
        task.id,
        id,
        input,
      );

      return load();
    },

    deleteSubtask: async (id) => {
      const workspace = await load();
      const subtask = workspace.subtasks.find(
        (item) => item.id === id,
      );

      if (!subtask) {
        throw new Error('Subtask not found.');
      }

      const task = workspace.tasks.find(
        (item) => item.id === subtask.taskId,
      );

      if (!task) {
        throw new Error('Parent task not found.');
      }

      await deleteApiTaskSubtask(task.projectId, task.id, id);
      return load();
    },

    saveProfile: async (input) => {
      await local.saveProfile(input);
      return load();
    },
  };
}
