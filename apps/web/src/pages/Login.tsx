import { useAuth0 } from '@auth0/auth0-react';
import { getErrorMessage } from '@project-tracker/utils';
import { AppFrame, SiteHeader, SiteFooter } from '../components/ui/AppFrame';
import {
  Button,
  CheckLabel,
  Dialog,
  Eyebrow,
  Feedback,
  Field,
} from '../components/ui';
import { cn } from '../components/ui/classes';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { DEMO_EMAIL, DEMO_PASSWORD, signIn } from '../data/session';
import LoginButtonAuth0 from '../components/LoginButtonAuth0';

export function Login() {
  const { isAuthenticated } = useAuth0();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  if (isAuthenticated) return <Navigate to="/" replace />;
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      signIn(email, password, remember);
      const state = location.state as { from?: string } | null;
      navigate(
        state?.from?.startsWith('/') && !state.from.startsWith('//')
          ? state.from
          : '/',
        { replace: true },
      );
    } catch (value) {
      setError(getErrorMessage(value, 'Unable to sign in.'));
    }
  }
  return (
    <AppFrame className="[&>.page-footer]:mt-[78px] max-desktop:pb-9">
      <SiteHeader>
        <span className="brand text-[14px] tracking-[0.08em] font-semibold leading-[1.4] uppercase max-desktop:text-[13px]">
          PROJECT TRACKER
          <span className="desktop-brand max-desktop:hidden"> / 001</span>
        </span>
        <Eyebrow
          className="login-header-note pr-0 max-desktop:hidden"
          as="span"
        >
          YOUR WORK. IN ORDER.
        </Eyebrow>
        <Eyebrow
          className="mobile-identity hidden max-desktop:block max-desktop:text-[13px] max-desktop:font-semibold max-desktop:tracking-[0.05em]"
          as="span"
        >
          001
        </Eyebrow>
      </SiteHeader>
      <main
        className={cn(
          'login-grid grid grid-cols-[minmax(0,_744fr)_minmax(0,_616fr)] gap-19 pt-10',
          'desktop:max-wide:gap-[70px]',
          'max-desktop:block max-desktop:pt-7',
        )}
      >
        <section
          className={cn(
            'login-brand-panel min-w-0 border-r-[1px] border-solid border-r-line pr-[58px] [&_h1]:text-[102px]',
            '[&_h1]:leading-[1.22] [&_h1]:tracking-[-0.06em] [&_h1]:mt-13 [&_h1]:ml-[-11px]',
            'desktop:max-wide:pr-[34px] desktop:max-wide:[&_h1]:text-[76px]',
            'max-desktop:hidden',
          )}
        >
          <Eyebrow>01 / A LITTLE SPACE TO FOCUS</Eyebrow>
          <h1>
            MAKE
            <br />
            ROOM FOR
            <br />
            WORK.
          </h1>
          <p className="login-tagline text-[28px] mt-6 mx-0 mb-10">
            Less noise. A clearer next step.
          </p>
          <div
            className={cn(
              'routine border-[1.5px] border-solid border-black p-6 [&_>_p:first-child]:mb-6 [&_>_div]:flex',
              '[&_>_div]:gap-[34px] [&_>_div]:py-2 [&_>_div]:px-0 [&_>_div]:border-b-[1px] [&_>_div]:border-solid',
              '[&_>_div]:border-b-black [&_>_div]:text-[24px] [&_>_div:last-child]:border-0',
              'max-desktop:[&_>_p:first-child]:mb-[18px] max-desktop:[&_>_p:last-child]:text-[21px]',
            )}
          >
            <Eyebrow>THE DAILY ROUTINE</Eyebrow>
            {[
              'Find what matters.',
              'Break it into smaller steps.',
              'Move one thing forward.',
            ].map((text, index) => (
              <div key={text}>
                <Eyebrow as="span">0{index + 1}</Eyebrow>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>
        <section
          className={cn(
            'login-account pt-4 pr-15 [&_h2]:text-[68px] [&_h2]:leading-[1.17] [&_h2]:tracking-[-0.06em]',
            '[&_h2]:mt-[30px] [&_h2]:mx-0 [&_h2]:mb-3 [&_h2]:ml-[-6px] [&_.field]:mb-[34px]',
            'desktop:max-wide:pr-0',
            'max-desktop:p-0 max-desktop:[&_>_.eyebrow]:text-[13px] max-desktop:[&_>_.eyebrow_.mobile-only]:inline',
            'max-desktop:[&_h2]:text-[72px] max-desktop:[&_h2]:leading-[1.12] max-desktop:[&_h2]:mt-8',
            'max-desktop:[&_h2]:mx-0 max-desktop:[&_h2]:mb-[14px] max-desktop:[&_h2]:ml-[-3px]',
            'max-desktop:[&_.field]:mb-[42px] max-desktop:[&_>_.routine]:mt-[30px] max-desktop:[&_>_.routine]:p-5',
            'max-phone:[&_h2]:text-[64px]',
          )}
        >
          <Eyebrow>
            <span className="desktop-only max-desktop:hidden">02</span>
            <span className="mobile-only hidden max-desktop:block">01</span> /
            YOUR ACCOUNT
          </Eyebrow>
          <h2>
            WELCOME
            <br />
            BACK.
          </h2>
          <p
            className={cn(
              'login-intro text-[21px] mb-9',
              'max-desktop:text-[24px] max-desktop:leading-[1.4] max-desktop:border-b-[4px] max-desktop:border-solid',
              'max-desktop:border-b-black max-desktop:pb-[34px] max-desktop:mb-10',
            )}
          >
            <span className="desktop-only max-desktop:hidden">
              Sign in to pick up where you left off.
            </span>
            <span className="mobile-only hidden max-desktop:block">
              A clearer next step starts here.
            </span>
          </p>
          <form onSubmit={submit}>
            <Field label="Email address">
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Password">
              <span
                className={cn(
                  'password-field flex min-w-0 [&_input]:border-r-0 [&_button]:shrink-[0] [&_button]:min-w-25',
                  '[&_button]:text-[12px] [&_button]:py-3 [&_button]:px-4',
                  'max-desktop:[&_button]:min-w-25 max-desktop:[&_button]:text-[13px]',
                )}
              >
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                  type="button"
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  {show ? 'HIDE' : 'SHOW'}
                </Button>
              </span>
            </Field>
            <div
              className={cn(
                'login-options flex justify-between items-center gap-5 text-[18px] [&_input:checked]:bg-transparent',
                'desktop:max-wide:flex-wrap',
                'max-desktop:flex max-desktop:flex-col max-desktop:gap-[26px] max-desktop:items-start',
                'max-desktop:text-[19px]',
              )}
            >
              <CheckLabel>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Keep me signed in
              </CheckLabel>
              <Button
                type="button"
                variant="text"
                className="text-[length:inherit]"
                onClick={() => setInfo('Password recovery')}
              >
                Forgot password?
              </Button>
            </div>
            {error && (
              <Feedback error role="alert">
                {error}
              </Feedback>
            )}
            <Button
              className={cn(
                'sign-in w-full mt-11 mx-0 mb-[30px] min-h-[66px]',
                'max-desktop:mt-10 max-desktop:mx-0 max-desktop:mb-[30px] max-desktop:min-h-15',
              )}
              type="submit"
            >
              SIGN IN →
            </Button>
            <LoginButtonAuth0 />
            <div className="login-new flex justify-between items-center gap-5 text-[18px] max-desktop:text-[18px] max-phone:text-[16px]">
              <span>New to Project Tracker?</span>
              <Button
                type="button"
                variant="text"
                className="text-[length:inherit]"
                onClick={() => setInfo('Create account')}
              >
                Create account ↗
              </Button>
            </div>
            <p className="demo-credentials text-[12px] tracking-[0.04em] leading-[1.6] mt-[30px] max-desktop:text-[11px] max-desktop:mt-[22px]">
              DEMO ACCOUNT / {DEMO_EMAIL}
              <br />
              PASSWORD / <strong>{DEMO_PASSWORD}</strong>
            </p>
          </form>
          <div
            className={cn(
              'mobile-only routine hidden',
              'max-desktop:block',
              'border-[1.5px] border-solid border-black p-6 [&_>_p:first-child]:mb-6 [&_>_div]:flex',
              '[&_>_div]:gap-[34px] [&_>_div]:py-2 [&_>_div]:px-0 [&_>_div]:border-b-[1px] [&_>_div]:border-solid',
              '[&_>_div]:border-b-black [&_>_div]:text-[24px] [&_>_div:last-child]:border-0',
              'max-desktop:[&_>_p:first-child]:mb-[18px] max-desktop:[&_>_p:last-child]:text-[21px]',
            )}
          >
            <Eyebrow>MAKE ROOM FOR WORK.</Eyebrow>
            <p>Plan small. Finish well.</p>
          </div>
        </section>
      </main>
      <SiteFooter>
        <span>ACCOUNT / SIGN IN</span>
        <span>PLAN SMALL. FINISH WELL.</span>
      </SiteFooter>
      {info && (
        <Dialog title={info} onClose={() => setInfo('')}>
          <p>
            This is a browser demo. Account creation and password recovery are
            unavailable. Use the demo credentials to explore your workspace.
          </p>
          <Button onClick={() => setInfo('')}>Back to sign in</Button>
        </Dialog>
      )}
    </AppFrame>
  );
}
