import { AppFrame, SiteHeader, SiteFooter } from './ui/AppFrame';
import { Navigation } from './Navigation';
import { Feedback } from './ui';
import { cn } from './ui/classes';
import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useWorkspace } from '../features/workspace-context';

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
    <AppFrame
      className={location.pathname === '/graph' ? 'graph-shell' : undefined}
    >
      <a
        className="skip-link fixed z-[20] left-6 top-[-100px] p-4 bg-paper border-[2px] border-solid border-black [&:focus]:top-4"
        href="#content"
      >
        Skip to content
      </a>
      <SiteHeader>
        <Link
          className="brand text-[14px] tracking-[0.08em] font-semibold leading-[1.4] uppercase max-desktop:text-[13px]"
          to="/"
        >
          PROJECT TRACKER
          <span className="desktop-brand max-desktop:hidden"> / 001</span>
        </Link>
        <Navigation />
        <Link
          to="/profile"
          className="mobile-identity hidden max-desktop:block max-desktop:text-[13px] max-desktop:font-semibold max-desktop:tracking-[0.05em]"
          aria-label="Your profile"
        >
          {initials}
        </Link>
      </SiteHeader>
      <main id="content" tabIndex={-1}>
        {formPage && (
          <Link
            className={cn(
              'mobile-back eyebrow hidden',
              'max-desktop:inline-block max-desktop:mt-[26px] max-desktop:mx-0 max-desktop:mb-[-10px]',
              'max-desktop:text-[13px]',
              'text-[14px] tracking-[0.08em] font-semibold leading-[1.4] uppercase',
            )}
            to="/tasks"
          >
            ← TASKS
          </Link>
        )}
        {location.pathname === '/profile' && (
          <Link
            className={cn(
              'mobile-back eyebrow hidden',
              'max-desktop:inline-block max-desktop:mt-[26px] max-desktop:mx-0 max-desktop:mb-[-10px]',
              'max-desktop:text-[13px]',
              'text-[14px] tracking-[0.08em] font-semibold leading-[1.4] uppercase',
            )}
            to="/"
          >
            ← TODAY
          </Link>
        )}
        {error && (
          <Feedback error role="alert">
            {error}
          </Feedback>
        )}
        {notice && <Feedback role="status">{notice}</Feedback>}
        <Outlet />
      </main>
      <SiteFooter>
        <span>
          {location.pathname === '/'
            ? 'TODAY / YOUR WORK. IN ORDER.'
            : location.pathname.includes('profile')
              ? 'ACCOUNT / PROFILE'
              : 'SMALLER STEPS. CLEARER WORK.'}
        </span>
        <span>SCAN THE DAY → CHOOSE A TASK → MOVE IT FORWARD</span>
      </SiteFooter>
      {!formPage && <Navigation bottom />}
    </AppFrame>
  );
}
