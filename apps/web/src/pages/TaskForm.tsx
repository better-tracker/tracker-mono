import {
  Button,
  ButtonLink,
  ContextBox,
  ContextPanel,
  Empty,
  Eyebrow,
  Feedback,
  Field,
  FormActions,
  FormLayout,
  FormRow,
  Heading,
  Hint,
  Missing,
  SectionTitle,
  SummaryList,
} from '../components/ui';
import { cn } from '../components/ui/classes';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Assignee,
  DeadlineFields,
  PriorityField,
} from '../components/TaskFields';
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
          <ButtonLink to="/projects">Go to projects →</ButtonLink>
        </Empty>
      ) : (
        <FormLayout>
          <form
            className={cn(
              'main-form min-w-0 pr-[50px] border-r-[1px] border-solid border-r-line [&_>_.section-title]:mb-[30px]',
              'desktop:max-wide:pr-[30px]',
              'max-desktop:border-0 max-desktop:p-0 max-desktop:[&_>_.section-title]:mb-[30px]',
            )}
            onSubmit={(event) => void submit(event)}
          >
            <SectionTitle>
              <Eyebrow as="h2">01 / TASK DETAILS</Eyebrow>
              <Eyebrow as="span">* REQUIRED</Eyebrow>
            </SectionTitle>
            <Field label="Task title" required>
              <input
                required
                maxLength={MAX_TASK_TITLE_LENGTH}
                placeholder="Review dashboard wireframes"
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </Field>
            <FormRow>
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
            </FormRow>
            <Field label="Description">
              <textarea
                maxLength={MAX_TASK_DESCRIPTION_LENGTH}
                rows={3}
                placeholder="Review layout, hierarchy and accessibility across devices."
                value={form.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
            </Field>
            <FormRow columns={3}>
              <PriorityField
                value={form.priority}
                onChange={(priority) => patch({ priority })}
              />
              <DeadlineFields value={form} onChange={patch} />
            </FormRow>
            {!existing && (
              <section className="draft-section [&_>_.section-title]:mb-[14px] max-desktop:[&_>_.section-title]:mb-[18px]">
                <SectionTitle>
                  <Eyebrow as="h2">
                    SUBTASKS / {String(drafts.length).padStart(2, '0')} DRAFTS
                  </Eyebrow>
                  <Eyebrow as="span">OPTIONAL</Eyebrow>
                </SectionTitle>
                {drafts.map((draft, index) => (
                  <div
                    className={cn(
                      'draft-row flex items-center border-[1.5px] border-solid border-black mb-[6px] min-w-0 [&_>_span]:py-0',
                      '[&_>_span]:px-5 [&_input]:border-0 [&_input]:text-[18px] [&_input]:pl-0 [&_button]:py-2',
                      '[&_button]:px-5 [&_button]:min-w-13 [&_button]:border-0 [&_button]:text-[24px]',
                      'max-desktop:mb-[6px] max-desktop:[&_>_span]:py-0 max-desktop:[&_>_span]:px-4',
                      'max-desktop:[&_input]:text-[16px] max-desktop:[&_button]:py-2 max-desktop:[&_button]:px-3',
                    )}
                    key={draft.key}
                  >
                    <Eyebrow as="span">
                      {String(index + 1).padStart(2, '0')}
                    </Eyebrow>
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
                    <Button
                      type="button"
                      aria-label={`Remove draft subtask ${index + 1}`}
                      onClick={() =>
                        setDrafts(
                          drafts.filter((item) => item.key !== draft.key),
                        )
                      }
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <div
                  className={cn(
                    'draft-add flex items-center gap-7 mt-[14px]',
                    'max-desktop:block max-desktop:[&_button]:w-full max-desktop:[&_button]:mt-2',
                    'max-desktop:[&_button]:mx-0 max-desktop:[&_button]:mb-4 max-desktop:[&_.hint]:text-[14px]',
                  )}
                >
                  <Button
                    type="button"
                    onClick={() =>
                      setDrafts([
                        ...drafts,
                        { key: crypto.randomUUID(), title: '' },
                      ])
                    }
                  >
                    + ADD SUBTASK
                  </Button>
                  <Hint>Subtasks will be created with this task.</Hint>
                </div>
              </section>
            )}
            {error && (
              <Feedback error role="alert">
                {error}
              </Feedback>
            )}
            <FormActions>
              <ButtonLink
                className="cancel"
                to={existing ? `/tasks/${existing.id}` : '/tasks'}
              >
                CANCEL
              </ButtonLink>
              <Button disabled={busy} type="submit">
                {busy ? 'SAVING…' : existing ? 'SAVE TASK →' : 'CREATE TASK →'}
              </Button>
            </FormActions>
          </form>
          <ContextPanel>
            <Eyebrow as="h2">02 / TASK AT A GLANCE</Eyebrow>
            <ContextBox>
              <Eyebrow>PROJECT</Eyebrow>
              <h3>{project?.name}</h3>
              <p>{project?.description}</p>
            </ContextBox>
            <Eyebrow>THE NEXT STEP</Eyebrow>
            <h2
              className={cn(
                'context-display tracking-[-0.06em] text-[43px] leading-[1.05] mt-2 mx-0 mb-10 wrap-anywhere',
                '[&.large]:text-[60px] [&.large]:mt-[-8px]',
                'desktop:max-wide:text-[36px]',
              )}
            >
              {form.title || 'A clear next action.'}
            </h2>
            <SummaryList>
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
            </SummaryList>
            <ContextBox>
              <Eyebrow>SMALLER STEPS. CLEARER WORK.</Eyebrow>
              <p>
                Add subtasks to give this task
                <br />a clear path to done.
              </p>
            </ContextBox>
            <p className="context-footnote mt-10">
              Save once. Keep every step together.
            </p>
          </ContextPanel>
        </FormLayout>
      )}
    </>
  );
}
