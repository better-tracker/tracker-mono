import { z } from 'zod';
import { MAX_USERNAME_LENGTH } from './constants.js';

export const userIdSchema = z.uuid();
export const userParamsSchema = z.object({ id: userIdSchema });

export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'Username is required')
  .max(
    MAX_USERNAME_LENGTH,
    `Username must be ${MAX_USERNAME_LENGTH} characters or less`,
  );

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
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
