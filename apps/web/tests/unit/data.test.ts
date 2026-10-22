import {
  dashboard,
  getProjectSummary,
} from '../../src/data/workspace-selectors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLocalDataSource,
  WORKSPACE_KEY,
} from '../../src/data/local-source';
import { localClock, weekNumber } from '../../src/data/dates';
import { hasSession, signIn, signOut } from '../../src/data/session';
import { validateDeadline } from '../../src/data/validation';
import type { SubtaskInput, TaskInput } from '../../src/data/types';

const now = new Date('2026-10-05T22:00:00Z'); // 09:00 in Melbourne after DST starts.
const input = (projectId: string): TaskInput => ({
  projectId,
  title: 'A new task',
  description: '',
  assignee: 'Ben Morgan',
  priority: 'High',
  status: 'To do',
  dueDate: '2026-10-06',
  dueTime: '11:00',
});
const draft: SubtaskInput = {
  title: 'A smaller step',
  notes: '',
  assignee: 'Ben Morgan',
  priority: 'High',
  completed: false,
  dueDate: '2026-10-06',
  dueTime: '10:30',
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});
describe('persistent demo workspace', () => {
  it('serializes simultaneous mutations without losing either change', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    await source.load();
    await Promise.all([
      source.createProject({ name: 'First project', description: '' }),
      source.createProject({ name: 'Second project', description: '' }),
    ]);
    expect(
      (await source.load()).projects.slice(-2).map((project) => project.name),
    ).toEqual(['First project', 'Second project']);
  });
  it('reports blocked storage access as a recoverable load failure', async () => {
    const source = createLocalDataSource(
      {
        getItem: () => {
          throw new Error('Storage blocked');
        },
        setItem: () => {},
      },
      () => now,
    );
    await expect(source.load()).rejects.toThrow('blocked demo storage');
  });
  it('seeds once, calculates dashboard values, and survives a new adapter', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    const seeded = await source.load();
    const summary = dashboard(seeded, now);
    expect(summary.today).toHaveLength(3);
    expect(summary.overdue).toHaveLength(2);
    expect(summary.done).toHaveLength(1);
    expect(summary.next?.title).toBe('Review dashboard wireframes');
    expect(getProjectSummary(seeded, seeded.projects[0]!.id).progress).toBe(25);
    await source.createProject({
      name: '  My project  ',
      description: 'Saved',
    });
    const reopened = await createLocalDataSource(
      localStorage,
      () => new Date('2026-11-01'),
    ).load();
    expect(reopened.projects.at(-1)?.name).toBe('My project');
    expect(reopened.tasks[0]?.dueDate).toBe('2026-10-06');
  });
  it('creates task and drafts atomically and keeps parent completion independent', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    const seeded = await source.load();
    const saved = await source.createTask(input(seeded.projects[0]!.id), [
      draft,
    ]);
    const task = saved.tasks.at(-1)!;
    const subtask = saved.subtasks.at(-1)!;
    expect(subtask.taskId).toBe(task.id);
    expect(task.id).toMatch(/^[\da-f-]{36}$/);
    const complete = await source.updateSubtask(subtask.id, {
      ...subtask,
      completed: true,
    });
    expect(complete.tasks.at(-1)?.status).toBe('To do');
    expect(complete.subtasks.at(-1)?.completed).toBe(true);
    const finished = await source.updateTask(task.id, {
      ...task,
      status: 'Complete',
    });
    expect(finished.tasks.at(-1)?.completedAt).toBe(now.toISOString());
    const reopened = await source.updateTask(task.id, {
      ...task,
      status: 'In progress',
    });
    expect(reopened.tasks.at(-1)?.completedAt).toBeNull();
  });
  it('rejects empty titles, invalid drafts, and parent deadline edits without partial writes', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    const seeded = await source.load();
    const before = localStorage.getItem(WORKSPACE_KEY);
    await expect(
      source.createTask({ ...input(seeded.projects[0]!.id), title: '   ' }, []),
    ).rejects.toThrow('required');
    await expect(
      source.createTask(input(seeded.projects[0]!.id), [
        { ...draft, title: '' },
      ]),
    ).rejects.toThrow('required');
    await expect(
      source.createTask(input(seeded.projects[0]!.id), [
        { ...draft, dueTime: '11:00' },
      ]),
    ).rejects.toThrow('before');
    await expect(
      source.updateTask(seeded.tasks[0]!.id, {
        ...seeded.tasks[0]!,
        dueTime: '10:00',
      }),
    ).rejects.toThrow('before');
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe(before);
  });
  it('cascades project and task deletion, supports subtask deletion and rejects missing records', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    const seeded = await source.load();
    const task = seeded.tasks[0]!;
    let saved = await source.deleteSubtask(seeded.subtasks[0]!.id);
    expect(saved.subtasks).toHaveLength(1);
    saved = await source.deleteTask(task.id);
    expect(saved.subtasks).toHaveLength(0);
    expect(saved.tasks.some((item) => item.id === task.id)).toBe(false);
    saved = await source.deleteProject(task.projectId);
    expect(saved.tasks.some((item) => item.projectId === task.projectId)).toBe(
      false,
    );
    await expect(source.deleteTask(task.id)).rejects.toThrow(
      'no longer exists',
    );
  });
  it('preserves stored data on failed writes and permits retry', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    await source.load();
    const before = localStorage.getItem(WORKSPACE_KEY);
    const fail = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
    await expect(
      source.createProject({ name: 'Try again', description: '' }),
    ).rejects.toThrow('could not save');
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe(before);
    fail.mockRestore();
    expect(
      (
        await source.createProject({ name: 'Try again', description: '' })
      ).projects.at(-1)?.name,
    ).toBe('Try again');
  });
  it('preserves corrupt data and resets only on explicit reset', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    localStorage.setItem(WORKSPACE_KEY, '{bad data');
    await expect(source.load()).rejects.toThrow();
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe('{bad data');
    const reset = await source.reset();
    expect(reset.tasks).toHaveLength(6);
    const malformed = {
      ...reset,
      tasks: [{ ...reset.tasks[0], priority: 'Unknown' }],
    };
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(malformed));
    await expect(source.load()).rejects.toThrow('unreadable');
  });
  it('validates profile input and saves all preferences', async () => {
    const source = createLocalDataSource(localStorage, () => now);
    const seeded = await source.load();
    await expect(
      source.saveProfile({ ...seeded.profile, email: 'invalid' }),
    ).rejects.toThrow('valid email');
    const profile = {
      ...seeded.profile,
      firstName: 'Alex',
      timezone: 'UTC',
      dailySummary: false,
      bio: 'A new bio',
    };
    await source.saveProfile(profile);
    expect((await source.load()).profile).toEqual(profile);
  });
});

describe('deadlines and local dates', () => {
  it('handles timezone day boundaries and Melbourne daylight saving', () => {
    expect(
      localClock(new Date('2026-10-03T15:59:00Z'), 'Australia/Melbourne'),
    ).toEqual({ date: '2026-10-04', time: '01:59' });
    expect(
      localClock(new Date('2026-10-03T16:00:00Z'), 'Australia/Melbourne'),
    ).toEqual({ date: '2026-10-04', time: '03:00' });
    expect(localClock(now, 'UTC').date).toBe('2026-10-05');
    expect(weekNumber('2026-10-06', 'Monday')).toBe(41);
    expect(weekNumber('2027-01-01', 'Monday')).toBe(53);
  });
  it('accepts optional deadlines and enforces valid dates, times, and strict parent limits', () => {
    expect(() => validateDeadline({ dueDate: '', dueTime: '' })).not.toThrow();
    expect(() => validateDeadline({ dueDate: '', dueTime: '10:00' })).toThrow(
      'date',
    );
    expect(() =>
      validateDeadline({ dueDate: '2026-02-30', dueTime: '' }),
    ).toThrow('valid due date');
    expect(() =>
      validateDeadline({ dueDate: '2026-10-06', dueTime: '24:00' }),
    ).toThrow('valid due time');
    expect(() =>
      validateDeadline(
        { dueDate: '2026-10-06', dueTime: '' },
        { dueDate: '2026-10-06', dueTime: '11:00' },
      ),
    ).toThrow('before');
  });
});

describe('demo session', () => {
  it('stores only a marker, honours remember-me, and signs out without deleting work', () => {
    localStorage.setItem(WORKSPACE_KEY, 'saved workspace');
    expect(() => signIn('wrong@example.com', 'demo-password', true)).toThrow(
      'demo email',
    );
    signIn('ben@example.com', 'demo-password', false);
    expect(hasSession()).toBe(true);
    expect(localStorage.getItem('project-tracker.session.v1')).toBeNull();
    expect(sessionStorage.getItem('project-tracker.session.v1')).toBe('demo');
    signIn('ben@example.com', 'demo-password', true);
    expect(localStorage.getItem('project-tracker.session.v1')).toBe('demo');
    expect(sessionStorage.getItem('project-tracker.session.v1')).toBeNull();
    signOut();
    expect(hasSession()).toBe(false);
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe('saved workspace');
    expect(JSON.stringify(localStorage)).not.toContain('demo-password');
  });
});
