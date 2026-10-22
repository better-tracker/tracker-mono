import { getTaskSubtasks } from '../data/workspace-selectors';
import { useWorkspaceForm } from '../features/use-workspace-form';
import {
  Button,
  ButtonLink,
  CheckLabel,
  ContextBox,
  ContextPanel,
  Eyebrow,
  Feedback,
  Field,
  FormActions,
  FormLayout,
  FormRow,
  Heading,
  Hint,
  Missing,
  Status,
} from '../components/ui';
import { cn } from '../components/ui/classes';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Assignee,
  DeadlineFields,
  PriorityField,
} from '../components/TaskFields';
import {
  MAX_SUBTASK_NOTES_LENGTH,
  MAX_SUBTASK_TITLE_LENGTH,
} from '../data/constants';
import { formatDeadline, deadlineKey } from '../data/dates';
import type { SubtaskInput } from '../data/types';
import { validateSubtask } from '../data/validation';
import { useWorkspace } from '../features/workspace-context';

export function SubtaskForm() {
  const { id, subtaskId } = useParams();
  const { workspace, source, run, busy } = useWorkspace();
  const task = workspace.tasks.find((item) => item.id === id);
  const taskSubtasks = getTaskSubtasks(workspace, id);
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
  const navigate = useNavigate();
  const patch = (input: Partial<SubtaskInput>) =>
    setForm((value) => ({ ...value, ...input }));
  const { submit, error } = useWorkspaceForm({
    validate: () => {
      if (!task) throw new Error('Parent task not found.');
      validateSubtask(form, task);
    },
    save: () =>
      existing
        ? source.updateSubtask(existing.id, form)
        : source.createSubtask(id ?? '', form),
    message: existing ? 'Subtask saved.' : 'Subtask created.',
    validationMessage: 'Check the subtask details.',
    onSuccess: () => navigate(`/tasks/${id}`),
  });
  if (!task || (subtaskId && !existing)) return <Missing />;
  const deadline = formatDeadline(task, {
    endOfDay: 'end of day',
    noDeadline: 'No parent deadline',
  });
  return (
    <>
      <Heading
        title={existing ? 'EDIT SUBTASK.' : 'SUBTASK.'}
        subtitle={`TASKS / ${project?.name} / ADD A SMALLER STEP`}
        mobileSubtitle={`${project?.name} / ${existing ? 'EDIT' : 'CREATE'}`}
      />
      <FormLayout>
        <form
          className={cn(
            'main-form min-w-0 pr-[50px] border-r-[1px] border-solid border-r-line [&_>_.section-title]:mb-[30px]',
            'desktop:max-wide:pr-[30px]',
            'max-desktop:border-0 max-desktop:p-0 max-desktop:[&_>_.section-title]:mb-[30px]',
          )}
          onSubmit={(event) => void submit(event)}
        >
          <ContextBox
            className={cn(
              'parent-task py-5 px-6 mb-9 [&_h2]:text-[30px] [&_h2]:tracking-[-0.04em] [&_h2]:my-2 [&_h2]:mx-0',
              'max-desktop:bg-muted max-desktop:p-5 max-desktop:mb-8 max-desktop:[&_h2]:text-[28px]',
            )}
          >
            <Eyebrow>PARENT TASK / {project?.name}</Eyebrow>
            <h2>{task.title}</h2>
            <Eyebrow className="parent-deadline text-right mt-3 max-desktop:text-left max-desktop:mt-[18px]">
              DUE / {deadline}
            </Eyebrow>
          </ContextBox>
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
          <FormRow>
            <Assignee
              name={`${workspace.profile.firstName} ${workspace.profile.lastName}`}
              value={form.assignee}
              onChange={(assignee) => patch({ assignee })}
            />
            <PriorityField
              value={form.priority}
              onChange={(priority) => patch({ priority })}
            />
          </FormRow>
          <FormRow>
            <DeadlineFields value={form} onChange={patch} />
          </FormRow>
          {deadlineKey(task) && (
            <Hint
              className="parent-hint mt-[-14px] max-desktop:text-[15px] max-desktop:leading-[1.6] max-desktop:mt-[-18px]"
              as="p"
            >
              Finish before the parent deadline: {deadline}.
            </Hint>
          )}
          {error && (
            <Feedback error role="alert">
              {error}
            </Feedback>
          )}
          <FormActions>
            <ButtonLink className="cancel" to={`/tasks/${task.id}`}>
              CANCEL
            </ButtonLink>
            <Button type="submit" disabled={busy}>
              {busy
                ? 'SAVING…'
                : existing
                  ? 'SAVE SUBTASK →'
                  : 'CREATE SUBTASK →'}
            </Button>
          </FormActions>
        </form>
        <ContextPanel>
          <Eyebrow as="h2">02 / PARENT CONTEXT</Eyebrow>
          <h2
            className={cn(
              'context-display large tracking-[-0.06em] text-[43px] leading-[1.05] mt-2 mx-0 mb-10 wrap-anywhere',
              '[&.large]:text-[60px] [&.large]:mt-[-8px]',
              'desktop:max-wide:text-[36px]',
            )}
          >
            ONE TASK.
            <br />
            SMALL STEPS.
          </h2>
          <h3>{task.title}</h3>
          <p>
            {project?.name} / {project?.description}
          </p>
          <Status status={task.status} />
          <Eyebrow
            className="current-subtasks mt-[55px] mx-0 mb-[22px]"
            as="h3"
          >
            CURRENT SUBTASKS
          </Eyebrow>
          {taskSubtasks.map((item) => (
            <CheckLabel
              className="context-subtask py-3 px-0 border-b-[1px] border-solid border-b-line [&:last-of-type]:mb-[38px]"
              key={item.id}
            >
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
            </CheckLabel>
          ))}
          <ContextBox>
            <Eyebrow>LINKED TO THE PARENT</Eyebrow>
            <p>
              Project stays the same.
              <br />
              Assignee and deadline can differ.
            </p>
          </ContextBox>
        </ContextPanel>
      </FormLayout>
    </>
  );
}
