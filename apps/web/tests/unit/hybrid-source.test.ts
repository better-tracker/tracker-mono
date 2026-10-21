import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHybridDataSource } from '../../src/data/hybrid-source';
import { WORKSPACE_KEY } from '../../src/data/local-source';

import {
  loadApiProjects,
  deleteApiProject,
  loadApiTasks,
  loadApiTaskSubtasks,
} from '../../src/data/api-source';

vi.mock('../../src/data/api-source', () => ({
  loadApiProjects: vi.fn(),
  createApiProject: vi.fn(),
  updateApiProject: vi.fn(),
  deleteApiProject: vi.fn(),
  loadApiTasks: vi.fn(),
  createApiTask: vi.fn(),
  updateApiTask: vi.fn(),
  deleteApiTask: vi.fn(),
  loadApiTaskSubtasks: vi.fn(),
  createApiTaskSubtask: vi.fn(),
  updateApiTaskSubtask: vi.fn(),
  deleteApiTaskSubtask: vi.fn(),
}));

const project = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Backend project',
  description: 'Stored in PostgreSQL',
};

const task = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  projectId: project.id,
  title: 'Backend task',
  description: 'Stored in PostgreSQL',
  assignee: 'Ben Morgan',
  priority: 'High' as const,
  status: 'To do' as const,
  dueDate: '2026-10-22',
  dueTime: '11:00',
  completedAt: null,
  createdAt: '2026-10-21T04:00:00.000Z',
  updatedAt: '2026-10-21T04:00:00.000Z',
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();

  vi.mocked(loadApiProjects).mockResolvedValue([project]);
  vi.mocked(loadApiTasks).mockResolvedValue([]);
  vi.mocked(loadApiTaskSubtasks).mockResolvedValue([]);
});

describe('hybrid workspace', () => {
  it('loads backend projects without changing the demo workspace', async () => {
    const source = createHybridDataSource();
    const workspace = await source.load();

    expect(workspace.projects).toEqual([project]);
    expect(workspace.tasks).toEqual([]);
    expect(workspace.subtasks).toEqual([]);

    expect(loadApiTasks).toHaveBeenCalledWith(project.id);
    expect(
      localStorage.getItem('project-tracker.hybrid.v1'),
    ).not.toBeNull();
    expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
  });

  it('loads tasks from the backend', async () => {
    vi.mocked(loadApiTasks).mockResolvedValue([task]);

    const source = createHybridDataSource();
    const workspace = await source.load();

    expect(workspace.tasks).toEqual([
      {
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
      },
    ]);
  });

  it('prevents deleting backend projects that have tasks', async () => {
    vi.mocked(loadApiTasks).mockResolvedValue([task]);

    const source = createHybridDataSource();

    await expect(
      source.deleteProject(project.id),
    ).rejects.toThrow('This project has tasks.');

    expect(deleteApiProject).not.toHaveBeenCalled();
  });

  it('resets local workspace without deleting backend data', async () => {
    vi.mocked(loadApiTasks).mockResolvedValue([task]);

    const source = createHybridDataSource();

    await source.load();
    const workspace = await source.reset();

    expect(workspace.projects).toEqual([project]);
    expect(workspace.tasks).toHaveLength(1);
    expect(workspace.tasks[0]?.id).toBe(task.id);
    expect(workspace.subtasks).toEqual([]);

    expect(deleteApiProject).not.toHaveBeenCalled();
    expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
  });
});
