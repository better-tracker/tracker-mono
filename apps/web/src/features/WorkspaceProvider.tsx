import { getErrorMessage } from '@project-tracker/utils';
import { Actions, Button, Eyebrow } from '../components/ui';
import { cn } from '../components/ui/classes';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { WorkspaceContext } from './workspace-context';
import { WORKSPACE_CLOCK_INTERVAL_MS } from '../data/constants';
import type { FrontendDataSource, Workspace } from '../data/types';

export function WorkspaceProvider({
  source,
  children,
}: {
  source: FrontendDataSource;
  children: ReactNode;
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [now, setNow] = useState(() => new Date());
  const run = useCallback(
    async (operation: () => Promise<Workspace>, message: string) => {
      if (lock.current) return false;
      lock.current = true;
      setBusy(true);
      setError('');
      setNotice('');
      try {
        setWorkspace(await operation());
        setNotice(message);
        return true;
      } catch (value) {
        setError(
          getErrorMessage(value, 'Something went wrong. Please try again.'),
        );
        return false;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [],
  );
  useEffect(() => {
    let active = true;
    source
      .load()
      .then((value) => {
        if (active) setWorkspace(value);
      })
      .catch((value: unknown) => {
        if (active)
          setError(getErrorMessage(value, 'Unable to load demo data.'));
      });
    return () => {
      active = false;
    };
  }, [source]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(new Date()),
      WORKSPACE_CLOCK_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, []);
  if (!workspace)
    return (
      <main
        className={cn(
          'load-screen max-w-225 my-[10vh] mx-auto p-10 [&_h1]:text-[64px] [&_h1]:my-[30px] [&_h1]:mx-0',
          '[&_.actions]:mt-[30px]',
          'max-desktop:my-[8vh] max-desktop:mx-auto max-desktop:p-8 max-desktop:[&_h1]:text-[48px]',
        )}
      >
        <Eyebrow>PROJECT TRACKER / 001</Eyebrow>
        <h1>{error ? 'A SMALL SETBACK.' : 'MAKING ROOM.'}</h1>
        <p role={error ? 'alert' : 'status'}>
          {error || 'Loading your workspace…'}
        </p>
        {error && (
          <Actions>
            <Button
              disabled={busy}
              onClick={() => void run(() => source.load(), '')}
            >
              Retry
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    'Reset all saved demo projects, tasks and profile changes?',
                  )
                )
                  void run(() => source.reset(), 'Demo reset.');
              }}
            >
              Reset demo
            </Button>
          </Actions>
        )}
      </main>
    );
  return (
    <WorkspaceContext.Provider
      value={{ workspace, source, now, busy, notice, error, run }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
