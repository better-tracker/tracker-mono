import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { DEMO_EMAIL, DEMO_PASSWORD, hasSession, signIn } from '../data/session';
import { Dialog, Field } from '../components/UI';

export function Login() {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  if (hasSession()) return <Navigate to="/" replace />;
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
      setError(value instanceof Error ? value.message : 'Unable to sign in.');
    }
  }
  return (
    <div className="app-shell login-shell">
      <header className="site-header">
        <span className="brand">
          PROJECT TRACKER<span className="desktop-brand"> / 001</span>
        </span>
        <span className="eyebrow login-header-note">YOUR WORK. IN ORDER.</span>
        <span className="mobile-identity eyebrow">001</span>
      </header>
      <main className="login-grid">
        <section className="login-brand-panel">
          <p className="eyebrow">01 / A LITTLE SPACE TO FOCUS</p>
          <h1>
            MAKE
            <br />
            ROOM FOR
            <br />
            WORK.
          </h1>
          <p className="login-tagline">Less noise. A clearer next step.</p>
          <div className="routine">
            <p className="eyebrow">THE DAILY ROUTINE</p>
            {[
              'Find what matters.',
              'Break it into smaller steps.',
              'Move one thing forward.',
            ].map((text, index) => (
              <div key={text}>
                <span className="eyebrow">0{index + 1}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="login-account">
          <p className="eyebrow">
            <span className="desktop-only">02</span>
            <span className="mobile-only">01</span> / YOUR ACCOUNT
          </p>
          <h2>
            WELCOME
            <br />
            BACK.
          </h2>
          <p className="login-intro">
            <span className="desktop-only">
              Sign in to pick up where you left off.
            </span>
            <span className="mobile-only">
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
              <span className="password-field">
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  {show ? 'HIDE' : 'SHOW'}
                </button>
              </span>
            </Field>
            <div className="login-options">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Keep me signed in
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => setInfo('Password recovery')}
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <p className="feedback error" role="alert">
                {error}
              </p>
            )}
            <button className="sign-in" type="submit">
              SIGN IN →
            </button>
            <div className="login-new">
              <span>New to Project Tracker?</span>
              <button
                type="button"
                className="text-button"
                onClick={() => setInfo('Create account')}
              >
                Create account ↗
              </button>
            </div>
            <p className="demo-credentials">
              DEMO ACCOUNT / {DEMO_EMAIL}
              <br />
              PASSWORD / <strong>{DEMO_PASSWORD}</strong>
            </p>
          </form>
          <div className="mobile-only routine">
            <p className="eyebrow">MAKE ROOM FOR WORK.</p>
            <p>Plan small. Finish well.</p>
          </div>
        </section>
      </main>
      <footer className="page-footer eyebrow">
        <span>ACCOUNT / SIGN IN</span>
        <span>PLAN SMALL. FINISH WELL.</span>
      </footer>
      {info && (
        <Dialog title={info} onClose={() => setInfo('')}>
          <p>
            This is a browser demo. Account creation and password recovery are
            unavailable. Use the demo credentials to explore your workspace.
          </p>
          <button onClick={() => setInfo('')}>Back to sign in</button>
        </Dialog>
      )}
    </div>
  );
}
