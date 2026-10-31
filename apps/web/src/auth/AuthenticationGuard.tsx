import { withAuthenticationRequired } from '@auth0/auth0-react';
import type { ComponentType } from 'react';
import { PageLoader } from './PageLoader';

interface AuthenticationGuardProps {
  component: ComponentType;
}

function GuardedComponent({ component: Component }: AuthenticationGuardProps) {
  return <Component />;
}

const AuthenticatedComponent = withAuthenticationRequired(GuardedComponent, {
  onRedirecting: () => (
    <div className="page-layout">
      <PageLoader />
    </div>
  ),
});

export function AuthenticationGuard(props: AuthenticationGuardProps) {
  return <AuthenticatedComponent {...props} />;
}
