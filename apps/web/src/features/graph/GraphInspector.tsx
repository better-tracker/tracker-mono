import { Link } from 'react-router';
import { getSubtaskSummary } from '../../data/workspace-selectors';
import { formatDeadline } from '../../data/dates';
import type { Workspace } from '../../data/types';
import { isOverdue, type Selection } from './graph';

export function GraphInspector({
  workspace,
  selection,
  now,
}: {
  workspace: Workspace;
  selection: Selection;
  now: Date;
}) {
  const task = workspace.tasks.find((item) => item.id === selection.taskId);
  const project = workspace.projects.find(
    (item) => item.id === task?.projectId,
  );
  const summary = getSubtaskSummary(workspace, task?.id);
  return (
    <aside className="graph-inspector" aria-label="Selected task">
      <div className="graph-section-title">02 / Selected task</div>
      {task ? (
        <>
          <p className="graph-kicker">{project?.name}</p>
          <h2>{task.title}</h2>
          <div className="graph-task-status">
            <span>{task.status}</span>
            {isOverdue(task, now, workspace.profile.timezone) && (
              <strong>Overdue</strong>
            )}
          </div>
          <dl className="graph-metadata">
            <div>
              <dt>Deadline</dt>
              <dd>{formatDeadline(task)}</dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>{project?.name}</dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>{task.assignee || 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{task.priority}</dd>
            </div>
          </dl>
          <div className="graph-subtask-summary">
            <h3>Subtasks</h3>
            <span>
              {summary.completed} / {summary.total} done
            </span>
          </div>
          <progress
            aria-label="Subtask completion"
            value={summary.completed}
            max={summary.total || 1}
          />
          {summary.total ? (
            <ul className="graph-inspector-subtasks">
              {summary.subtasks.map((subtask) => (
                <li
                  key={subtask.id}
                  className={
                    selection.subtaskId === subtask.id ? 'is-emphasized' : ''
                  }
                  aria-current={
                    selection.subtaskId === subtask.id ? 'true' : undefined
                  }
                >
                  <span
                    className={`graph-completion ${subtask.completed ? 'is-complete' : ''}`}
                    aria-label={subtask.completed ? 'Complete' : 'To do'}
                  >
                    {subtask.completed ? '✓' : '·'}
                  </span>
                  <span>
                    {subtask.title}
                    {selection.subtaskId === subtask.id && (
                      <small>Selected subtask</small>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="graph-muted">No subtasks yet.</p>
          )}
          <Link className="graph-open" to={`/tasks/${task.id}`}>
            Open Task →
          </Link>
        </>
      ) : (
        <p className="graph-inspector-empty">
          Select a task to see its details and smaller steps.
        </p>
      )}
    </aside>
  );
}
