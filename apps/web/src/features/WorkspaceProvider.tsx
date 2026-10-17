import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { WorkspaceContext } from './workspace-context';
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
          value instanceof Error
            ? value.message
            : 'Something went wrong. Please try again.',
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
          setError(
            value instanceof Error
              ? value.message
              : 'Unable to load demo data.',
          );
      });
    return () => {
      active = false;
    };
  }, [source]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  if (!workspace)
    return (
      <main className="load-screen">
        <p className="eyebrow">PROJECT TRACKER / 001</p>
        <h1>{error ? 'A SMALL SETBACK.' : 'MAKING ROOM.'}</h1>
        <p role={error ? 'alert' : 'status'}>
          {error || 'Loading your workspace…'}
        </p>
        {error && (
          <div className="actions">
            <button
              disabled={busy}
              onClick={() => void run(() => source.load(), '')}
            >
              Retry
            </button>
            <button
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
            </button>
          </div>
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
