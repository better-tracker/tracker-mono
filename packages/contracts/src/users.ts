/* user schemas to validate api requests and responses
  - user ids must be valid uuids
  - usernames arer required and limited to 25 characters
  - emails must be valid addresses
  - prof pics are optional and stored as url/path strings
  - user timestamps not required per my discussion with supreme leader
*/

import { z } from 'zod';

export const userIdSchema = z.uuid();

export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'Username is required')
  .max(25, 'Username must be 25 characters or less');

export const userEmailSchema = z.email('Invalid email address');

export const userPasswordSchema = z.string().min(1, 'Password is required');

export const userProfilePicSchema = z.string().nullable();

export const userCreateSchema = z.object({
  user_name: userNameSchema,
  email: userEmailSchema,
  password: userPasswordSchema,
  profile_pic: userProfilePicSchema.optional(),
});

export const userUpdateSchema = z.object({
  user_name: userNameSchema,
  email: userEmailSchema,
  profile_pic: userProfilePicSchema.optional(),
});

export const userResponseSchema = z.object({
  id: userIdSchema,
  user_name: userNameSchema,
  email: userEmailSchema,
  profile_pic: userProfilePicSchema,
});

export const userListResponseSchema = z.array(userResponseSchema);
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;