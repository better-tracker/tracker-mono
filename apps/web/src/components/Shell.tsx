import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useWorkspace } from '../features/workspace-context';

const links = [
  ['/', 'Today'],
  ['/projects', 'Projects'],
  ['/tasks', 'Tasks'],
  ['/profile', 'Profile'],
];
function Navigation({ bottom = false }: { bottom?: boolean }) {
  return (
    <nav
      aria-label={bottom ? 'Mobile navigation' : 'Main navigation'}
      className={bottom ? 'bottom-nav' : 'top-nav'}
    >
      {links.map(([to, label]) => (
        <NavLink key={to} to={to!} end={to === '/'}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
export function Shell() {
  const { workspace, error, notice } = useWorkspace();
  const location = useLocation();
  const initials = `${workspace.profile.firstName[0] ?? ''}${workspace.profile.lastName[0] ?? ''}`;
  const formPage = /\/new$|\/edit$/.test(location.pathname);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main')?.focus();
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" to="/">
          PROJECT TRACKER<span className="desktop-brand"> / 001</span>
        </Link>
        <Navigation />
        <Link
          to="/profile"
          className="mobile-identity"
          aria-label="Your profile"
        >
          {initials}
        </Link>
      </header>
      <main id="content" tabIndex={-1}>
        {formPage && (
          <Link className="mobile-back eyebrow" to="/tasks">
            ← TASKS
          </Link>
        )}
        {location.pathname === '/profile' && (
          <Link className="mobile-back eyebrow" to="/">
            ← TODAY
          </Link>
        )}
        {error && (
          <p className="feedback error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="feedback" role="status">
            {notice}
          </p>
        )}
        <Outlet />
      </main>
      <footer className="page-footer eyebrow">
        <span>
          {location.pathname === '/'
            ? 'TODAY / YOUR WORK. IN ORDER.'
            : location.pathname.includes('profile')
              ? 'ACCOUNT / PROFILE'
              : 'SMALLER STEPS. CLEARER WORK.'}
        </span>
        <span>SCAN THE DAY → CHOOSE A TASK → MOVE IT FORWARD</span>
      </footer>
      {!formPage && <Navigation bottom />}
    </div>
  );
}
