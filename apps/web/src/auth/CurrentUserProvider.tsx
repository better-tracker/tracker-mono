import { useAuth0 } from '@auth0/auth0-react';
import { ensureUser } from '@project-tracker/api-client';
import type { UserResponse } from '@project-tracker/contracts';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CurrentUserContext } from './current-user';
import { PageLoader } from './PageLoader';

type UserState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; user: UserResponse };

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { getAccessTokenSilently } = useAuth0();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<UserState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const token = await getAccessTokenSilently();
        if (!token) throw new Error('No access token was returned');
        const user = await ensureUser(
          (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, ''),
          token,
        );

        if (active) setState({ status: 'ready', user });
      } catch {
        if (active) {
          setState({
            status: 'error',
            message: 'Unable to load your account. Please try again.',
          });
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [getAccessTokenSilently, attempt]);

  if (state.status === 'loading') {
    return <div className="page-layout"><PageLoader /></div>;
  }

  if (state.status === 'error') {
    return (
      <div className="page-layout">
        <p role="alert">{state.message}</p>
        <button type="button" onClick={() => {
          setState({ status: 'loading' });
          setAttempt((value) => value + 1);
        }}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <CurrentUserContext.Provider value={state.user}>
      {children}
    </CurrentUserContext.Provider>
  );
}
