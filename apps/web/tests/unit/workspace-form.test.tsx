import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalDataSource } from '../../src/data/local-source';
import { seedWorkspace } from '../../src/data/seed';
import type { Workspace } from '../../src/data/types';
import { WorkspaceProvider } from '../../src/features/WorkspaceProvider';
import { useWorkspace } from '../../src/features/workspace-context';
import { useWorkspaceForm } from '../../src/features/use-workspace-form';

const workspace = seedWorkspace(new Date('2026-10-05T22:00:00Z'));
type Options = Parameters<typeof useWorkspaceForm>[0];

function Editor({ options }: { options: Options }) {
  const { submit, error } = useWorkspaceForm(options);
  const { error: saveError } = useWorkspace();
  return (
    <form aria-label="Editor" onSubmit={(event) => void submit(event)}>
      <button type="submit">Save</button>
      {(error || saveError) && <p role="alert">{error || saveError}</p>}
    </form>
  );
}

async function renderEditor(
  save: Options['save'],
  validate: Options['validate'] = () => {},
) {
  const source = createLocalDataSource(localStorage);
  vi.spyOn(source, 'load').mockResolvedValue(workspace);
  const onSuccess = vi.fn();
  render(
    <WorkspaceProvider source={source}>
      <Editor
        options={{
          save,
          validate,
          onSuccess,
          message: 'Saved.',
          validationMessage: 'Check your input.',
        }}
      />
    </WorkspaceProvider>,
  );
  return {
    form: await screen.findByRole('form', { name: 'Editor' }),
    onSuccess,
  };
}

beforeEach(() => localStorage.clear());

describe('workspace form submission', () => {
  it('keeps invalid input out of the mutation handler and allows correction', async () => {
    const save = vi.fn().mockResolvedValue(workspace);
    const validate = vi.fn().mockImplementationOnce(() => {
      throw new Error('A title is required.');
    });
    const { form, onSuccess } = await renderEditor(save, validate);
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent('A title is required.');
    expect(save).not.toHaveBeenCalled();
    fireEvent.submit(form);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses the validation fallback for non-Error failures', async () => {
    const save = vi.fn().mockResolvedValue(workspace);
    const { form } = await renderEditor(save, () => {
      throw 'private details';
    });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent('Check your input.');
    expect(save).not.toHaveBeenCalled();
  });

  it('prevents concurrent submissions and releases the guard after saving', async () => {
    let complete!: (value: Workspace) => void;
    const pending = new Promise<Workspace>((resolve) => {
      complete = resolve;
    });
    const save = vi
      .fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValue(workspace);
    const { form, onSuccess } = await renderEditor(save);
    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    expect(save).toHaveBeenCalledOnce();
    expect(onSuccess).not.toHaveBeenCalled();
    await act(async () => complete(workspace));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    fireEvent.submit(form);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(2));
  });

  it('keeps failed mutations on the form and permits retry', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('Temporary save failure.'))
      .mockResolvedValue(workspace);
    const { form, onSuccess } = await renderEditor(save);
    fireEvent.submit(form);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Temporary save failure.',
    );
    expect(onSuccess).not.toHaveBeenCalled();
    fireEvent.submit(form);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(save).toHaveBeenCalledTimes(2);
  });
});
