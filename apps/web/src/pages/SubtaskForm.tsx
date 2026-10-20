import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Assignee,
  DeadlineFields,
  PriorityField,
} from '../components/TaskFields';
import { Field, Heading, Missing, Status } from '../components/UI';
import {
  MAX_SUBTASK_NOTES_LENGTH,
  MAX_SUBTASK_TITLE_LENGTH,
} from '../data/constants';
import { dateLabel, deadlineKey } from '../data/dates';
import type { SubtaskInput } from '../data/types';
import { validateSubtask } from '../data/validation';
import { useWorkspace } from '../features/workspace-context';

export function SubtaskForm() {
  const { id, subtaskId } = useParams();
  const { workspace, source, run, busy } = useWorkspace();
  const task = workspace.tasks.find((item) => item.id === id);
  const existing = workspace.subtasks.find(
    (item) => item.id === subtaskId && item.taskId === id,
  );
  const project = workspace.projects.find(
    (item) => item.id === task?.projectId,
  );
  const [form, setForm] = useState<SubtaskInput>(() =>
    existing
      ? { ...existing }
      : {
          title: '',
          notes: '',
          assignee: task?.assignee ?? 'Unassigned',
          priority: task?.priority ?? 'Medium',
          dueDate: '',
          dueTime: '',
          completed: false,
        },
  );
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const navigate = useNavigate();
  const patch = (input: Partial<SubtaskInput>) =>
    setForm((value) => ({ ...value, ...input }));
  if (!task || (subtaskId && !existing)) return <Missing />;
  const parent = task;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    try {
      validateSubtask(form, parent);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : 'Check the subtask details.',
      );
      return;
    }
    submitting.current = true;
    const ok = await run(
      () =>
        existing
          ? source.updateSubtask(existing.id, form)
          : source.createSubtask(parent.id, form),
      existing ? 'Subtask saved.' : 'Subtask created.',
    );
    submitting.current = false;
    if (ok) navigate(`/tasks/${parent.id}`);
  }
  const deadline = task.dueDate
    ? `${dateLabel(task.dueDate)} / ${task.dueTime || 'end of day'}`
    : 'No parent deadline';
  return (
    <>
      <Heading
        title={existing ? 'EDIT SUBTASK.' : 'SUBTASK.'}
        subtitle={`TASKS / ${project?.name} / ADD A SMALLER STEP`}
        mobileSubtitle={`${project?.name} / ${existing ? 'EDIT' : 'CREATE'}`}
      />
      <div className="form-layout">
        <form className="main-form" onSubmit={(event) => void submit(event)}>
          <div className="parent-task context-box">
            <p className="eyebrow">PARENT TASK / {project?.name}</p>
            <h2>{task.title}</h2>
            <p className="eyebrow parent-deadline">DUE / {deadline}</p>
          </div>
          <Field label="Subtask title" required>
            <input
              required
              maxLength={MAX_SUBTASK_TITLE_LENGTH}
              placeholder="Check mobile spacing"
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </Field>
          <Field label="Notes">
            <textarea
              maxLength={MAX_SUBTASK_NOTES_LENGTH}
              rows={3}
              placeholder="Check spacing and tap targets on narrow screens."
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
            />
          </Field>
          <div className="form-row">
            <Assignee
              name={`${workspace.profile.firstName} ${workspace.profile.lastName}`}
              value={form.assignee}
              onChange={(assignee) => patch({ assignee })}
            />
            <PriorityField
              value={form.priority}
              onChange={(priority) => patch({ priority })}
            />
          </div>
          <div className="form-row">
            <DeadlineFields value={form} onChange={patch} />
          </div>
          {deadlineKey(task) && (
            <p className="hint parent-hint">
              Finish before the parent deadline: {deadline}.
            </p>
          )}
          {error && (
            <p className="feedback error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Link className="button cancel" to={`/tasks/${task.id}`}>
              CANCEL
            </Link>
            <button type="submit" disabled={busy}>
              {busy
                ? 'SAVING…'
                : existing
                  ? 'SAVE SUBTASK →'
                  : 'CREATE SUBTASK →'}
            </button>
          </div>
        </form>
        <aside className="context-panel">
          <h2 className="eyebrow">02 / PARENT CONTEXT</h2>
          <h2 className="context-display large">
            ONE TASK.
            <br />
            SMALL STEPS.
          </h2>
          <h3>{task.title}</h3>
          <p>
            {project?.name} / {project?.description}
          </p>
          <Status status={task.status} />
          <h3 className="eyebrow current-subtasks">CURRENT SUBTASKS</h3>
          {workspace.subtasks
            .filter((item) => item.taskId === task.id)
            .map((item) => (
              <label className="check-label context-subtask" key={item.id}>
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={busy}
                  onChange={() =>
                    void run(
                      () =>
                        source.updateSubtask(item.id, {
                          ...item,
                          completed: !item.completed,
                        }),
                      'Subtask updated.',
                    )
                  }
                />
                {item.title}
              </label>
            ))}
          <div className="context-box">
            <p className="eyebrow">LINKED TO THE PARENT</p>
            <p>
              Project stays the same.
              <br />
              Assignee and deadline can differ.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
