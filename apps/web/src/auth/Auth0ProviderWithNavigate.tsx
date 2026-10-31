import { Auth0Provider } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

interface Auth0ProviderWithNavigateProps {
  children: ReactNode;
}

export const Auth0ProviderWithNavigate = ({
  children,
}: Auth0ProviderWithNavigateProps) => {
  const navigate = useNavigate();

  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_AUTH0_CALLBACK_URL ?? 'http://localhost:3000';

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  if (!(domain && clientId && audience && redirectUri)) {
    return <p role="alert">Sign-in is not configured. Contact the app administrator.</p>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience,
        scope: 'openid profile email',
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};
