import type { UserResponse } from '@project-tracker/contracts';
import type { User } from '@project-tracker/database';

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    auth0_user_id: user.auth0_user_id,
    user_name: user.user_name,
    email: user.email,
    profile_pic: user.profile_pic,
  };
}
