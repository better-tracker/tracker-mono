import { z } from 'zod';
import {
  MAX_PROJECT_NAME_LENGTH,
  MAX_SUBTASK_DESCRIPTION_LENGTH,
} from './constants.js';
import { utcDateSchema } from './dates.js';
import { taskPrioritySchema } from './tasks.js';

// Validate subtask and parent task IDs.
export const taskSubtaskIdSchema = z.uuid();

export const taskSubtaskCollectionParamsSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
});

export const taskSubtaskParamsSchema =
  taskSubtaskCollectionParamsSchema.extend({
    id: taskSubtaskIdSchema,
  });

// Subtask title must not be empty.
export const taskSubtaskTitleSchema = z
  .string()
  .trim()
  .min(1, 'Subtask title is required')
  .max(MAX_PROJECT_NAME_LENGTH);

// Additional notes can be empty.
export const taskSubtaskNotesSchema = z
  .string()
  .trim()
  .max(MAX_SUBTASK_DESCRIPTION_LENGTH);

// Person assigned to the subtask.
export const taskSubtaskAssigneeSchema = z.string().trim();

// Whether the subtask has been completed.
export const taskSubtaskCompletedSchema = z.boolean();

// Deadline fields.
export const taskSubtaskDueDateSchema = z.string();
export const taskSubtaskDueTimeSchema = z.string();

// Validate the data when creating a task subtask.
export const taskSubtaskCreateSchema = z.object({
  title: taskSubtaskTitleSchema,
  notes: taskSubtaskNotesSchema,
  assignee: taskSubtaskAssigneeSchema,
  priority: taskPrioritySchema,
  completed: taskSubtaskCompletedSchema,
  dueDate: taskSubtaskDueDateSchema,
  dueTime: taskSubtaskDueTimeSchema,
});

// Validate the data when updating a task subtask.
export const taskSubtaskUpdateSchema = taskSubtaskCreateSchema;

// Define the structure of a subtask returned by the API.
export const taskSubtaskResponseSchema =
  taskSubtaskCreateSchema.extend({
    id: taskSubtaskIdSchema,
    taskId: z.uuid(),
    createdAt: utcDateSchema,
    updatedAt: utcDateSchema,
  });

// Define the structure of a list of subtasks.
export const taskSubtaskListResponseSchema = z.array(
  taskSubtaskResponseSchema,
);

// Generate TypeScript types from our Zod schemas.
export type TaskSubtaskCollectionParams = z.infer<
  typeof taskSubtaskCollectionParamsSchema
>;

export type TaskSubtaskParams = z.infer<
  typeof taskSubtaskParamsSchema
>;

export type TaskSubtaskCreate = z.infer<
  typeof taskSubtaskCreateSchema
>;

export type TaskSubtaskUpdate = z.infer<
  typeof taskSubtaskUpdateSchema
>;

export type TaskSubtaskResponse = z.infer<
  typeof taskSubtaskResponseSchema
>;

export type TaskSubtaskListResponse = z.infer<
  typeof taskSubtaskListResponseSchema
>;