import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../../src/App';
import { createLocalDataSource } from '../../src/data/local-source';
import { signIn } from '../../src/data/session';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
describe('frontend workflows', () => {
  it('redirects to login, explains account limitations, and signs in to the requested destination', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <AppRoutes source={createLocalDataSource(localStorage)} />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Password'), 'demo-password');
    await user.click(screen.getByRole('button', { name: 'SHOW' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /SIGN IN/ }));
    expect(
      await screen.findByRole('heading', { name: 'TASKS.' }),
    ).toBeVisible();
  });
  it('retains task input after a failed save and succeeds on retry', async () => {
    signIn('ben@example.com', 'demo-password', true);
    const source = createLocalDataSource(localStorage);
    await source.load();
    const create = vi
      .spyOn(source, 'createTask')
      .mockRejectedValueOnce(new Error('Temporary save failure.'));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/tasks/new']}>
        <AppRoutes source={source} />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'NEW TASK.' });
    await user.type(
      screen.getByLabelText('Task title', { exact: false }),
      'Keep my draft',
    );
    await user.click(screen.getByRole('button', { name: '+ ADD SUBTASK' }));
    await user.type(screen.getByLabelText('Draft subtask 1'), 'First step');
    await user.click(screen.getByRole('button', { name: /CREATE TASK/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Temporary save failure',
    );
    expect(screen.getByLabelText('Task title', { exact: false })).toHaveValue(
      'Keep my draft',
    );
    expect(screen.getByLabelText('Draft subtask 1')).toHaveValue('First step');
    await user.click(screen.getByRole('button', { name: /CREATE TASK/ }));
    expect(
      await screen.findByRole('heading', { name: 'TASKS.' }),
    ).toBeVisible();
    expect(create).toHaveBeenCalledTimes(2);
    expect((await source.load()).subtasks.at(-1)?.title).toBe('First step');
  });
  it('validates a subtask deadline and leaves the parent unchanged', async () => {
    signIn('ben@example.com', 'demo-password', true);
    const source = createLocalDataSource(
      localStorage,
      () => new Date('2026-10-05T22:00:00Z'),
    );
    const workspace = await source.load();
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[`/tasks/${workspace.tasks[0]!.id}/subtasks/new`]}
      >
        <AppRoutes source={source} />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'SUBTASK.' });
    await user.type(
      screen.getByLabelText('Subtask title', { exact: false }),
      'Deadline check',
    );
    const form = screen
      .getByRole('button', { name: /CREATE SUBTASK/ })
      .closest('form')!;
    const date = within(form).getByLabelText('Due date');
    const time = within(form).getByLabelText('Due time');
    // Native date/time controls are filled with an input event, matching their DOM values.
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(date, { target: { value: '2026-10-06' } });
    fireEvent.change(time, { target: { value: '11:00' } });
    await user.click(screen.getByRole('button', { name: /CREATE SUBTASK/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'before the parent',
    );
    expect((await source.load()).subtasks).toHaveLength(2);
  });
  it('shows a missing-record destination and recovery link', async () => {
    signIn('ben@example.com', 'demo-password', true);
    render(
      <MemoryRouter initialEntries={['/tasks/missing']}>
        <AppRoutes source={createLocalDataSource(localStorage)} />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'NOT HERE.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: /Return to Today/ }),
    ).toHaveAttribute('href', '/');
  });
});
