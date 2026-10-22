import { useWorkspaceForm } from '../features/use-workspace-form';
import {
  Actions,
  Button,
  ButtonLink,
  Confirm,
  Dialog,
  Empty,
  Eyebrow,
  Feedback,
  Field,
  Heading,
  Missing,
  Progress,
  SectionTitle,
  Toolbar,
} from '../components/ui';
import { cn } from '../components/ui/classes';
import { useState } from 'react';
import {
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
} from '@project-tracker/contracts';
import { Link, useNavigate, useParams } from 'react-router';
import { TaskRow } from '../components/TaskRow';
import { getProjectSummary } from '../data/workspace-selectors';
import type { DemoProject } from '../data/types';
import { validateProject } from '../data/validation';
import { useWorkspace } from '../features/workspace-context';
import { ProjectSubtasks } from '../components/ProjectSubtasks';

function ProjectDialog({
  project,
  onClose,
}: {
  project?: DemoProject;
  onClose: () => void;
}) {
  const { source, busy, error: saveError } = useWorkspace();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const { submit, error } = useWorkspaceForm({
    validate: () => validateProject({ name, description }),
    save: () =>
      project
        ? source.updateProject(project.id, { name, description })
        : source.createProject({ name, description }),
    message: project ? 'Project saved.' : 'Project created.',
    validationMessage: 'Check your project details.',
    onSuccess: onClose,
  });
  return (
    <Dialog
      title={project ? 'EDIT PROJECT.' : 'NEW PROJECT.'}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)}>
        <Field label="Project name" required>
          <input
            data-autofocus
            required
            maxLength={MAX_PROJECT_NAME_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Project description">
          <textarea
            rows={3}
            maxLength={MAX_PROJECT_DESCRIPTION_LENGTH}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        {(error || saveError) && (
          <Feedback role="alert" error>
            {error || saveError}
          </Feedback>
        )}
        <Actions>
          <Button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'SAVING…' : project ? 'SAVE PROJECT →' : 'CREATE PROJECT →'}
          </Button>
        </Actions>
      </form>
    </Dialog>
  );
}

export function Projects() {
  const { id } = useParams();
  const { workspace, source, run, busy, error } = useWorkspace();
  const [editing, setEditing] = useState<DemoProject | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DemoProject | null>(null);
  const navigate = useNavigate();
  const selected = workspace.projects.find((project) => project.id === id);
  if (id && !selected) return <Missing />;
  const { tasks, progress } = getProjectSummary(workspace, id);
  const projectCards = workspace.projects.map((project, index) => ({
    project,
    index,
    ...getProjectSummary(workspace, project.id),
  }));
  return (
    <>
      <Heading
        title={selected ? `${selected.name.toUpperCase()}.` : 'PROJECTS.'}
        subtitle={
          selected
            ? 'PROJECTS / MAKE ROOM FOR THE NEXT STEP'
            : 'YOUR WORK / ONE PROJECT AT A TIME'
        }
      />
      <Toolbar>
        {selected ? (
          <>
            <Link
              className="text-link underline underline-offset-[4px]"
              to="/projects"
            >
              ← All projects
            </Link>
            <Actions>
              <Button onClick={() => setEditing(selected)}>EDIT PROJECT</Button>
              <ButtonLink to={`/tasks/new?project=${selected.id}`}>
                + NEW TASK
              </ButtonLink>
              <Button onClick={() => setDeleting(selected)}>
                DELETE PROJECT
              </Button>
            </Actions>
          </>
        ) : (
          <>
            <p>Small steps. A clearer path to done.</p>
            <Button onClick={() => setEditing('new')}>+ NEW PROJECT</Button>
          </>
        )}
      </Toolbar>
      {selected ? (
        <>
          <p className="project-description leading-[1.6] whitespace-pre-wrap">
            {selected.description}
          </p>
          <div className="project-detail-progress my-[30px] mx-0 max-w-125">
            <Eyebrow as="span">
              {progress}% COMPLETE / {tasks.length} TASKS
            </Eyebrow>
            <Progress value={progress} />
          </div>
          <SectionTitle>
            <Eyebrow as="h2">01 / LOCAL DEMO TASKS</Eyebrow>
          </SectionTitle>
          {tasks.length ? (
            tasks.map((task) => <TaskRow key={task.id} task={task} showDate />)
          ) : (
            <Empty>
              <p>No tasks yet. Give this project a clear next action.</p>
              <ButtonLink to={`/tasks/new?project=${selected.id}`}>
                + NEW TASK
              </ButtonLink>
            </Empty>
          )}
          <ProjectSubtasks key={selected.id} projectId={selected.id} />
        </>
      ) : workspace.projects.length ? (
        <div className="project-grid grid grid-cols-[repeat(3,_minmax(0,_1fr))] gap-7 max-desktop:block">
          {projectCards.map(({ project, index, total, progress }) => (
            <article
              className={cn(
                'project-card border-[1.5px] border-solid border-black p-[30px] min-w-0 [&_h2]:text-[36px]',
                '[&_h2]:tracking-[-0.04em] [&_h2]:mt-[26px] [&_h2]:mx-0 [&_h2]:mb-[14px] [&_h2]:wrap-anywhere',
                '[&_p]:leading-[1.5] [&_>_.section-title]:mt-[38px] [&_>_.actions]:mt-[26px]',
                'max-desktop:mb-6 max-desktop:p-6 max-desktop:[&_h2]:text-[32px]',
              )}
              key={project.id}
            >
              <Eyebrow>{String(index + 1).padStart(2, '0')} / PROJECT</Eyebrow>
              <Link to={`/projects/${project.id}`}>
                <h2>{project.name} ↗</h2>
              </Link>
              <p>{project.description}</p>
              <SectionTitle>
                <Eyebrow as="span">{total} TASKS</Eyebrow>
                <span>{progress}%</span>
              </SectionTitle>
              <Progress value={progress} />
              <Actions>
                <Button onClick={() => setEditing(project)}>Edit</Button>
                <Button onClick={() => setDeleting(project)}>Delete</Button>
              </Actions>
            </article>
          ))}
        </div>
      ) : (
        <Empty>
          <p>No projects yet. Make room for your first one.</p>
          <Button onClick={() => setEditing('new')}>+ NEW PROJECT</Button>
        </Empty>
      )}
      {editing && (
        <ProjectDialog
          project={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Confirm
          error={error}
          title="DELETE PROJECT?"
          message={`Delete “${deleting.name}” and all its tasks and subtasks? This cannot be undone.`}
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            void run(
              () => source.deleteProject(deleting.id),
              'Project and its tasks deleted.',
            ).then((ok) => {
              if (ok) {
                setDeleting(null);
                if (id) navigate('/projects');
              }
            });
          }}
        />
      )}
    </>
  );
}
