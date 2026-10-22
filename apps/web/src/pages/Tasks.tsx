import {
  getFilteredTasks,
  getSubtaskSummary,
} from '../data/workspace-selectors';
import {
  Actions,
  Button,
  ButtonLink,
  CheckLabel,
  Confirm,
  ContextPanel,
  Empty,
  Eyebrow,
  Field,
  FormLayout,
  Heading,
  Hint,
  Missing,
  SectionTitle,
  Status,
  SummaryList,
  Toolbar,
} from '../components/ui';
import { cn } from '../components/ui/classes';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { TaskRow } from '../components/TaskRow';
import { TASK_PRIORITIES, TASK_STATUSES } from '../data/constants';
import { dateLabel, formatDeadline } from '../data/dates';
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
  const tasks = getFilteredTasks(workspace.tasks, {
    query,
    projectId: project,
    status,
    priority,
  });
  return (
    <>
      <Heading
        title="TASKS."
        subtitle="YOUR NEXT ACTION / SMALLER STEPS. CLEARER WORK."
      />
      <Toolbar>
        <p>One thing at a time.</p>
        <ButtonLink to="/tasks/new">+ NEW TASK</ButtonLink>
      </Toolbar>
      <div
        className={cn(
          'filters grid grid-cols-[2fr_1.3fr_1fr_1fr] gap-6 mb-5',
          'desktop:max-wide:grid-cols-[repeat(2,_minmax(0,_1fr))]',
          'max-desktop:grid-cols-[repeat(2,_minmax(0,_1fr))] max-desktop:gap-[0_16px]',
          'max-desktop:[&_.field:first-child]:col-[1_/_-1] max-desktop:[&_.field]:mb-6',
          'max-desktop:[&_.eyebrow]:text-[11px] max-desktop:[&_select]:text-[16px]',
          'max-desktop:[&_select]:pl-[10px]',
        )}
      >
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
            {TASK_STATUSES.map((item) => (
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
            {TASK_PRIORITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>
      <SectionTitle>
        <Eyebrow as="h2">01 / YOUR TASKS</Eyebrow>
        <Eyebrow as="span">{tasks.length} TASKS</Eyebrow>
      </SectionTitle>
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
            <Button onClick={() => setSearch({})}>Clear filters</Button>
          ) : (
            <ButtonLink to="/tasks/new">+ NEW TASK</ButtonLink>
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
  const { subtasks, completed: completedSubtasks } = getSubtaskSummary(
    workspace,
    task.id,
  );
  return (
    <>
      <Heading
        title={task.title.toUpperCase()}
        subtitle={`TASKS / ${project?.name} / ONE TASK. SMALL STEPS.`}
      />
      <Toolbar>
        <Link
          className="text-link underline underline-offset-[4px]"
          to="/tasks"
        >
          ← All tasks
        </Link>
        <Actions>
          <ButtonLink to={`/tasks/${task.id}/edit`}>EDIT TASK</ButtonLink>
          <Button onClick={() => setDeleteTask(true)}>DELETE TASK</Button>
        </Actions>
      </Toolbar>
      <FormLayout>
        <section
          className={cn(
            'main-form min-w-0 pr-[50px] border-r-[1px] border-solid border-r-line [&_>_.section-title]:mb-[30px]',
            'desktop:max-wide:pr-[30px]',
            'max-desktop:border-0 max-desktop:p-0 max-desktop:[&_>_.section-title]:mb-[30px]',
          )}
        >
          <Status status={task.status} />
          <p className="detail-description leading-[1.6] mt-6 mx-0 mb-10 whitespace-pre-wrap">
            {task.description || 'Give this task a clear path to done.'}
          </p>
          <SectionTitle>
            <Eyebrow as="h2">01 / SMALLER STEPS</Eyebrow>
            <Eyebrow as="span">
              {completedSubtasks} OF {subtasks.length} DONE
            </Eyebrow>
          </SectionTitle>
          {subtasks.length ? (
            subtasks.map((subtask) => (
              <article
                className={cn(
                  'subtask-row border-b-[1px] border-solid border-b-line py-[22px] px-0 [&_>_p]:mt-3 [&_>_p]:mr-0',
                  '[&_>_p]:mb-3 [&_>_p]:ml-9 [&_>_p]:leading-[1.5] [&_>_p]:whitespace-pre-wrap',
                )}
                key={subtask.id}
              >
                <CheckLabel>
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
                  <span className={subtask.completed ? 'line-through' : ''}>
                    {subtask.title}
                  </span>
                </CheckLabel>
                {subtask.notes && <p>{subtask.notes}</p>}
                <div
                  className={cn(
                    'subtask-meta flex items-center justify-between gap-[18px] mt-4 mr-0 mb-0 ml-9',
                    '[&_.actions]:text-[14px]',
                    'max-desktop:block max-desktop:[&_.actions]:mt-3',
                  )}
                >
                  <Hint>
                    {subtask.assignee} / {subtask.priority}
                    {subtask.dueDate &&
                      ` / ${dateLabel(subtask.dueDate)} ${subtask.dueTime}`}
                  </Hint>
                  <Actions>
                    <Link to={`/tasks/${task.id}/subtasks/${subtask.id}/edit`}>
                      Edit ↗
                    </Link>
                    <Button
                      variant="text"
                      className="text-[length:inherit]"
                      onClick={() => setDeleteSubtask(subtask)}
                    >
                      Delete
                    </Button>
                  </Actions>
                </div>
              </article>
            ))
          ) : (
            <Empty>No smaller steps yet.</Empty>
          )}
          <ButtonLink
            className="add-subtask-link mt-[26px]"
            to={`/tasks/${task.id}/subtasks/new`}
          >
            + ADD SUBTASK
          </ButtonLink>
        </section>
        <ContextPanel className="detail-context">
          <Eyebrow as="h2">02 / TASK AT A GLANCE</Eyebrow>
          <Link to={`/projects/${task.projectId}`}>
            <h3>{project?.name} ↗</h3>
          </Link>
          <SummaryList>
            <div>
              <dt>DUE</dt>
              <dd>
                {formatDeadline(task, {
                  endOfDay: 'END OF DAY',
                  noDeadline: 'NO DEADLINE',
                })}
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
          </SummaryList>
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
              {TASK_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <Hint as="p">
            Subtasks track the steps. You decide when the task is done.
          </Hint>
        </ContextPanel>
      </FormLayout>
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
