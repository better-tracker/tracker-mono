import { describe, expect, it } from 'vitest';
import {
  deriveGraph,
  filterGraphTasks,
  isOverdue,
  openingView,
  PALETTE,
  reconcileSelection,
  selectedBranch,
  taskColor,
  visibleGraph,
  zoomDetail,
} from '../../src/features/graph/graph';
import { GRAPH_NOW, graphFixture } from '../fixtures/graph';

const filters = { query: '', projectId: '', status: '' };

describe('graph hierarchy and stable positions', () => {
  it('uses real relationships and kind-qualified IDs, including empty projects and zero subtasks', () => {
    const workspace = graphFixture(1, 0);
    workspace.tasks[0]!.id = workspace.projects[0]!.id;
    const graph = deriveGraph(workspace, GRAPH_NOW);
    expect(graph.nodes).toHaveLength(5);
    expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(5);
    expect(graph.edges).toContainEqual({
      source: `project:${workspace.projects[0]!.id}`,
      target: `task:${workspace.tasks[0]!.id}`,
    });
    expect(
      graph.edges.filter((edge) => edge.source === 'workspace:root'),
    ).toHaveLength(3);
    expect(graph.nodes.find((node) => node.kind === 'task')?.entityId).toBe(
      workspace.tasks[0]!.id,
    );
  });
  it('keeps positions under reordered data, text/status/clock changes, filtering, and unrelated insertion/deletion', () => {
    const workspace = graphFixture();
    const graph = deriveGraph(workspace, GRAPH_NOW);
    const positions = new Map(
      graph.nodes.map((node) => [node.id, node.position]),
    );
    const changed = structuredClone(workspace);
    changed.projects.reverse();
    changed.tasks.reverse();
    changed.subtasks.reverse();
    changed.tasks[0]!.title = 'Renamed';
    changed.tasks[0]!.status = 'Complete';
    changed.tasks.push({ ...changed.tasks[0]!, id: 'unrelated' });
    changed.subtasks.pop();
    const updated = deriveGraph(changed, new Date('2030-01-01'));
    for (const node of updated.nodes)
      if (positions.has(node.id))
        expect(node.position).toEqual(positions.get(node.id));
    const filtered = visibleGraph(graph, [workspace.tasks[0]!], true);
    for (const node of filtered.nodes)
      expect(node.position).toEqual(positions.get(node.id));
    expect(selectedBranch(graph, workspace.tasks[0]!.id)).toContain(
      `task:${workspace.tasks[0]!.id}`,
    );
  });
  it('moves a reparented subtree without disturbing unrelated nodes', () => {
    const workspace = graphFixture();
    const before = deriveGraph(workspace, GRAPH_NOW);
    workspace.tasks[0]!.projectId = workspace.projects[1]!.id;
    const after = deriveGraph(workspace, GRAPH_NOW);
    for (const node of after.nodes) {
      const position = before.nodes.find(
        (item) => item.id === node.id,
      )!.position;
      if (node.taskId === workspace.tasks[0]!.id)
        expect(node.position).not.toEqual(position);
      else expect(node.position).toEqual(position);
    }
  });
});

describe('graph filtering and display status', () => {
  it('combines title-only search, project and stored status with AND; retains only ancestors and matching children', () => {
    const workspace = graphFixture();
    const task = workspace.tasks[2]!;
    const matches = filterGraphTasks(
      workspace,
      { query: 'BUILD TASK', projectId: task.projectId, status: 'To do' },
      GRAPH_NOW,
    );
    expect(matches.map((item) => item.id)).toEqual([task.id]);
    const graph = visibleGraph(
      deriveGraph(workspace, GRAPH_NOW),
      matches,
      true,
    );
    expect(graph.nodes).toHaveLength(8);
    expect(graph.nodes.filter((node) => node.kind === 'project')).toHaveLength(
      1,
    );
    expect(graph.nodes.filter((node) => node.kind === 'subtask')).toHaveLength(
      5,
    );
    expect(
      filterGraphTasks(
        workspace,
        { ...filters, query: 'Audit desktop' },
        GRAPH_NOW,
      ),
    ).toHaveLength(0);
    expect(
      filterGraphTasks(
        workspace,
        { ...filters, query: task.title, projectId: workspace.projects[2]!.id },
        GRAPH_NOW,
      ),
    ).toHaveLength(0);
  });
  it('matches stored status even when overdue; Complete wins and subtasks only use binary status', () => {
    const workspace = graphFixture();
    const overdue = workspace.tasks[2]!;
    expect(taskColor(overdue, GRAPH_NOW, workspace.profile.timezone)).toBe(
      PALETTE.Overdue,
    );
    expect(
      filterGraphTasks(
        workspace,
        { ...filters, status: 'To do' },
        GRAPH_NOW,
      ),
    ).toContain(overdue);
    expect(
      filterGraphTasks(
        workspace,
        { ...filters, status: 'Overdue' },
        GRAPH_NOW,
      ),
    ).toContain(overdue);
    overdue.status = 'Complete';
    expect(taskColor(overdue, GRAPH_NOW, workspace.profile.timezone)).toBe(
      PALETTE.Complete,
    );
    expect(
      filterGraphTasks(
        workspace,
        { ...filters, status: 'Overdue' },
        GRAPH_NOW,
      ),
    ).not.toContain(overdue);
    const colors = deriveGraph(workspace, GRAPH_NOW)
      .nodes.filter((node) => node.kind === 'subtask')
      .map((node) => node.color);
    expect(new Set(colors)).toEqual(
      new Set([PALETTE.Complete, PALETTE['To do']]),
    );
  });
  it('uses the workspace timezone and end-of-day convention; undated tasks are never overdue', () => {
    const task = graphFixture(1).tasks[0]!;
    task.dueDate = '2026-10-22';
    task.dueTime = '';
    expect(
      isOverdue(task, new Date('2026-10-22T12:59:00Z'), 'Australia/Melbourne'),
    ).toBe(false);
    expect(
      isOverdue(task, new Date('2026-10-22T13:00:00Z'), 'Australia/Melbourne'),
    ).toBe(true);
    task.dueTime = '11:00';
    expect(isOverdue(task, GRAPH_NOW, 'Australia/Melbourne')).toBe(false);
    expect(
      isOverdue(task, new Date('2026-10-22T00:01:00Z'), 'Australia/Melbourne'),
    ).toBe(true);
    expect(isOverdue(task, new Date('2026-10-22T00:01:00Z'), 'UTC')).toBe(
      false,
    );
    task.dueDate = '';
    expect(isOverdue(task, new Date('2030-01-01'), 'Australia/Melbourne')).toBe(
      false,
    );
  });
  it('sorts by project, title, then ID and reconciles selection without replacements', () => {
    const workspace = graphFixture();
    const tasks = filterGraphTasks(workspace, filters, GRAPH_NOW);
    expect(tasks[0]!.title).toBe('Plan next milestone');
    const selected = {
      taskId: workspace.tasks[0]!.id,
      subtaskId: workspace.subtasks[0]!.id,
    };
    expect(reconcileSelection(selected, [], workspace)).toEqual({
      taskId: null,
      subtaskId: null,
    });
    expect(
      reconcileSelection(selected, tasks, { ...workspace, subtasks: [] }),
    ).toEqual({ ...selected, subtaskId: null });
    expect(reconcileSelection(selected, tasks, workspace)).toEqual(selected);
    workspace.tasks.push({ ...workspace.tasks[0]!, id: 'a' });
    expect(
      filterGraphTasks(workspace, filters, GRAPH_NOW)
        .filter((task) => task.title === workspace.tasks[0]!.title)
        .map((task) => task.id),
    ).toEqual([workspace.tasks[0]!.id, 'a']);
  });
});

describe('graph camera detail', () => {
  it('smoothly fades between both thresholds with the same scaled interpolation', () => {
    for (const scale of [1, 2.5]) {
      expect(zoomDetail(1100 * scale, scale)).toEqual({
        opacity: 1,
        dotScale: 1,
      });
      expect(zoomDetail(1180 * scale, scale).opacity).toBe(1);
      expect(zoomDetail(1415 * scale, scale).opacity).toBeCloseTo(0.5);
      expect(zoomDetail(1650 * scale, scale).opacity).toBe(0);
      expect(zoomDetail(2200 * scale, scale).dotScale).toBeCloseTo(3.3);
    }
  });
  it('fits the full workspace and scales all opening distances uniformly', () => {
    const graph = deriveGraph(graphFixture(), GRAPH_NOW);
    const wide = openingView(graph, 1.6);
    const narrow = openingView(graph, 0.7);
    expect(narrow.scale).toBeGreaterThanOrEqual(wide.scale);
    expect(narrow.position[2] - narrow.target[2]).toBeCloseTo(
      1100 * narrow.scale,
    );
    expect(
      zoomDetail(narrow.position[2] - narrow.target[2], narrow.scale).opacity,
    ).toBe(1);
  });
});
