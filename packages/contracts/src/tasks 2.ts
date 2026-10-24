import { z } from 'zod';
import {
  MAX_PROJECT_NAME_LENGTH,
  MAX_PROJECT_DESCRIPTION_LENGTH,
} from './constants.js';
import { utcDateSchema } from './dates.js';

// Validate task IDs and project IDs.
export const taskIdSchema = z.uuid();

export const taskCollectionParamsSchema = z.object({
  projectId: z.uuid(),
});

export const taskParamsSchema = taskCollectionParamsSchema.extend({
  id: taskIdSchema,
});

// Only allow the priorities supported by the frontend.
export const taskPrioritySchema = z.enum([
  'Low',
  'Medium',
  'High',
]);

// Only allow the statuses supported by the frontend.
export const taskStatusSchema = z.enum([
  'To do',
  'In progress',
  'Complete',
]);

// Task titles must not be empty or exceed 255 characters.
export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, 'Task title is required')
  .max(MAX_PROJECT_NAME_LENGTH);

// Task descriptions are optional text.
export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(MAX_PROJECT_DESCRIPTION_LENGTH);

// The person assigned to the task.
export const taskAssigneeSchema = z.string().trim();

// Dates and times are stored as strings.
export const taskDueDateSchema = z.string();
export const taskDueTimeSchema = z.string();

// A task may not have a completion timestamp yet.
export const taskCompletedAtSchema = utcDateSchema.nullable();

// Fields required when creating a task.
export const taskCreateSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  assignee: taskAssigneeSchema,
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: taskDueDateSchema,
  dueTime: taskDueTimeSchema,
  completedAt: taskCompletedAtSchema,
});

// Fields that can be changed when editing a task.
export const taskUpdateSchema = taskCreateSchema;

// Structure of a task returned by the API.
export const taskResponseSchema = taskCreateSchema.extend({
  id: taskIdSchema,
  projectId: z.uuid(),
  createdAt: utcDateSchema,
  updatedAt: utcDateSchema,
});

// Structure of the task list returned by the API.
export const taskListResponseSchema = z.array(
  taskResponseSchema,
);

// Generate TypeScript types from our Zod schemas.
export type TaskCollectionParams = z.infer<
  typeof taskCollectionParamsSchema
>;

export type TaskParams = z.infer<typeof taskParamsSchema>;

export type TaskCreate = z.infer<typeof taskCreateSchema>;

export type TaskUpdate = z.infer<typeof taskUpdateSchema>;

export type TaskResponse = z.infer<typeof taskResponseSchema>;

export type TaskListResponse = z.infer<
  typeof taskListResponseSchema
>;