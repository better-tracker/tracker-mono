import type { Deadline } from './types';
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
  const value = dateOnlyToDate(date);
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
  }).format(dateOnlyToDate(date));
}

export function weekNumber(date: string, weekStartsOn: 'Monday' | 'Sunday') {
  const day = dateOnlyToDate(date);
  if (weekStartsOn === 'Sunday') {
    const first = new Date(Date.UTC(day.getUTCFullYear(), 0, 1, 12));
    return Math.ceil(
      ((day.getTime() - first.getTime()) / MILLISECONDS_PER_DAY +
        first.getUTCDay() +
        1) /
        7,
    );
  }
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const first = new Date(Date.UTC(day.getUTCFullYear(), 0, 1, 12));
  return Math.ceil(
    ((day.getTime() - first.getTime()) / MILLISECONDS_PER_DAY + 1) / 7,
  );
}

function dateOnlyToDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function isValidDateOnly(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const value = dateOnlyToDate(date);
  return (
    !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === date
  );
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function compareDeadlines(a: Deadline, b: Deadline): number {
  return (deadlineKey(a) || '9999').localeCompare(deadlineKey(b) || '9999');
}

type DeadlineLabelOptions = {
  noDeadline?: string;
  endOfDay?: string;
};

export function formatDeadlineTime(
  value: Deadline,
  {
    noDeadline = 'No deadline',
    endOfDay = 'End of day',
  }: DeadlineLabelOptions = {},
): string {
  return value.dueTime || (value.dueDate ? endOfDay : noDeadline);
}

export function formatDeadline(
  value: Deadline,
  options: DeadlineLabelOptions & { today?: string; uppercase?: boolean } = {},
): string {
  let label = options.noDeadline ?? 'No deadline';
  if (value.dueDate) {
    const date =
      value.dueDate === options.today ? 'Today' : dateLabel(value.dueDate);
    label = `${date} / ${formatDeadlineTime(value, options)}`;
  }
  return options.uppercase ? label.toUpperCase() : label;
}
