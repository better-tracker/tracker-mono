import {
  projectNameSchema,
  projectDescriptionSchema,
  userEmailSchema,
} from '@project-tracker/contracts';
import { deadlineKey, isValidDateOnly, isValidTime } from './dates';
import {
  MAX_SUBTASK_NOTES_LENGTH,
  MAX_TASK_DESCRIPTION_LENGTH,
} from './constants';
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

function validateParentDeadline(value: Deadline, parent: Deadline): void {
  const deadline = deadlineKey(value);
  const parentDeadline = deadlineKey(parent);
  if (deadline && parentDeadline && deadline >= parentDeadline) {
    throw new Error('The subtask must finish before the parent task deadline.');
  }
}

export function validateDeadline(value: Deadline, parent?: Deadline) {
  if (value.dueTime && !value.dueDate)
    throw new Error('Choose a due date before setting a time.');
  if (value.dueDate && !isValidDateOnly(value.dueDate))
    throw new Error('Choose a valid due date.');
  if (value.dueTime && !isValidTime(value.dueTime))
    throw new Error('Choose a valid due time.');
  if (parent) validateParentDeadline(value, parent);
}
export function validateProject(input: ProjectInput) {
  requiredTitle(input.name);
  const result = projectDescriptionSchema.safeParse(input.description);
  if (!result.success) throw new Error(result.error.issues[0]?.message);
}
export function validateTask(input: TaskInput) {
  requiredTitle(input.title);
  if (!input.projectId) throw new Error('Choose a project for this task.');
  if (input.description.length > MAX_TASK_DESCRIPTION_LENGTH)
    throw new Error(
      `Description must be ${MAX_TASK_DESCRIPTION_LENGTH} characters or less.`,
    );
  validateDeadline(input);
}
export function validateSubtask(input: SubtaskInput, parent: Deadline) {
  requiredTitle(input.title);
  if (input.notes.length > MAX_SUBTASK_NOTES_LENGTH)
    throw new Error(
      `Notes must be ${MAX_SUBTASK_NOTES_LENGTH} characters or less.`,
    );
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
