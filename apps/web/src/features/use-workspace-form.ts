import { getErrorMessage } from '@project-tracker/utils';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Workspace } from '../data/types';
import { useWorkspace } from './workspace-context';

type WorkspaceFormOptions = {
  validate: () => void;
  save: () => Promise<Workspace>;
  message: string;
  validationMessage: string;
  onSuccess?: () => void;
};

export function useWorkspaceForm(options: WorkspaceFormOptions) {
  const { busy, run } = useWorkspace();
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || submitting.current) return;

    setError('');
    try {
      options.validate();
    } catch (value) {
      setError(getErrorMessage(value, options.validationMessage));
      return;
    }

    submitting.current = true;
    try {
      if (await run(options.save, options.message)) {
        options.onSuccess?.();
      }
    } finally {
      submitting.current = false;
    }
  }

  return { submit, error, setError };
}
