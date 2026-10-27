import { deadlineKey, localClock } from '../../data/dates';
import { getFilteredTasks } from '../../data/workspace-selectors';
import type { DemoTask, Workspace } from '../../data/types';

export const PALETTE = {
  'In progress': '#91A6A4',
  Complete: '#9AA57D',
  Overdue: '#BE8F68',
  'To do': '#BBB8AD',
  neutral: '#78786F',
};
export type Point3 = [number, number, number];
export type NodeKind = 'workspace' | 'project' | 'task' | 'subtask';
export interface GraphNode {
  id: string;
  entityId: string;
  kind: NodeKind;
  title: string;
  parentId?: string;
  taskId?: string;
  position: Point3;
  color: string;
}
export interface Graph {
  nodes: GraphNode[];
  edges: { source: string; target: string }[];
}
export interface GraphFilters {
  query: string;
  projectId: string;
  status: string;
}
export interface Selection {
  taskId: string | null;
  subtaskId: string | null;
}
export const EMPTY_SELECTION: Selection = { taskId: null, subtaskId: null };

export function isOverdue(task: DemoTask, now: Date, timezone: string) {
  const clock = localClock(now, timezone);
  const deadline = deadlineKey(task);
  return (
    task.status !== 'Complete' &&
    Boolean(deadline) &&
    deadline < `${clock.date}T${clock.time}`
  );
}

export function taskColor(task: DemoTask, now: Date, timezone: string) {
  return PALETTE[
    task.status === 'Complete'
      ? 'Complete'
      : isOverdue(task, now, timezone)
        ? 'Overdue'
        : task.status
  ];
}

// A node's coordinates depend only on its kind-qualified ID and ancestry.
// No sibling count, input ordering, labels, selection or filter participates.
function hash(id: string) {
  let value = 2166136261;
  for (const char of id)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

export function anchoredPosition(
  id: string,
  kind: NodeKind,
  anchor: Point3,
): Point3 {
  const angle = hash(`${id}:angle`) * Math.PI * 2;
  const depth = hash(`${id}:depth`) * 2 - 1;
  const radius =
    kind === 'project'
      ? 200 + hash(id) * 90
      : kind === 'task'
        ? 100 + hash(id) * 135
        : 35 + hash(id) * 60;
  return [
    anchor[0] + Math.cos(angle) * radius,
    anchor[1] + Math.sin(angle) * radius * 0.8,
    anchor[2] + depth * radius * 0.65,
  ];
}

export function deriveGraph(workspace: Workspace, now: Date): Graph {
  const nodes: GraphNode[] = [
    {
      id: 'workspace:root',
      entityId: 'root',
      kind: 'workspace',
      title: 'Workspace',
      position: [0, 0, 0],
      color: PALETTE.neutral,
    },
  ];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const add = (node: Omit<GraphNode, 'position'>) => {
    const parent = byId.get(node.parentId!);
    if (!parent) return;
    const value = {
      ...node,
      position: anchoredPosition(node.id, node.kind, parent.position),
    };
    nodes.push(value);
    byId.set(value.id, value);
  };
  for (const project of workspace.projects)
    add({
      id: `project:${project.id}`,
      entityId: project.id,
      kind: 'project',
      title: project.name,
      parentId: 'workspace:root',
      color: PALETTE.neutral,
    });
  for (const task of workspace.tasks)
    add({
      id: `task:${task.id}`,
      entityId: task.id,
      kind: 'task',
      title: task.title,
      parentId: `project:${task.projectId}`,
      taskId: task.id,
      color: taskColor(task, now, workspace.profile.timezone),
    });
  for (const subtask of workspace.subtasks)
    add({
      id: `subtask:${subtask.id}`,
      entityId: subtask.id,
      kind: 'subtask',
      title: subtask.title,
      parentId: `task:${subtask.taskId}`,
      taskId: subtask.taskId,
      color: PALETTE[subtask.completed ? 'Complete' : 'To do'],
    });
  nodes.sort((a, b) => a.id.localeCompare(b.id));
  return {
    nodes,
    edges: nodes.flatMap((node) =>
      node.parentId ? [{ source: node.parentId, target: node.id }] : [],
    ),
  };
}

export function filterGraphTasks(
  workspace: Workspace,
  filters: GraphFilters,
  now: Date,
) {
  const projects = new Map(
    workspace.projects.map((project) => [project.id, project.name]),
  );
  return getFilteredTasks(workspace.tasks, {
    ...filters,
    status: filters.status === 'Overdue' ? '' : filters.status,
  })
    .filter(
      (task) =>
        filters.status !== 'Overdue' ||
        isOverdue(task, now, workspace.profile.timezone),
    )
    .sort(
      (a, b) =>
        (projects.get(a.projectId) ?? '').localeCompare(
          projects.get(b.projectId) ?? '',
        ) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    );
}

export function visibleGraph(
  graph: Graph,
  tasks: readonly DemoTask[],
  activeFilters: boolean,
): Graph {
  const taskIds = new Set(tasks.map((task) => task.id));
  const projectIds = new Set(tasks.map((task) => `project:${task.projectId}`));
  const nodes = graph.nodes.filter(
    (node) =>
      node.kind === 'workspace' ||
      (node.kind === 'project'
        ? !activeFilters || projectIds.has(node.id)
        : taskIds.has(node.taskId!)),
  );
  const ids = new Set(nodes.map((node) => node.id));
  return {
    nodes,
    edges: graph.edges.filter(
      (edge) => ids.has(edge.source) && ids.has(edge.target),
    ),
  };
}

export function reconcileSelection(
  selection: Selection,
  tasks: readonly DemoTask[],
  workspace: Workspace,
): Selection {
  if (!tasks.some((task) => task.id === selection.taskId))
    return EMPTY_SELECTION;
  if (
    selection.subtaskId &&
    !workspace.subtasks.some(
      (subtask) =>
        subtask.id === selection.subtaskId &&
        subtask.taskId === selection.taskId,
    )
  )
    return { taskId: selection.taskId, subtaskId: null };
  return selection;
}

export function selectedBranch(graph: Graph, taskId: string | null) {
  const ids = new Set<string>();
  if (!taskId) return ids;
  const node = graph.nodes.find((item) => item.id === `task:${taskId}`);
  if (!node) return ids;
  ids.add(node.id);
  ids.add(node.parentId!);
  ids.add('workspace:root');
  graph.nodes.forEach((item) => {
    if (item.parentId === node.id) ids.add(item.id);
  });
  return ids;
}

export function zoomDetail(distance: number, scale = 1) {
  const t = Math.max(0, Math.min(1, (distance / scale - 1180) / (1650 - 1180)));
  const overview = t * t * (3 - 2 * t);
  return { opacity: 1 - overview, dotScale: 1 + overview * 2.3 };
}

export function openingView(graph: Graph, aspect: number) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of graph.nodes)
    node.position.forEach((value, index) => {
      min[index] = Math.min(min[index]!, value);
      max[index] = Math.max(max[index]!, value);
    });
  const target = min.map((value, index) => (value + max[index]!) / 2) as Point3;
  const halfWidth = (max[0]! - min[0]!) / 2 + 90;
  const halfHeight = (max[1]! - min[1]!) / 2 + 65;
  const halfDepth = (max[2]! - min[2]!) / 2;
  const distance = Math.max(
    1100,
    Math.max(halfHeight, halfWidth / Math.max(0.4, aspect)) /
      Math.tan(Math.PI / 10) +
      halfDepth,
  );
  return {
    target,
    position: [target[0], target[1], target[2] + distance] as Point3,
    scale: distance / 1100,
  };
}
