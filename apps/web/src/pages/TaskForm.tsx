import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Assignee,
  DeadlineFields,
  PriorityField,
} from '../components/TaskFields';
import { Empty, Field, Heading, Missing } from '../components/UI';
import {
  MAX_SUBTASK_TITLE_LENGTH,
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASK_TITLE_LENGTH,
} from '../data/constants';
import { dateLabel, localClock } from '../data/dates';
import type { SubtaskInput, TaskInput } from '../data/types';
import { validateTask } from '../data/validation';
import { useWorkspace } from '../features/workspace-context';

export function TaskForm() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const { workspace, source, run, busy, now } = useWorkspace();
  const existing = workspace.tasks.find((task) => task.id === id);
  const fullName = `${workspace.profile.firstName} ${workspace.profile.lastName}`;
  const [form, setForm] = useState<TaskInput>(() =>
    existing
      ? { ...existing }
      : {
          title: '',
          projectId: search.get('project') ?? workspace.projects[0]?.id ?? '',
          assignee: fullName,
          description: '',
          priority: 'High',
          status: 'To do',
          dueDate: '',
          dueTime: '',
        },
  );
  const [drafts, setDrafts] = useState<{ key: string; title: string }[]>([]);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const navigate = useNavigate();
  const project = workspace.projects.find((item) => item.id === form.projectId);
  const patch = (input: Partial<TaskInput>) =>
    setForm((value) => ({ ...value, ...input }));
  if (id && !existing) return <Missing />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    try {
      validateTask(form);
      if (drafts.some((draft) => !draft.title.trim()))
        throw new Error(
          'Give every draft subtask a title, or remove the empty draft.',
        );
    } catch (value) {
      setError(
        value instanceof Error ? value.message : 'Check your task details.',
      );
      return;
    }
    const inputs: SubtaskInput[] = drafts.map((draft) => ({
      title: draft.title,
      notes: '',
      assignee: form.assignee,
      priority: form.priority,
      dueDate: '',
      dueTime: '',
      completed: false,
    }));
    submitting.current = true;
    const ok = await run(
      () =>
        existing
          ? source.updateTask(existing.id, form)
          : source.createTask(form, inputs),
      existing ? 'Task saved.' : 'Task created with all its subtasks.',
    );
    submitting.current = false;
    if (ok) navigate(existing ? `/tasks/${existing.id}` : '/tasks');
  }
  const due = form.dueDate
    ? `${form.dueDate === localClock(now, workspace.profile.timezone).date ? 'TODAY' : dateLabel(form.dueDate).toUpperCase()} / ${form.dueTime || 'END OF DAY'}`
    : 'NO DEADLINE';
  return (
    <>
      <Heading
        title={existing ? 'EDIT TASK.' : 'NEW TASK.'}
        subtitle={`TASKS / ${project?.name ?? 'YOUR PROJECT'} / CREATE A CLEAR NEXT ACTION`}
        mobileSubtitle={`${project?.name ?? 'YOUR PROJECT'} / ${existing ? 'EDIT' : 'CREATE'}`}
      />
      {!workspace.projects.length ? (
        <Empty>
          <p>Create a project before adding tasks.</p>
          <Link className="button" to="/projects">
            Go to projects →
          </Link>
        </Empty>
      ) : (
        <div className="form-layout">
          <form className="main-form" onSubmit={(event) => void submit(event)}>
            <div className="section-title">
              <h2 className="eyebrow">01 / TASK DETAILS</h2>
              <span className="eyebrow">* REQUIRED</span>
            </div>
            <Field label="Task title" required>
              <input
                required
                maxLength={MAX_TASK_TITLE_LENGTH}
                placeholder="Review dashboard wireframes"
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </Field>
            <div className="form-row">
              <Field label="Project" required>
                <select
                  required
                  value={form.projectId}
                  onChange={(event) => patch({ projectId: event.target.value })}
                >
                  {workspace.projects.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Assignee
                name={fullName}
                value={form.assignee}
                onChange={(assignee) => patch({ assignee })}
              />
            </div>
            <Field label="Description">
              <textarea
                maxLength={MAX_TASK_DESCRIPTION_LENGTH}
                rows={3}
                placeholder="Review layout, hierarchy and accessibility across devices."
                value={form.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
            </Field>
            <div className="form-row three">
              <PriorityField
                value={form.priority}
                onChange={(priority) => patch({ priority })}
              />
              <DeadlineFields value={form} onChange={patch} />
            </div>
            {!existing && (
              <section className="draft-section">
                <div className="section-title">
                  <h2 className="eyebrow">
                    SUBTASKS / {String(drafts.length).padStart(2, '0')} DRAFTS
                  </h2>
                  <span className="eyebrow">OPTIONAL</span>
                </div>
                {drafts.map((draft, index) => (
                  <div className="draft-row" key={draft.key}>
                    <span className="eyebrow">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <input
                      aria-label={`Draft subtask ${index + 1}`}
                      maxLength={MAX_SUBTASK_TITLE_LENGTH}
                      placeholder="A smaller step"
                      value={draft.title}
                      onChange={(event) =>
                        setDrafts(
                          drafts.map((item) =>
                            item.key === draft.key
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remove draft subtask ${index + 1}`}
                      onClick={() =>
                        setDrafts(
                          drafts.filter((item) => item.key !== draft.key),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="draft-add">
                  <button
                    type="button"
                    onClick={() =>
                      setDrafts([
                        ...drafts,
                        { key: crypto.randomUUID(), title: '' },
                      ])
                    }
                  >
                    + ADD SUBTASK
                  </button>
                  <span className="hint">
                    Subtasks will be created with this task.
                  </span>
                </div>
              </section>
            )}
            {error && (
              <p className="feedback error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <Link
                className="button cancel"
                to={existing ? `/tasks/${existing.id}` : '/tasks'}
              >
                CANCEL
              </Link>
              <button disabled={busy} type="submit">
                {busy ? 'SAVING…' : existing ? 'SAVE TASK →' : 'CREATE TASK →'}
              </button>
            </div>
          </form>
          <aside className="context-panel">
            <h2 className="eyebrow">02 / TASK AT A GLANCE</h2>
            <div className="context-box">
              <p className="eyebrow">PROJECT</p>
              <h3>{project?.name}</h3>
              <p>{project?.description}</p>
            </div>
            <p className="eyebrow">THE NEXT STEP</p>
            <h2 className="context-display">
              {form.title || 'A clear next action.'}
            </h2>
            <dl className="summary-list">
              <div>
                <dt>DUE</dt>
                <dd>{due}</dd>
              </div>
              <div>
                <dt>PRIORITY</dt>
                <dd>{form.priority}</dd>
              </div>
              <div>
                <dt>ASSIGNED TO</dt>
                <dd>{form.assignee}</dd>
              </div>
            </dl>
            <div className="context-box">
              <p className="eyebrow">SMALLER STEPS. CLEARER WORK.</p>
              <p>
                Add subtasks to give this task
                <br />a clear path to done.
              </p>
            </div>
            <p className="context-footnote">
              Save once. Keep every step together.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
