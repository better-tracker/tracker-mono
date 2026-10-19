import { z } from 'zod';
import { MAX_SUBTASK_DESCRIPTION_LENGTH } from './constants.js';
import { utcDateSchema } from './dates.js';

export const subtaskIdSchema = z.uuid();
export const subtaskCollectionParamsSchema = z.object({ projectId: z.uuid() });
export const subtaskParamsSchema = subtaskCollectionParamsSchema.extend({ id: subtaskIdSchema });

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

export type SubtaskCollectionParams = z.infer<typeof subtaskCollectionParamsSchema>;
export type SubtaskParams = z.infer<typeof subtaskParamsSchema>;
export type SubtaskCreateInput = z.input<typeof subtaskCreateSchema>;
export type SubtaskCreate = z.infer<typeof subtaskCreateSchema>;
export type SubtaskUpdate = z.infer<typeof subtaskUpdateSchema>;
export type SubtaskResponse = z.infer<typeof subtaskResponseSchema>;
export type SubtaskListResponse = z.infer<typeof subtaskListResponseSchema>;
