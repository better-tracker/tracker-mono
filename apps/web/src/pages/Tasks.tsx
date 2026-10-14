import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Confirm,
  Empty,
  Field,
  Heading,
  Missing,
  Status,
} from '../components/UI';
import { TaskRow } from '../components/TaskRow';
import { dateLabel, deadlineKey } from '../data/dates';
import type { DemoSubtask, TaskStatus } from '../data/types';
import { useWorkspace } from '../features/workspace-context';

export function Tasks() {
  const { workspace } = useWorkspace();
  const [search, setSearch] = useSearchParams();
  const query = search.get('q') ?? '';
  const project = search.get('project') ?? '';
  const status = search.get('status') ?? '';
  const priority = search.get('priority') ?? '';
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearch(next, { replace: true });
  };
  const tasks = workspace.tasks
    .filter(
      (task) =>
        task.title.toLowerCase().includes(query.toLowerCase()) &&
        (!project || task.projectId === project) &&
        (!status || task.status === status) &&
        (!priority || task.priority === priority),
    )
    .sort((a, b) =>
      (deadlineKey(a) || '9999').localeCompare(deadlineKey(b) || '9999'),
    );
  return (
    <>
      <Heading
        title="TASKS."
        subtitle="YOUR NEXT ACTION / SMALLER STEPS. CLEARER WORK."
      />
      <div className="toolbar">
        <p>One thing at a time.</p>
        <Link className="button" to="/tasks/new">
          + NEW TASK
        </Link>
      </div>
      <div className="filters">
        <Field label="Search tasks">
          <input
            type="search"
            value={query}
            onChange={(event) => update('q', event.target.value)}
            placeholder="Find your next step"
          />
        </Field>
        <Field label="Filter project">
          <select
            value={project}
            onChange={(event) => update('project', event.target.value)}
          >
            <option value="">All projects</option>
            {workspace.projects.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Filter status">
          <select
            value={status}
            onChange={(event) => update('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {['To do', 'In progress', 'Complete'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Filter priority">
          <select
            value={priority}
            onChange={(event) => update('priority', event.target.value)}
          >
            <option value="">All priorities</option>
            {['Low', 'Medium', 'High'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="section-title">
        <h2 className="eyebrow">01 / YOUR TASKS</h2>
        <span className="eyebrow">{tasks.length} TASKS</span>
      </div>
      {tasks.length ? (
        tasks.map((task) => <TaskRow key={task.id} task={task} showDate />)
      ) : (
        <Empty>
          <p>
            {workspace.tasks.length
              ? 'No tasks match these filters.'
              : 'No tasks yet. A clear next action starts here.'}
          </p>
          {workspace.tasks.length ? (
            <button onClick={() => setSearch({})}>Clear filters</button>
          ) : (
            <Link className="button" to="/tasks/new">
              + NEW TASK
            </Link>
          )}
        </Empty>
      )}
    </>
  );
}

export function TaskDetail() {
  const { id } = useParams();
  const { workspace, source, run, busy, error } = useWorkspace();
  const navigate = useNavigate();
  const [deleteTask, setDeleteTask] = useState(false);
  const [deleteSubtask, setDeleteSubtask] = useState<DemoSubtask | null>(null);
  const task = workspace.tasks.find((item) => item.id === id);
  if (!task) return <Missing />;
  const project = workspace.projects.find((item) => item.id === task.projectId);
  const subtasks = workspace.subtasks.filter((item) => item.taskId === task.id);
  return (
    <>
      <Heading
        title={task.title.toUpperCase()}
        subtitle={`TASKS / ${project?.name} / ONE TASK. SMALL STEPS.`}
      />
      <div className="toolbar">
        <Link className="text-link" to="/tasks">
          ← All tasks
        </Link>
        <div className="actions">
          <Link className="button" to={`/tasks/${task.id}/edit`}>
            EDIT TASK
          </Link>
          <button onClick={() => setDeleteTask(true)}>DELETE TASK</button>
        </div>
      </div>
      <div className="form-layout">
        <section className="main-form">
          <Status status={task.status} />
          <p className="detail-description">
            {task.description || 'Give this task a clear path to done.'}
          </p>
          <div className="section-title">
            <h2 className="eyebrow">01 / SMALLER STEPS</h2>
            <span className="eyebrow">
              {subtasks.filter((item) => item.completed).length} OF{' '}
              {subtasks.length} DONE
            </span>
          </div>
          {subtasks.length ? (
            subtasks.map((subtask) => (
              <article className="subtask-row" key={subtask.id}>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    disabled={busy}
                    onChange={() =>
                      void run(
                        () =>
                          source.updateSubtask(subtask.id, {
                            ...subtask,
                            completed: !subtask.completed,
                          }),
                        'Subtask updated.',
                      )
                    }
                  />
                  <span className={subtask.completed ? 'completed-text' : ''}>
                    {subtask.title}
                  </span>
                </label>
                {subtask.notes && <p>{subtask.notes}</p>}
                <div className="subtask-meta">
                  <span className="hint">
                    {subtask.assignee} / {subtask.priority}
                    {subtask.dueDate &&
                      ` / ${dateLabel(subtask.dueDate)} ${subtask.dueTime}`}
                  </span>
                  <div className="actions">
                    <Link to={`/tasks/${task.id}/subtasks/${subtask.id}/edit`}>
                      Edit ↗
                    </Link>
                    <button
                      className="text-button"
                      onClick={() => setDeleteSubtask(subtask)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <Empty>No smaller steps yet.</Empty>
          )}
          <Link
            className="button add-subtask-link"
            to={`/tasks/${task.id}/subtasks/new`}
          >
            + ADD SUBTASK
          </Link>
        </section>
        <aside className="context-panel detail-context">
          <h2 className="eyebrow">02 / TASK AT A GLANCE</h2>
          <Link to={`/projects/${task.projectId}`}>
            <h3>{project?.name} ↗</h3>
          </Link>
          <dl className="summary-list">
            <div>
              <dt>DUE</dt>
              <dd>
                {task.dueDate
                  ? `${dateLabel(task.dueDate)} / ${task.dueTime || 'END OF DAY'}`
                  : 'NO DEADLINE'}
              </dd>
            </div>
            <div>
              <dt>PRIORITY</dt>
              <dd>{task.priority}</dd>
            </div>
            <div>
              <dt>ASSIGNED TO</dt>
              <dd>{task.assignee}</dd>
            </div>
          </dl>
          <Field label="Task status">
            <select
              value={task.status}
              disabled={busy}
              onChange={(event) =>
                void run(
                  () =>
                    source.updateTask(task.id, {
                      ...task,
                      status: event.target.value as TaskStatus,
                    }),
                  'Task status updated.',
                )
              }
            >
              {['To do', 'In progress', 'Complete'].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <p className="hint">
            Subtasks track the steps. You decide when the task is done.
          </p>
        </aside>
      </div>
      {deleteTask && (
        <Confirm
          error={error}
          title="DELETE TASK?"
          message={`Delete “${task.title}” and all its subtasks? This cannot be undone.`}
          busy={busy}
          onClose={() => setDeleteTask(false)}
          onConfirm={() => {
            void run(
              () => source.deleteTask(task.id),
              'Task and its subtasks deleted.',
            ).then((ok) => {
              if (ok) navigate('/tasks');
            });
          }}
        />
      )}
      {deleteSubtask && (
        <Confirm
          error={error}
          title="DELETE SUBTASK?"
          message={`Delete “${deleteSubtask.title}”? This cannot be undone.`}
          busy={busy}
          onClose={() => setDeleteSubtask(null)}
          onConfirm={() => {
            void run(
              () => source.deleteSubtask(deleteSubtask.id),
              'Subtask deleted.',
            ).then((ok) => {
              if (ok) setDeleteSubtask(null);
            });
          }}
        />
      )}
    </>
  );
}
