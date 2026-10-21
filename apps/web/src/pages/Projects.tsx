import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
} from '@project-tracker/contracts';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Confirm,
  Dialog,
  Empty,
  Field,
  Heading,
  Missing,
  Progress,
} from '../components/UI';
import { TaskRow } from '../components/TaskRow';
import { projectProgress } from '../data/dates';
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
  const { source, run, busy, error: saveError } = useWorkspace();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    try {
      validateProject({ name, description });
    } catch (value) {
      setError(
        value instanceof Error ? value.message : 'Check your project details.',
      );
      return;
    }
    if (
      await run(
        () =>
          project
            ? source.updateProject(project.id, { name, description })
            : source.createProject({ name, description }),
        project ? 'Project saved.' : 'Project created.',
      )
    )
      onClose();
  }
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
          <p role="alert" className="feedback error">
            {error || saveError}
          </p>
        )}
        <div className="actions">
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? 'SAVING…' : project ? 'SAVE PROJECT →' : 'CREATE PROJECT →'}
          </button>
        </div>
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
  const tasks = workspace.tasks.filter((task) => task.projectId === id);
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
      <div className="toolbar">
        {selected ? (
          <>
            <Link className="text-link" to="/projects">
              ← All projects
            </Link>
            <div className="actions">
              <button onClick={() => setEditing(selected)}>EDIT PROJECT</button>
              <Link className="button" to={`/tasks/new?project=${selected.id}`}>
                + NEW TASK
              </Link>
              <button onClick={() => setDeleting(selected)}>
                DELETE PROJECT
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Small steps. A clearer path to done.</p>
            <button onClick={() => setEditing('new')}>+ NEW PROJECT</button>
          </>
        )}
      </div>
      {selected ? (
        <>
          <p className="project-description">{selected.description}</p>
          <div className="project-detail-progress">
            <span className="eyebrow">
              {projectProgress(workspace, selected.id)}% COMPLETE /{' '}
              {tasks.length} TASKS
            </span>
            <Progress value={projectProgress(workspace, selected.id)} />
          </div>
          <div className="section-title">
            <h2 className="eyebrow">01 / LOCAL DEMO TASKS</h2>
          </div>
          {tasks.length ? (
            tasks.map((task) => <TaskRow key={task.id} task={task} showDate />)
          ) : (
            <Empty>
              <p>No tasks yet. Give this project a clear next action.</p>
              <Link className="button" to={`/tasks/new?project=${selected.id}`}>
                + NEW TASK
              </Link>
            </Empty>
          )}
          <ProjectSubtasks key={selected.id} projectId={selected.id} />
        </>
      ) : workspace.projects.length ? (
        <div className="project-grid">
          {workspace.projects.map((project, index) => (
            <article className="project-card" key={project.id}>
              <p className="eyebrow">
                {String(index + 1).padStart(2, '0')} / PROJECT
              </p>
              <Link to={`/projects/${project.id}`}>
                <h2>{project.name} ↗</h2>
              </Link>
              <p>{project.description}</p>
              <div className="section-title">
                <span className="eyebrow">
                  {
                    workspace.tasks.filter(
                      (task) => task.projectId === project.id,
                    ).length
                  }{' '}
                  TASKS
                </span>
                <span>{projectProgress(workspace, project.id)}%</span>
              </div>
              <Progress value={projectProgress(workspace, project.id)} />
              <div className="actions">
                <button onClick={() => setEditing(project)}>Edit</button>
                <button onClick={() => setDeleting(project)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty>
          <p>No projects yet. Make room for your first one.</p>
          <button onClick={() => setEditing('new')}>+ NEW PROJECT</button>
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
