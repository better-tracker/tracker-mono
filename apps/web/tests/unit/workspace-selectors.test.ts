import { describe, expect, it } from 'vitest';
import { seedWorkspace } from '../../src/data/seed';
import {
  getFilteredTasks,
  getProjectSummary,
  getSubtaskSummary,
} from '../../src/data/workspace-selectors';
import type { DemoTask } from '../../src/data/types';

describe('workspace summaries', () => {
  it('counts task completion separately from subtask completion', () => {
    const workspace = seedWorkspace(new Date('2026-10-05T22:00:00Z'));
    const parent = workspace.tasks[0]!;
    workspace.tasks = [
      { ...parent, status: 'To do' },
      { ...parent, id: 'complete', status: 'Complete' },
    ];
    workspace.subtasks.forEach((subtask) => {
      subtask.completed = true;
    });
    expect(getProjectSummary(workspace, parent.projectId)).toMatchObject({
      total: 2,
      completed: 1,
      progress: 50,
    });
    expect(getSubtaskSummary(workspace, parent.id)).toMatchObject({
      total: 2,
      completed: 2,
    });
    expect(getProjectSummary(workspace, 'missing')).toMatchObject({
      total: 0,
      progress: 0,
    });
    expect(getSubtaskSummary(workspace, undefined)).toMatchObject({
      total: 0,
      completed: 0,
    });
  });

  it('combines filters and sorts dated tasks first without changing stored order', () => {
    const template = seedWorkspace(new Date('2026-10-05T22:00:00Z')).tasks[0]!;
    const tasks: DemoTask[] = [
      {
        ...template,
        id: 'undated',
        title: 'API docs',
        dueDate: '',
        dueTime: '',
      },
      {
        ...template,
        id: 'late',
        title: 'API release',
        dueDate: '2026-10-08',
        dueTime: '09:00',
      },
      {
        ...template,
        id: 'early',
        title: 'API review',
        dueDate: '2026-10-06',
        dueTime: '09:00',
      },
      {
        ...template,
        id: 'other',
        title: 'API review',
        projectId: 'other',
        dueDate: '2026-10-05',
      },
    ];
    const selected = getFilteredTasks(tasks, {
      query: 'api',
      projectId: template.projectId,
      status: template.status,
      priority: template.priority,
    });
    expect(selected.map((task) => task.id)).toEqual([
      'early',
      'late',
      'undated',
    ]);
    expect(tasks.map((task) => task.id)).toEqual([
      'undated',
      'late',
      'early',
      'other',
    ]);
    expect(getFilteredTasks(tasks, { query: 'no match' })).toEqual([]);
  });
});
