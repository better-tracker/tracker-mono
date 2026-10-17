import {
  projectNameSchema,
  projectDescriptionSchema,
  userEmailSchema,
} from '@project-tracker/contracts';
import { deadlineKey } from './dates';
import type {
  Deadline,
  DemoProfile,
  ProjectInput,
  SubtaskInput,
  TaskInput,
} from './types';

function requiredTitle(title: string) {
  const result = projectNameSchema.safeParse(title);
  if (!result.success)
    throw new Error(result.error.issues[0]?.message ?? 'A title is required.');
}
export function validateDeadline(value: Deadline, parent?: Deadline) {
  if (value.dueTime && !value.dueDate)
    throw new Error('Choose a due date before setting a time.');
  if (
    value.dueDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(value.dueDate) ||
      Number.isNaN(Date.parse(value.dueDate)) ||
      new Date(`${value.dueDate}T12:00:00Z`).toISOString().slice(0, 10) !==
        value.dueDate)
  )
    throw new Error('Choose a valid due date.');
  if (value.dueTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.dueTime))
    throw new Error('Choose a valid due time.');
  if (
    parent &&
    deadlineKey(parent) &&
    deadlineKey(value) &&
    deadlineKey(value) >= deadlineKey(parent)
  )
    throw new Error('The subtask must finish before the parent task deadline.');
}
export function validateProject(input: ProjectInput) {
  requiredTitle(input.name);
  const result = projectDescriptionSchema.safeParse(input.description);
  if (!result.success) throw new Error(result.error.issues[0]?.message);
}
export function validateTask(input: TaskInput) {
  requiredTitle(input.title);
  if (!input.projectId) throw new Error('Choose a project for this task.');
  if (input.description.length > 2000)
    throw new Error('Description must be 2000 characters or less.');
  validateDeadline(input);
}
export function validateSubtask(input: SubtaskInput, parent: Deadline) {
  requiredTitle(input.title);
  if (input.notes.length > 2000)
    throw new Error('Notes must be 2000 characters or less.');
  validateDeadline(input, parent);
}
export function validateProfile(profile: DemoProfile) {
  if (!profile.firstName.trim() || !profile.lastName.trim())
    throw new Error('First name and last name are required.');
  if (!userEmailSchema.safeParse(profile.email).success)
    throw new Error('Enter a valid email address.');
  try {
    new Intl.DateTimeFormat('en', { timeZone: profile.timezone });
  } catch {
    throw new Error('Choose a valid timezone.');
  }
}
