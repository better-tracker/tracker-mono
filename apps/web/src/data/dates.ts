import type { Deadline, DemoTask, Workspace } from './types';
import { MILLISECONDS_PER_DAY } from './constants';

export function localClock(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function deadlineKey(value: Deadline) {
  return value.dueDate ? `${value.dueDate}T${value.dueTime || '23:59'}` : '';
}

export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' },
) {
  return new Intl.DateTimeFormat('en-AU', {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function weekNumber(date: string, weekStartsOn: 'Monday' | 'Sunday') {
  const day = new Date(`${date}T12:00:00Z`);
  if (weekStartsOn === 'Sunday') {
    const first = new Date(Date.UTC(day.getUTCFullYear(), 0, 1, 12));
    return Math.ceil(
      ((day.getTime() - first.getTime()) / MILLISECONDS_PER_DAY +
        first.getUTCDay() + 1) /
        7,
    );
  }
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const first = new Date(Date.UTC(day.getUTCFullYear(), 0, 1, 12));
  return Math.ceil(
    ((day.getTime() - first.getTime()) / MILLISECONDS_PER_DAY + 1) / 7,
  );
}

export function dashboard(workspace: Workspace, now: Date) {
  const clock = localClock(now, workspace.profile.timezone);
  const pending = workspace.tasks.filter((task) => task.status !== 'Complete');
  const sort = (a: DemoTask, b: DemoTask) =>
    deadlineKey(a).localeCompare(deadlineKey(b));
  const today = pending
    .filter((task) => task.dueDate === clock.date)
    .sort(sort);
  const overdue = pending
    .filter(
      (task) =>
        deadlineKey(task) && deadlineKey(task) < `${clock.date}T${clock.time}`,
    )
    .sort(sort);
  const upcoming = pending
    .filter(
      (task) =>
        deadlineKey(task) && deadlineKey(task) >= `${clock.date}T${clock.time}`,
    )
    .sort(sort);
  const done = workspace.tasks.filter(
    (task) =>
      task.status === 'Complete' &&
      task.completedAt &&
      localClock(new Date(task.completedAt), workspace.profile.timezone)
        .date === clock.date,
  );
  return {
    clock,
    today,
    overdue,
    done,
    next: upcoming[0] ?? overdue[0] ?? pending[0],
  };
}

export function projectProgress(workspace: Workspace, projectId: string) {
  const tasks = workspace.tasks.filter((task) => task.projectId === projectId);
  return tasks.length
    ? Math.round(
        (tasks.filter((task) => task.status === 'Complete').length /
          tasks.length) *
          100,
      )
    : 0;
}
