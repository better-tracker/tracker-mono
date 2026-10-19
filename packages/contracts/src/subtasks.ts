import { z } from 'zod';
import { MAX_SUBTASK_DESCRIPTION_LENGTH } from './constants.js';

export const subtaskIdSchema = z.uuid();
const utcDateSchema = z.iso.datetime({ offset: false, local: false });

export const subtaskDescriptionSchema = z
  .string()
  .trim()
  .min(1, 'Subtask description is required')
  .max(
    MAX_SUBTASK_DESCRIPTION_LENGTH,
    `Subtask description must be ${MAX_SUBTASK_DESCRIPTION_LENGTH} characters or less`,
  );

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
