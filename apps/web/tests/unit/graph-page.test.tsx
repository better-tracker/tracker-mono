import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Graph from '../../src/pages/Graph';
import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from '../../src/features/workspace-context';
import { createLocalDataSource } from '../../src/data/local-source';
import { GRAPH_NOW, graphFixture } from '../fixtures/graph';
import type { Workspace } from '../../src/data/types';

const renderer = vi.hoisted(() => ({ fail: false }));
vi.mock('../../src/features/graph/GraphCanvas', () => ({
  default: ({
    onFailure,
    onSelect,
    selection,
  }: {
    onFailure: () => void;
    onSelect: (value: { taskId: string; subtaskId: null }) => void;
    selection: { taskId: string };
  }) => {
    if (renderer.fail) throw new Error('WebGL initialization failed');
    return (
      <div>
        <button onClick={onFailure}>Lose rendering context</button>
        <button
          onClick={() =>
            onSelect({ taskId: selection.taskId, subtaskId: null })
          }
        >
          Select graph task
        </button>
      </div>
    );
  },
}));

function view(workspace: Workspace, url = '/graph') {
  const value: WorkspaceContextValue = {
    workspace,
    now: GRAPH_NOW,
    source: createLocalDataSource(localStorage),
    busy: false,
    notice: '',
    error: '',
    run: vi.fn(),
  };
  return (
    <MemoryRouter initialEntries={[url]}>
      <WorkspaceContext.Provider value={value}>
        <Graph />
      </WorkspaceContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  renderer.fail = false;
  vi.stubGlobal(
    'matchMedia',
    vi
      .fn()
      .mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
  );
});

describe('graph page selection and navigation', () => {
  it('selects the first sorted task; shares subtask selection with the inspector and graph', async () => {
    const workspace = graphFixture();
    const user = userEvent.setup();
    render(view(workspace));
    const inspector = screen.getByRole('complementary', {
      name: 'Selected task',
    });
    expect(
      within(inspector).getByRole('heading', { level: 2 }),
    ).toHaveTextContent('Plan next milestone');
    await user.click(screen.getByRole('button', { name: 'List' }));
    const results = screen.getByRole('list', { name: 'Graph task results' });
    await user.click(
      within(results).getByRole('button', {
        name: /Review dashboard wireframes/,
      }),
    );
    expect(
      within(inspector).getByRole('link', { name: 'Open Task →' }),
    ).toHaveAttribute('href', `/tasks/${workspace.tasks[0]!.id}`);
    expect(within(inspector).getByText('2 / 5 done')).toBeVisible();
    expect(within(inspector).queryByRole('checkbox')).not.toBeInTheDocument();
    await user.click(
      within(results).getByRole('button', { name: /Audit desktop layout/ }),
    );
    expect(within(inspector).getByText('Selected subtask')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Graph' }));
    await user.click(
      await screen.findByRole('button', { name: 'Select graph task' }),
    );
    expect(
      within(inspector).queryByText('Selected subtask'),
    ).not.toBeInTheDocument();
  });
  it('clears hidden selection permanently, combines URL filters and preserves New Task project context', async () => {
    const workspace = graphFixture();
    const user = userEvent.setup();
    render(view(workspace));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter project' }),
      workspace.projects[0]!.id,
    );
    expect(screen.getByRole('link', { name: '+ New Task' })).toHaveAttribute(
      'href',
      `/tasks/new?project=${workspace.projects[0]!.id}`,
    );
    expect(
      screen.queryByRole('link', { name: 'Open Task →' }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'BUILD' },
    });
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter status' }),
      'Overdue',
    );
    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(
      within(
        screen.getByRole('list', { name: 'Graph task results' }),
      ).getAllByRole('button'),
    ).toHaveLength(6);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'no matches' },
    });
    expect(screen.getByText('No tasks match these filters.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(
      screen.queryByRole('link', { name: 'Open Task →' }),
    ).not.toBeInTheDocument();
  });
  it('follows workspace updates, clears a deleted subtask while retaining its parent, then clears a deleted task', async () => {
    const workspace = graphFixture(1);
    const user = userEvent.setup();
    const app = render(view(workspace));
    await user.click(screen.getByRole('button', { name: 'List' }));
    const results = screen.getByRole('list', { name: 'Graph task results' });
    await user.click(
      within(results).getByRole('button', { name: /Audit desktop layout/ }),
    );
    const changed = structuredClone(workspace);
    changed.tasks[0]!.title = 'Updated title';
    changed.subtasks.shift();
    app.rerender(view(changed));
    const inspector = screen.getByRole('complementary');
    expect(
      within(inspector).getByRole('heading', { level: 2 }),
    ).toHaveTextContent('Updated title');
    expect(
      within(inspector).queryByText('Selected subtask'),
    ).not.toBeInTheDocument();
    expect(within(inspector).getByText('1 / 4 done')).toBeVisible();
    app.rerender(view({ ...changed, tasks: [], subtasks: [] }));
    expect(
      screen.queryByRole('link', { name: 'Open Task →' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No tasks yet.')).toBeVisible();
  });
  it('handles zero subtasks and an initially empty filtered inspector', () => {
    const workspace = graphFixture(1, 0);
    const app = render(view(workspace));
    expect(screen.getByText('0 / 0 done')).toBeVisible();
    expect(screen.getByText('No subtasks yet.')).toBeVisible();
    app.unmount();
    render(view(workspace, '/graph?q=missing'));
    expect(
      screen.queryByRole('link', { name: 'Open Task →' }),
    ).not.toBeInTheDocument();
  });
});

describe('graph renderer resilience', () => {
  it.each(['initialization', 'context loss'])(
    'keeps filters, selection and task navigation after %s failure',
    async (failure) => {
      const user = userEvent.setup();
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderer.fail = failure === 'initialization';
      render(view(graphFixture()));
      if (failure === 'context loss')
        await user.click(
          await screen.findByRole('button', { name: 'Lose rendering context' }),
        );
      expect(await screen.findByText(/3D view is unavailable/)).toBeVisible();
      expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('link', { name: 'Open Task →' })).toBeVisible();
      expect(screen.getByRole('searchbox')).toBeEnabled();
      await user.click(
        within(
          screen.getByRole('list', { name: 'Graph task results' }),
        ).getByRole('button', { name: /Review dashboard wireframes/ }),
      );
      expect(
        within(screen.getByRole('complementary')).getByRole('heading', {
          level: 2,
        }),
      ).toHaveTextContent('Review dashboard wireframes');
      errors.mockRestore();
    },
  );
  it('disables automatic orbit for reduced motion with an explanation', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    render(view(graphFixture()));
    expect(
      screen.getByRole('button', { name: 'Automatic orbit' }),
    ).toBeDisabled();
    expect(
      screen.getByText('Automatic orbit is off for reduced motion.'),
    ).toBeVisible();
  });
});
