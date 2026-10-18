import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Dialog, Field, Heading } from '../components/UI';
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_MB,
  MAX_PROFILE_BIO_LENGTH,
  MAX_PROFILE_NAME_LENGTH,
} from '../data/constants';
import { signOut } from '../data/session';
import type { DemoProfile } from '../data/types';
import { validateProfile } from '../data/validation';
import { useWorkspace } from '../features/workspace-context';

export function Profile() {
  const { workspace, source, run, busy, error: saveError } = useWorkspace();
  const [form, setForm] = useState<DemoProfile>(() => ({
    ...workspace.profile,
  }));
  const [error, setError] = useState('');
  const [info, setInfo] = useState(false);
  const [reset, setReset] = useState(false);
  const navigate = useNavigate();
  const file = useRef<HTMLInputElement>(null);
  const patch = (input: Partial<DemoProfile>) =>
    setForm((value) => ({ ...value, ...input }));
  const initials = `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`;
  const timezones = [
    ...new Set([
      form.timezone,
      'Australia/Melbourne',
      'Australia/Sydney',
      'Australia/Perth',
      'UTC',
      'Europe/London',
      'America/New_York',
      'America/Los_Angeles',
      'Asia/Tokyo',
    ]),
  ];
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    try {
      validateProfile(form);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : 'Check your profile details.',
      );
      return;
    }
    await run(
      () => source.saveProfile(form),
      'Your profile and preferences are saved.',
    );
  }
  async function avatar(selected?: File) {
    if (!selected) return;
    if (
      !ALLOWED_AVATAR_TYPES.some((type) => type === selected.type) ||
      selected.size > MAX_AVATAR_SIZE_BYTES
    ) {
      setError(
        `Choose a PNG, JPEG or WebP image smaller than ${MAX_AVATAR_SIZE_MB} MB.`,
      );
      return;
    }
    try {
      const bitmap = await createImageBitmap(selected);
      bitmap.close();
      const reader = new FileReader();
      reader.onload = () => {
        patch({ avatar: String(reader.result) });
        setError('');
      };
      reader.onerror = () =>
        setError('Unable to read that image. Please choose another.');
      reader.readAsDataURL(selected);
    } catch {
      setError('Unable to open that image. Please choose another.');
    }
  }
  return (
    <>
      <Heading
        title="YOUR PROFILE."
        subtitle="ACCOUNT / PROFILE & PREFERENCES"
        mobileTitle="PROFILE."
        mobileSubtitle="ACCOUNT / YOUR DETAILS"
      />
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-identity">
            <div className="avatar">
              {form.avatar ? (
                <img src={form.avatar} alt="Your avatar" />
              ) : (
                <span>{initials}</span>
              )}
              <button
                type="button"
                className="avatar-edit"
                onClick={() => file.current?.click()}
              >
                EDIT AVATAR ↗
              </button>
            </div>
            <div>
              <h2>
                {form.firstName} {form.lastName}
              </h2>
              <p className="profile-email">{form.email}</p>
              <button
                type="button"
                className="mobile-only button"
                onClick={() => file.current?.click()}
              >
                EDIT AVATAR ↗
              </button>
            </div>
          </div>
          <input
            ref={file}
            type="file"
            accept={ALLOWED_AVATAR_TYPES.join(',')}
            aria-label="Choose avatar"
            hidden
            onChange={(event) => {
              void avatar(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          {form.avatar && (
            <button
              type="button"
              className="text-button"
              onClick={() => patch({ avatar: null })}
            >
              Remove avatar
            </button>
          )}
          <p className="eyebrow account-tag">PERSONAL ACCOUNT</p>
          <nav className="profile-section-nav" aria-label="Profile sections">
            <a href="#personal" className="button">
              01 / PROFILE
            </a>
            <a href="#preferences">02 / PREFERENCES</a>
            <button className="text-button" onClick={() => setInfo(true)}>
              PASSWORD & SECURITY ↗
            </button>
          </nav>
          <div className="profile-note">
            <h3>MAKE IT YOURS.</h3>
            <p>
              Your details keep your work
              <br />
              recognizable and on time.
            </p>
          </div>
        </aside>
        <form className="profile-form" onSubmit={(event) => void submit(event)}>
          <div id="personal" className="section-title">
            <h2 className="eyebrow">01 / PERSONAL DETAILS</h2>
            <span className="eyebrow">* REQUIRED</span>
          </div>
          <div className="form-row">
            <Field label="First name" required>
              <input
                required
                maxLength={MAX_PROFILE_NAME_LENGTH}
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) => patch({ firstName: event.target.value })}
              />
            </Field>
            <Field label="Last name" required>
              <input
                required
                maxLength={MAX_PROFILE_NAME_LENGTH}
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) => patch({ lastName: event.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Email address"
            required
            hint="Used to sign in and receive account updates."
          >
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) => patch({ email: event.target.value })}
            />
          </Field>
          <Field label="Bio">
            <textarea
              rows={3}
              maxLength={MAX_PROFILE_BIO_LENGTH}
              value={form.bio}
              onChange={(event) => patch({ bio: event.target.value })}
            />
          </Field>
          <div className="section-title preference-heading" id="preferences">
            <h2 className="eyebrow">02 / PREFERENCES</h2>
          </div>
          <div className="form-row">
            <Field label="Timezone">
              <select
                value={form.timezone}
                onChange={(event) => patch({ timezone: event.target.value })}
              >
                {timezones.map((zone) => (
                  <option value={zone} key={zone}>
                    {zone.replaceAll('_', ' ').replace('/', ' / ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Week starts on">
              <select
                value={form.weekStartsOn}
                onChange={(event) =>
                  patch({
                    weekStartsOn: event.target
                      .value as DemoProfile['weekStartsOn'],
                  })
                }
              >
                <option>Monday</option>
                <option>Sunday</option>
              </select>
            </Field>
          </div>
          <div className="notification-options">
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.assignmentEmails}
                onChange={(event) =>
                  patch({ assignmentEmails: event.target.checked })
                }
              />
              <span className="desktop-only">
                Email me when a task is assigned to me
              </span>
              <span className="mobile-only">Task assignment emails</span>
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.dailySummary}
                onChange={(event) =>
                  patch({ dailySummary: event.target.checked })
                }
              />
              <span className="desktop-only">
                Send a daily deadline summary
              </span>
              <span className="mobile-only">Daily deadline summary</span>
            </label>
          </div>
          {error && (
            <p className="feedback error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Link className="button cancel" to="/">
              CANCEL
            </Link>
            <button disabled={busy} type="submit">
              {busy ? 'SAVING…' : 'SAVE CHANGES →'}
            </button>
          </div>
        </form>
      </div>
      <section className="demo-settings">
        <span className="eyebrow">
          BROWSER DEMO / Preferences are saved locally. No emails are sent.
        </span>
        <div className="actions">
          <button onClick={() => setReset(true)} disabled={busy}>
            RESET DEMO
          </button>
          <button
            onClick={() => {
              try {
                signOut();
                navigate('/login', { replace: true });
              } catch {
                setError(
                  'Your browser blocked sign-out. Please allow site storage and retry.',
                );
              }
            }}
          >
            SIGN OUT →
          </button>
        </div>
      </section>
      {info && (
        <Dialog title="PASSWORD & SECURITY" onClose={() => setInfo(false)}>
          <p>
            This demo uses a fixed demo account. Password changes and real
            authentication will be available when the production account service
            is connected.
          </p>
          <button onClick={() => setInfo(false)}>Close</button>
        </Dialog>
      )}
      {reset && (
        <Dialog title="RESET DEMO?" onClose={() => setReset(false)}>
          <p>
            This will replace all saved demo projects, tasks, subtasks and
            profile changes with the original examples.
          </p>
          {saveError && (
            <p className="feedback error" role="alert">
              {saveError}
            </p>
          )}
          <div className="actions">
            <button disabled={busy} onClick={() => setReset(false)}>
              Cancel
            </button>
            <button
              disabled={busy}
              onClick={() => {
                void run(() => source.reset(), 'Demo reset.').then((ok) => {
                  if (ok) {
                    setReset(false);
                    navigate('/');
                  }
                });
              }}
            >
              Reset demo
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
