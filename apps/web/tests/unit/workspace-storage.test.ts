import { describe, expect, it } from 'vitest';
import { seedWorkspace } from '../../src/data/seed';
import { readWorkspace } from '../../src/data/workspace-storage';
import type { Workspace } from '../../src/data/types';

const seed = () => seedWorkspace(new Date('2026-10-05T22:00:00Z'));
const read = (value: unknown) => readWorkspace(JSON.stringify(value));

describe('saved workspace validation', () => {
  const malformed: {
    name: string;
    change: (workspace: Workspace) => unknown;
  }[] = [
    { name: 'unsupported version', change: (w) => ({ ...w, version: 2 }) },
    {
      name: 'missing profile fields',
      change: (w) => ({ ...w, profile: { firstName: 'Ben' } }),
    },
    {
      name: 'invalid task priority',
      change: (w) => ({ ...w, tasks: [{ ...w.tasks[0], priority: 'Urgent' }] }),
    },
    {
      name: 'invalid completion timestamp',
      change: (w) => ({
        ...w,
        tasks: [{ ...w.tasks[0], completedAt: 'invalid' }],
      }),
    },
    {
      name: 'invalid subtask completion',
      change: (w) => ({
        ...w,
        subtasks: [{ ...w.subtasks[0], completed: 'false' }],
      }),
    },
  ];

  it.each(malformed)('rejects $name as unreadable data', ({ change }) => {
    expect(() => read(change(seed()))).toThrow('Saved demo data is unreadable');
  });

  it('validates IDs across all record types', () => {
    const workspace = seed();
    workspace.tasks[0]!.id = workspace.projects[0]!.id;
    expect(() => read(workspace)).toThrow('Saved demo IDs are invalid');
    workspace.tasks[0]!.id = 'not-an-id';
    expect(() => read(workspace)).toThrow('Saved demo IDs are invalid');
  });

  it('rejects missing parent relationships with their existing messages', () => {
    const workspace = seed();
    workspace.tasks[0]!.projectId = 'missing';
    expect(() => read(workspace)).toThrow('A saved task has no project');
    const other = seed();
    other.subtasks[0]!.taskId = 'missing';
    expect(() => read(other)).toThrow('A saved subtask has no parent');
  });

  it('keeps additional stored fields and does not normalize saved values during reads', () => {
    const workspace = seed();
    const stored = {
      ...workspace,
      extra: 'preserved',
      projects: workspace.projects.map((project) => ({
        ...project,
        name: ` ${project.name} `,
        extra: true,
      })),
    };
    expect(read(stored)).toEqual(stored);
  });
});
