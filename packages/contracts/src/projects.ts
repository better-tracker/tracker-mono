/* Using Zod for schema validation and type inference
    Projects must have a name and description
    Name must be string and between 1 and 255 characters
    Description limit to 2000 chars and not null
    Trim removes whitespace
    Also have subtasks schema to list them in the description
*/

import { z } from 'zod';

export const projectIdSchema = z.uuid();
const utcDateSchema = z.iso.datetime();

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Project name is required')
  .max(255, 'Project name must be 255 characters or less');

export const projectDescriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Project description must be 2000 characters or less')
  .nullable();

export const projectCreateSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema.optional(),
});

export const projectUpdateSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
});

export const projectSubtaskSchema = z.object({
  id: z.uuid(),
  completed: z.boolean(),
  description: z.string(),
  createdAt: utcDateSchema,
  updatedAt: utcDateSchema,
});

export const projectResponseSchema = z.object({
  id: projectIdSchema,
  name: projectNameSchema,
  description: projectDescriptionSchema,
  subtasks: z.array(projectSubtaskSchema),
  createdAt: utcDateSchema,
});

export const projectListItemSchema = z.object({
  id: projectIdSchema,
  name: projectNameSchema,
  description: projectDescriptionSchema,
  createdAt: utcDateSchema,
});

export const projectListResponseSchema = z.array(projectListItemSchema,);
export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type ProjectSubtask = z.infer<typeof projectSubtaskSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>;