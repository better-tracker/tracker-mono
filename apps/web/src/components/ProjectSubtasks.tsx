import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Eyebrow, Feedback, SectionTitle } from './ui';
import type { SubtaskResponse } from '@project-tracker/contracts';
import {
    loadApiSubtasks,
    createApiSubtask,
    updateApiSubtask,
    deleteApiSubtask,
} from '../data/api-source';

interface Props {
    projectId: string;
}

export function ProjectSubtasks({ projectId }: Props) {
    const [subtasks, setSubtasks] = useState<SubtaskResponse[]>([]);
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submitting = useRef(false);

    async function refresh() {
        setLoading(true);
        setError('');

        try {
            const data = await loadApiSubtasks(projectId);
            setSubtasks(data);
        } catch (value) {
            setError(
                value instanceof Error ? value.message : 'Unable to load subtasks.',
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        loadApiSubtasks(projectId)
            .then((data) => {
                if (!cancelled) {
                    setSubtasks(data);
                }
            })
            .catch((value) => {
                if (!cancelled) {
                    setError(
                        value instanceof Error ? value.message : 'Unable to load subtasks.',
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (submitting.current) return;

        const value = description.trim();

        if (!value) {
            setError('Subtask description is required.');
            return;
        }

        submitting.current = true;
        setBusy(true);
        setError('');

        try {
            if (editingId) {
                const existing = subtasks.find((item) => item.id === editingId);

                if (!existing) {
                    throw new Error('Subtask not found.');
                }

                await updateApiSubtask(projectId, editingId, {
                    description: value,
                    completed: existing.completed,
                });
            } else {
                await createApiSubtask(projectId, {
                    description: value,
                    completed: false,
                });
            }

            setDescription('');
            setEditingId(null);
            await refresh();
        } catch (value) {
            setError(
                value instanceof Error ? value.message : 'Unable to save subtask.',
            );
        } finally {
            submitting.current = false;
            setBusy(false);
        }
    }

    async function toggleCompleted(subtask: SubtaskResponse) {
        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await updateApiSubtask(projectId, subtask.id, {
                description: subtask.description,
                completed: !subtask.completed,
            });

            await refresh();
        } catch (value) {
            setError(
                value instanceof Error ? value.message : 'Unable to update subtask.',
            );
        } finally {
            setBusy(false);
        }
    }

    async function remove(subtask: SubtaskResponse) {
        if (busy || !window.confirm(`Delete "${subtask.description}"?`)) {
            return;
        }

        setBusy(true);
        setError('');

        try {
            await deleteApiSubtask(projectId, subtask.id);

            if (editingId === subtask.id) {
                setEditingId(null);
                setDescription('');
            }

            await refresh();
        } catch (value) {
            setError(
                value instanceof Error ? value.message : 'Unable to delete subtask.',
            );
        } finally {
            setBusy(false);
        }
    }

    function startEditing(subtask: SubtaskResponse) {
        setEditingId(subtask.id);
        setDescription(subtask.description);
        setError('');
    }

    function cancelEditing() {
        setEditingId(null);
        setDescription('');
        setError('');
    }

    return (
        <section aria-label="Server-saved project subtasks">
            <SectionTitle>
                <Eyebrow as="h2">02 / PROJECT SUBTASKS — SAVED TO SERVER</Eyebrow>
            </SectionTitle>

            <p>These subtasks are saved in PostgreSQL.</p>

            {loading ? (
                <p role="status">Loading subtasks...</p>
            ) : subtasks.length === 0 ? (
                <p>No server-saved subtasks yet.</p>
            ) : (
                <ul>
                    {subtasks.map((subtask) => (
                        <li key={subtask.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    disabled={busy}
                                    onChange={() => void toggleCompleted(subtask)}
                                />
                                {subtask.description}
                            </label>

                            <Button
                                type="button"
                                disabled={busy}
                                onClick={() => startEditing(subtask)}
                            >
                                Edit
                            </Button>

                            <Button
                                type="button"
                                disabled={busy}
                                onClick={() => void remove(subtask)}
                            >
                                Delete
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={(event) => void submit(event)}>
                <label htmlFor="project-subtask-description">
                    {editingId ? 'Edit subtask' : 'New subtask'}
                </label>

                <input
                    id="project-subtask-description"
                    required
                    value={description}
                    disabled={busy}
                    onChange={(event) => setDescription(event.target.value)}
                />

                <Button type="submit" disabled={busy}>
                    {busy ? 'Saving...' : editingId ? 'Save Subtask' : 'Add Subtask'}
                </Button>

                {editingId && (
                    <Button
                        type="button"
                        disabled={busy}
                        onClick={cancelEditing}
                    >
                        Cancel
                    </Button>
                )}
            </form>

            {error && (
                <Feedback error role="alert">
                    {error}
                </Feedback>
            )}

            {!loading && (
                <Button type="button" disabled={busy} onClick={() => void refresh()}>
                    Refresh Subtasks
                </Button>
            )}
        </section>
    );
}