import { useAuth0 } from '@auth0/auth0-react';
import { cn } from '../components/ui/classes';

const LoginButtonAuth0 = () => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: '/',
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className={cn(
        'rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      Log In Auth0
    </button>
  );
};

export default LoginButtonAuth0;
