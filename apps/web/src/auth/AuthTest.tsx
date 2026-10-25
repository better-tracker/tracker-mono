import { useAuth0 } from '@auth0/auth0-react';
import { cn } from '../components/ui/classes';

export function AuthTest() {
  const { isAuthenticated, getAccessTokenWithPopup } = useAuth0();

  const testApi = async () => {
    try {
      const token = await getAccessTokenWithPopup({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });

      console.log('Access token obtained:', !!token);

      const response = await fetch('http://localhost:3001/v1/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API status:', response.status);
      console.log('API response:', await response.text());
      console.log('Access token:', token);
    } catch (error) {
      console.error('Auth/API test failed:', error);
    }
  };

  return (
    <button
      onClick={testApi}
      disabled={!isAuthenticated}
      className={cn(
        'rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      Test authenticated API
    </button>
  );
}
