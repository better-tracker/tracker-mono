/* User sschema
    user must have a name and email.
    name between 1 and 
*/

import { z } from 'zod';

export const userIdSchema = z.uuid();
const utcDateSchema = z.iso.datetime();

export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'Username is required')
  .max(25, 'Username must be 25 characters or less');

export const userEmailSchema = z.email('Invalid email address');

export const userCreateSchema = z.object({
  name: userNameSchema,
  email: userEmailSchema,
});

export const userUpdateSchema = z.object({
  name: userNameSchema,
  email: userEmailSchema,
});

export const userResponseSchema = z.object({
  id: userIdSchema,
  name: userNameSchema,
  email: userEmailSchema,
  createdAt: utcDateSchema,
  updatedAt: utcDateSchema,
});

export const userListResponseSchema = z.array(userResponseSchema,);
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;