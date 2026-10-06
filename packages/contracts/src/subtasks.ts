/* Follows the same pattern as projects.ts but for subtasks
    See projects for its description
*/    

import { z } from 'zod';

export const subtaskIdSchema = z.uuid();
const utcDateSchema = z.iso.datetime();

export const subtaskDescriptionSchema = z
  .string()
  .trim()
  .min(1, 'Subtask description is required')
  .max(2000, 'Subtask description must be 2000 characters or less');

export const subtaskCreateSchema = z.object({
  completed: z.boolean().default(false),
  description: subtaskDescriptionSchema,
});

export const subtaskUpdateSchema = z.object({
  completed: z.boolean(),
  description: subtaskDescriptionSchema,
});

export const subtaskResponseSchema = z.object({
  id: subtaskIdSchema,
  completed: z.boolean(),
  description: subtaskDescriptionSchema,
  createdAt: utcDateSchema,
  updatedAt: utcDateSchema,
});

export const subtaskListResponseSchema = z.array(
  subtaskResponseSchema,
);

export type SubtaskCreate = z.infer<typeof subtaskCreateSchema>;
export type SubtaskUpdate = z.infer<typeof subtaskUpdateSchema>;
export type SubtaskResponse = z.infer<typeof subtaskResponseSchema>;
export type SubtaskListResponse = z.infer<typeof subtaskListResponseSchema>;