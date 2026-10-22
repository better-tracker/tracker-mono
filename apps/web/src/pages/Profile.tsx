import { getErrorMessage } from '@project-tracker/utils';
import { readAvatar } from '../data/avatar';
import { useWorkspaceForm } from '../features/use-workspace-form';
import {
  Actions,
  Button,
  ButtonAnchor,
  ButtonLink,
  CheckLabel,
  Dialog,
  Eyebrow,
  Feedback,
  Field,
  FormActions,
  FormRow,
  Heading,
  SectionTitle,
} from '../components/ui';
import { cn } from '../components/ui/classes';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ALLOWED_AVATAR_TYPES,
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
  const { submit, error, setError } = useWorkspaceForm({
    validate: () => validateProfile(form),
    save: () => source.saveProfile(form),
    message: 'Your profile and preferences are saved.',
    validationMessage: 'Check your profile details.',
  });
  async function avatar(selected?: File) {
    if (!selected) return;
    try {
      patch({ avatar: await readAvatar(selected) });
      setError('');
    } catch (value) {
      setError(
        getErrorMessage(
          value,
          'Unable to open that image. Please choose another.',
        ),
      );
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
      <div
        className={cn(
          'profile-layout grid grid-cols-[minmax(0,_396fr)_minmax(0,_924fr)] gap-29 pt-13',
          'desktop:max-wide:gap-[55px]',
          'max-desktop:block max-desktop:pt-[38px]',
        )}
      >
        <aside className="profile-sidebar min-w-0">
          <div
            className={cn(
              'profile-identity [&_h2]:text-[43px] [&_h2]:tracking-[-0.04em] [&_h2]:mt-[26px] [&_h2]:mx-0',
              '[&_h2]:mb-[10px] [&_h2]:wrap-anywhere',
              'max-desktop:flex max-desktop:gap-5 max-desktop:items-start max-desktop:[&_>_div:last-child]:flex-[1]',
              'max-desktop:[&_>_div:last-child]:min-w-0 max-desktop:[&_h2]:text-[26px] max-desktop:[&_h2]:mt-[10px]',
              'max-desktop:[&_h2]:mx-0 max-desktop:[&_h2]:mb-4 max-desktop:[&_.button]:flex',
              'max-desktop:[&_.button]:min-h-12 max-desktop:[&_.button]:w-full max-desktop:[&_.button]:text-[11.5px]',
              'max-desktop:[&_.button]:p-[10px]',
            )}
          >
            <div
              className={cn(
                'avatar h-43 border-[1.5px] border-solid border-black relative flex items-center py-6 px-[30px]',
                'overflow-hidden [&_>_span]:text-[112px] [&_>_span]:tracking-[-0.05em] [&_img]:w-full [&_img]:h-full',
                '[&_img]:object-contain',
                'max-desktop:w-[90px] max-desktop:h-[90px] max-desktop:shrink-[0] max-desktop:p-3',
                'max-desktop:[&_>_span]:text-[46px]',
              )}
            >
              {form.avatar ? (
                <img src={form.avatar} alt="Your avatar" />
              ) : (
                <span>{initials}</span>
              )}
              <Button
                type="button"
                className="avatar-edit absolute right-5 bottom-3 p-0 min-h-6 text-[11px] border-0 bg-paper max-desktop:hidden"
                onClick={() => file.current?.click()}
              >
                EDIT AVATAR ↗
              </Button>
            </div>
            <div>
              <h2>
                {form.firstName} {form.lastName}
              </h2>
              <p className="profile-email text-[21px] wrap-anywhere max-desktop:hidden">
                {form.email}
              </p>
              <Button
                type="button"
                className="mobile-only hidden max-desktop:block"
                onClick={() => file.current?.click()}
              >
                EDIT AVATAR ↗
              </Button>
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
            <Button
              type="button"
              variant="text"
              className="text-[length:inherit]"
              onClick={() => patch({ avatar: null })}
            >
              Remove avatar
            </Button>
          )}
          <Eyebrow className="account-tag inline-block text-[12px]/[1.4] py-[7px] px-[10px] mt-6 max-desktop:hidden">
            PERSONAL ACCOUNT
          </Eyebrow>
          <nav
            className={cn(
              'profile-section-nav border-t-[1px] border-solid border-t-black mt-11 pt-[26px] flex flex-col',
              'gap-[22px] [&_a]:text-left [&_a]:justify-start [&_a]:text-[14px] [&_a]:font-semibold',
              '[&_a]:tracking-[0.08em] [&_a]:py-[18px] [&_a]:px-5 [&_button]:text-left [&_button]:justify-start',
              '[&_button]:text-[14px] [&_button]:font-semibold [&_button]:tracking-[0.08em] [&_button]:py-[18px]',
              '[&_button]:px-5 [&_.text-button]:no-underline [&_.text-button]:pt-0',
              'max-desktop:hidden',
            )}
            aria-label="Profile sections"
          >
            <ButtonAnchor href="#personal">01 / PROFILE</ButtonAnchor>
            <a href="#preferences">02 / PREFERENCES</a>
            <Button
              variant="text"
              className="text-[length:inherit]"
              onClick={() => setInfo(true)}
            >
              PASSWORD & SECURITY ↗
            </Button>
          </nav>
          <div
            className={cn(
              'profile-note mt-17 [&_h3]:text-[38px] [&_h3]:tracking-[-0.04em] [&_h3]:mb-6 [&_p]:text-[20px]',
              '[&_p]:leading-[1.4]',
              'max-desktop:hidden',
            )}
          >
            <h3>MAKE IT YOURS.</h3>
            <p>
              Your details keep your work
              <br />
              recognizable and on time.
            </p>
          </div>
        </aside>
        <form
          className={cn(
            'profile-form border-l-[1px] border-solid border-l-line pl-14 ml-[-56px] min-w-0',
            '[&_>_.section-title:first-child]:mb-[38px] [&_.field]:mb-[38px]',
            'max-desktop:border-0 max-desktop:p-0 max-desktop:mt-11 max-desktop:mx-0 max-desktop:mb-0',
            'max-desktop:[&_>_.section-title:first-child]:mb-[30px]',
            'max-desktop:[&_>_.section-title:first-child_>_span]:hidden max-desktop:[&_.field]:mb-6',
          )}
          onSubmit={(event) => void submit(event)}
        >
          <SectionTitle id="personal">
            <Eyebrow as="h2">01 / PERSONAL DETAILS</Eyebrow>
            <Eyebrow as="span">* REQUIRED</Eyebrow>
          </SectionTitle>
          <FormRow>
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
          </FormRow>
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
          <SectionTitle
            className={cn(
              'preference-heading border-b-[1px] border-solid border-b-black pt-3 px-0 pb-7 mb-8',
              'max-desktop:pt-[2px] max-desktop:pb-[22px]',
            )}
            id="preferences"
          >
            <Eyebrow as="h2">02 / PREFERENCES</Eyebrow>
          </SectionTitle>
          <FormRow>
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
          </FormRow>
          <div
            className={cn(
              'notification-options flex flex-col gap-6 mt-[10px] mx-0 mb-10 [&_input:checked]:bg-transparent',
              'max-desktop:gap-7 max-desktop:mt-[10px] max-desktop:text-[17px]',
            )}
          >
            <CheckLabel>
              <input
                type="checkbox"
                checked={form.assignmentEmails}
                onChange={(event) =>
                  patch({ assignmentEmails: event.target.checked })
                }
              />
              <span className="desktop-only max-desktop:hidden">
                Email me when a task is assigned to me
              </span>
              <span className="mobile-only hidden max-desktop:block">
                Task assignment emails
              </span>
            </CheckLabel>
            <CheckLabel>
              <input
                type="checkbox"
                checked={form.dailySummary}
                onChange={(event) =>
                  patch({ dailySummary: event.target.checked })
                }
              />
              <span className="desktop-only max-desktop:hidden">
                Send a daily deadline summary
              </span>
              <span className="mobile-only hidden max-desktop:block">
                Daily deadline summary
              </span>
            </CheckLabel>
          </div>
          {error && (
            <Feedback error role="alert">
              {error}
            </Feedback>
          )}
          <FormActions>
            <ButtonLink className="cancel" to="/">
              CANCEL
            </ButtonLink>
            <Button disabled={busy} type="submit">
              {busy ? 'SAVING…' : 'SAVE CHANGES →'}
            </Button>
          </FormActions>
        </form>
      </div>
      <section
        className={cn(
          'demo-settings flex items-center justify-between border-t-[1px] border-solid border-t-line pt-6',
          'mt-[38px] gap-6 [&_.eyebrow]:text-[11px] [&_.eyebrow]:max-w-150',
          'max-desktop:block max-desktop:mt-4 max-desktop:[&_.actions]:mt-5 max-desktop:[&_.eyebrow]:text-[10px]',
        )}
      >
        <Eyebrow as="span">
          BROWSER DEMO / Preferences are saved locally. No emails are sent.
        </Eyebrow>
        <Actions>
          <Button onClick={() => setReset(true)} disabled={busy}>
            RESET DEMO
          </Button>
          <Button
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
          </Button>
        </Actions>
      </section>
      {info && (
        <Dialog title="PASSWORD & SECURITY" onClose={() => setInfo(false)}>
          <p>
            This demo uses a fixed demo account. Password changes and real
            authentication will be available when the production account service
            is connected.
          </p>
          <Button onClick={() => setInfo(false)}>Close</Button>
        </Dialog>
      )}
      {reset && (
        <Dialog title="RESET DEMO?" onClose={() => setReset(false)}>
          <p>
            This will replace all saved demo projects, tasks, subtasks and
            profile changes with the original examples.
          </p>
          {saveError && (
            <Feedback error role="alert">
              {saveError}
            </Feedback>
          )}
          <Actions>
            <Button disabled={busy} onClick={() => setReset(false)}>
              Cancel
            </Button>
            <Button
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
            </Button>
          </Actions>
        </Dialog>
      )}
    </>
  );
}
