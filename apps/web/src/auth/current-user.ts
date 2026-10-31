import { createContext, useContext } from 'react';
import type { UserResponse } from '@project-tracker/contracts';

export const CurrentUserContext = createContext<UserResponse | null>(null);

export function useCurrentUser(): UserResponse {
  const user = useContext(CurrentUserContext);

  if (!user) {
    throw new Error('useCurrentUser must be used inside CurrentUserProvider');
  }

  return user;
}
