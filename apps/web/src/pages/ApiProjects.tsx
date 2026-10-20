
import { useEffect, useState } from 'react';
import {
  loadApiProjects,
  createApiProject,
  updateApiProject,
  deleteApiProject,
  loadApiSubtasks,
  createApiSubtask,
  deleteApiSubtask,
  updateApiSubtask,
} from '../data/api-source';
import type { DemoProject } from '../data/types';

export function ApiProjects() {
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<
    Awaited<ReturnType<typeof loadApiSubtasks>>
  >([]);
  const [subtaskError, setSubtaskError] = useState('');
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskBusy, setSubtaskBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      setProjects(await loadApiProjects());
    } catch (value) {
      setError(
        value instanceof Error ? value.message : 'Unable to load projects.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    getProjectsFromApi();

    async function getProjectsFromApi() {
      try {
        const result = await loadApiProjects();

        if (active) {
          setProjects(result);
        }
      } catch (value) {
        if (active) {
          console.error('Project loading failed:', value);
          setError('Unable to load projects. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    return () => {
      active = false;
    };
  }, []);

  async function saveProject() {
    if (busy) return;
    setBusy(true);
    setError('');

    try {
      const input = { name, description };

      if (editingId) {
        await updateApiProject(editingId, input);
      } else {
        await createApiProject(input);
      }

      await refresh();
      setName('');
      setDescription('');
      setEditingId(null);
    } catch (value) {
      console.error('Project save failed:', value);
      setError(
        'Unable to save project. Please try again later.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeProject(id: string) {
    if (busy || !window.confirm('Delete this project permanently?')) return;

    setBusy(true);
    setError('');

    try {
      await deleteApiProject(id);
      await refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : 'Unable to delete project.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function showSubtasks(projectId: string) {
    setSelectedProjectId(projectId);
    setSubtasks([]);
    setSubtaskError('');
    setSubtasksLoading(true);

    try {
      setSubtasks(await loadApiSubtasks(projectId));
    } catch (value) {
      console.error('Subtask loading failed:', value);
      setSubtaskError('Unable to load subtasks. Please try again.');
    } finally {
      setSubtasksLoading(false);
    }
  }

  async function addSubtask() {
    if (!selectedProjectId || subtaskBusy) return;

    setSubtaskBusy(true);
    setSubtaskError('');

    try {
      await createApiSubtask(selectedProjectId, {
        description: subtaskDescription.trim(),
        completed: false,
      });

      await showSubtasks(selectedProjectId);
      setSubtaskDescription('');
    } catch (value) {
      console.error('Subtask creation failed:', value);
      setSubtaskError('Unable to create subtask. Please try again.');
    } finally {
      setSubtaskBusy(false);
    }
  }

  async function removeSubtask(subtaskId: string) {
    if (
      !selectedProjectId ||
      subtaskBusy ||
      !window.confirm('Delete this subtask permanently?')
    ) {
      return;
    }

    setSubtaskBusy(true);
    setSubtaskError('');

    try {
      await deleteApiSubtask(selectedProjectId, subtaskId);
      await showSubtasks(selectedProjectId);
    } catch (value) {
      console.error('Subtask deletion failed:', value);
      setSubtaskError('Unable to delete subtask. Please try again.');
    } finally {
      setSubtaskBusy(false);
    }
  }

  async function toggleSubtask(
    subtask: (typeof subtasks)[number],
  ) {
    if (!selectedProjectId || subtaskBusy) return;

    setSubtaskBusy(true);
    setSubtaskError('');

    try {
      await updateApiSubtask(selectedProjectId, subtask.id, {
        description: subtask.description,
        completed: !subtask.completed,
      });

      await showSubtasks(selectedProjectId);
    } catch (value) {
      console.error('Subtask update failed:', value);
      setSubtaskError('Unable to update subtask. Please try again.');
    } finally {
      setSubtaskBusy(false);
    }
  }

  async function editSubtask(
    subtask: (typeof subtasks)[number],
  ) {
    if (!selectedProjectId || subtaskBusy) return;

    const description = window.prompt(
      'Edit subtask description:',
      subtask.description,
    );

    if (description === null) return;

    const trimmed = description.trim();
    if (!trimmed || trimmed === subtask.description) return;

    setSubtaskBusy(true);
    setSubtaskError('');

    try {
      await updateApiSubtask(selectedProjectId, subtask.id, {
        description: trimmed,
        completed: subtask.completed,
      });

      await showSubtasks(selectedProjectId);
    } catch (value) {
      console.error('Subtask edit failed:', value);
      setSubtaskError('Unable to edit subtask. Please try again.');
    } finally {
      setSubtaskBusy(false);
    }
  }

  return (
    <main>
      <h1>API Projects</h1>
      <p>Projects saved through the backend, separate from demo data.</p>

      {error && <p role="alert">{error}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void saveProject();
        }}
      >
        <label htmlFor="api-project-name">Project name</label>
        <input
          id="api-project-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label htmlFor="api-project-description">Description</label>
        <textarea
          id="api-project-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <button type="submit" disabled={busy}>
          {busy ? 'Saving...' : editingId ? 'Update project' : 'Create project'}
        </button>
      </form>

      {loading ? (
        <p role="status">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No API projects yet.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <strong>{project.name}</strong> — {project.description}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditingId(project.id);
                  setName(project.name);
                  setDescription(project.description);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeProject(project.id)}
              >
                Delete
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void showSubtasks(project.id)}
              >
                View subtasks
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedProjectId && (
        <section>
          <h2>Project subtasks</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void addSubtask();
            }}
          >
            <label htmlFor="api-subtask-description">
              Subtask description
            </label>
            <input
              id="api-subtask-description"
              required
              value={subtaskDescription}
              onChange={(event) => setSubtaskDescription(event.target.value)}
            />

            <button type="submit" disabled={subtaskBusy}>
              {subtaskBusy ? 'Creating...' : 'Add subtask'}
            </button>
          </form>

          {subtaskError && <p role="alert">{subtaskError}</p>}

          {subtasksLoading ? (
            <p role="status">Loading subtasks...</p>
          ) : subtasks.length === 0 ? (
            <p>No subtasks yet.</p>
          ) : (
            <ul>
              {subtasks.map((subtask) => (
                <li key={subtask.id}>
                  {subtask.description}
                  {subtask.completed ? ' (Complete)' : '(Incomplete)'}

                  <button
                    type="button"
                    disabled={subtaskBusy}
                    onClick={() => void toggleSubtask(subtask)}
                  >
                    {subtask.completed ? 'Mark incomplete' : 'Mark complete'}
                  </button>

                  <button
                    type="button"
                    disabled={subtaskBusy}
                    onClick={() => void editSubtask(subtask)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={subtaskBusy}
                    onClick={() => void removeSubtask(subtask.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}