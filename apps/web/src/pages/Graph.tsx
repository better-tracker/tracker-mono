import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useSearchParams } from 'react-router';
import { useWorkspace } from '../features/workspace-context';
import { Button } from '../components/ui';
import { TASK_STATUSES } from '../data/constants';
import {
  deriveGraph,
  EMPTY_SELECTION,
  filterGraphTasks,
  PALETTE,
  reconcileSelection,
  visibleGraph,
  type Selection,
} from '../features/graph/graph';
import { GraphInspector } from '../features/graph/GraphInspector';
import { GraphList } from '../features/graph/GraphList';
import { RendererBoundary } from '../features/graph/RendererBoundary';
import '../features/graph/graph.css';

const GraphCanvas = lazy(() => import('../features/graph/GraphCanvas'));

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function Graph() {
  const { workspace, now } = useWorkspace();
  const [search, setSearch] = useSearchParams();
  const query = search.get('q') ?? '';
  const projectId = search.get('project') ?? '';
  const status = search.get('status') ?? '';
  const activeFilters = Boolean(query || projectId || status);
  const fullGraph = useMemo(
    () => deriveGraph(workspace, now),
    [workspace, now],
  );
  const tasks = useMemo(
    () => filterGraphTasks(workspace, { query, projectId, status }, now),
    [workspace, query, projectId, status, now],
  );
  const graph = useMemo(
    () => visibleGraph(fullGraph, tasks, activeFilters),
    [fullGraph, tasks, activeFilters],
  );
  const selectionKey = JSON.stringify([
    tasks.map((task) => task.id),
    workspace.subtasks.map((subtask) => [subtask.id, subtask.taskId]),
  ]);
  const [selectionState, setSelectionState] = useState(() => ({
    key: selectionKey,
    value: tasks[0]
      ? ({ taskId: tasks[0].id, subtaskId: null } as Selection)
      : EMPTY_SELECTION,
  }));
  let selection = selectionState.value;
  // Reconcile before committing this render so a cleared selection never returns
  // when filters are removed, even if multiple filter updates are batched.
  if (selectionState.key !== selectionKey) {
    selection = reconcileSelection(selection, tasks, workspace);
    setSelectionState({ key: selectionKey, value: selection });
  }
  const select = (value: Selection) =>
    setSelectionState({ key: selectionKey, value });
  const [mode, setMode] = useState<'graph' | 'list'>('graph');
  const [failed, setFailed] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const reducedMotion = useReducedMotion();
  const resetView = useCallback(() => {
    setAutoOrbit(false);
    setResetVersion((value) => value + 1);
  }, []);
  const rendererFailed = useCallback(() => {
    setFailed(true);
    setMode('list');
    setAutoOrbit(false);
  }, []);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearch(next, { replace: true });
  };
  const newTaskUrl = `/tasks/new${projectId ? `?${new URLSearchParams({ project: projectId })}` : ''}`;
  return (
    <section className="graph-page" aria-labelledby="graph-title">
      <header className="graph-heading">
        <div>
          <h1 id="graph-title">graph.</h1>
          <p className="graph-kicker">Workspace / tasks & subtasks</p>
        </div>
        <div className="graph-heading-summary">
          <p>{tasks.length} tasks. One perspective.</p>
          <span>
            {graph.nodes.filter((node) => node.kind === 'project').length}{' '}
            projects / {tasks.length} tasks /{' '}
            {graph.nodes.filter((node) => node.kind === 'subtask').length}{' '}
            subtasks
          </span>
        </div>
      </header>
      <div className="graph-toolbar">
        <label>
          <span className="graph-sr-only">Filter project</span>
          <select
            aria-label="Filter project"
            value={projectId}
            onChange={(event) => update('project', event.target.value)}
          >
            <option value="">All projects</option>
            {workspace.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="graph-sr-only">Filter status</span>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(event) => update('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {[...TASK_STATUSES, 'Overdue'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="graph-search">
          <span className="graph-sr-only">Search tasks</span>
          <input
            aria-label="Search tasks"
            type="search"
            value={query}
            placeholder="Find a task"
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
        <div
          className="graph-modes"
          role="group"
          aria-label="Graph display"
        >
          <button
            type="button"
            aria-pressed={mode === 'graph'}
            disabled={failed}
            onClick={() => setMode('graph')}
          >
            Graph
          </button>
          <button
            type="button"
            aria-pressed={mode === 'list'}
            onClick={() => setMode('list')}
          >
            List
          </button>
        </div>
        <Link to={newTaskUrl}>+ New Task</Link>
      </div>
      <div className="graph-layout">
        <section className="graph-main" aria-label="Work relationships">
          <div className="graph-section-title">
            <h2>01 / The relationships</h2>
            <span>
              {graph.nodes.length} nodes · {graph.edges.length} connections
            </span>
          </div>
          <div className="graph-camera-controls">
            <span>Perspective / free orbit</span>
            <div>
              <button
                type="button"
                aria-label="Automatic orbit"
                aria-pressed={autoOrbit && !reducedMotion}
                disabled={reducedMotion || failed}
                aria-describedby={
                  reducedMotion ? 'graph-motion-note' : undefined
                }
                onClick={() => setAutoOrbit((value) => !value)}
              >
                Orbit {autoOrbit && !reducedMotion ? 'on' : 'off'}
              </button>
              <button type="button" disabled={failed} onClick={resetView}>
                Reset View ↺
              </button>
            </div>
          </div>
          {reducedMotion && (
            <p id="graph-motion-note" className="graph-muted">
              Automatic orbit is off for reduced motion.
            </p>
          )}
          {failed && (
            <p role="status" className="graph-renderer-notice">
              The 3D view is unavailable. Your tasks are available in List view.
            </p>
          )}
          {!tasks.length && (
            <div className="graph-empty" role="status">
              <h3>
                {workspace.tasks.length || activeFilters
                  ? 'No tasks match these filters.'
                  : 'No tasks yet.'}
              </h3>
              <p>
                {workspace.tasks.length || activeFilters
                  ? 'Try a different title, project or status.'
                  : 'A clear next action starts here.'}
              </p>
              {workspace.tasks.length || activeFilters ? (
                <Button
                  variant="text"
                  type="button"
                  onClick={() => setSearch({})}
                >
                  Clear filters
                </Button>
              ) : (
                <Link to={newTaskUrl}>+ New Task</Link>
              )}
            </div>
          )}
          {!failed && (
            <div
              className="graph-canvas-wrap"
              hidden={mode !== 'graph' || !tasks.length}
            >
              <RendererBoundary onFailure={rendererFailed}>
                <Suspense
                  fallback={
                    <p role="status" className="graph-lazy">
                      Loading the interactive work graph…
                    </p>
                  }
                >
                  <GraphCanvas
                    graph={graph}
                    fullGraph={fullGraph}
                    selection={selection}
                    onSelect={select}
                    autoOrbit={autoOrbit && !reducedMotion && mode === 'graph'}
                    reducedMotion={reducedMotion}
                    resetVersion={resetVersion}
                    active={mode === 'graph' && !!tasks.length}
                    onFailure={rendererFailed}
                    onReset={resetView}
                  />
                </Suspense>
              </RendererBoundary>
            </div>
          )}
          {mode === 'list' && !!tasks.length && (
            <GraphList
              tasks={tasks}
              workspace={workspace}
              selection={selection}
              onSelect={select}
              now={now}
            />
          )}
          <div className="graph-legend" aria-label="Status colours">
            {(['Complete', 'In progress', 'Overdue', 'To do'] as const).map(
              (value) => (
                <span key={value}>
                  <i
                    className="graph-dot"
                    style={{ background: PALETTE[value] }}
                  />
                  {value}
                </span>
              ),
            )}
          </div>
          <p className="graph-help">
            Drag to orbit / right-drag to pan / scroll to zoom. Touch: one
            finger to orbit, two to pan or pinch. Use List for keyboard access
            at any zoom.
          </p>
        </section>
        <GraphInspector
          workspace={workspace}
          selection={selection}
          now={now}
        />
      </div>
    </section>
  );
}
