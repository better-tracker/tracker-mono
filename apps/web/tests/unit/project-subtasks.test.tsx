import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSubtasks } from '../../src/components/ProjectSubtasks';
import {
    getSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
} from '@project-tracker/api-client';

vi.mock('@project-tracker/api-client', () => ({
    getSubtasks: vi.fn(),
    createSubtask: vi.fn(),
    updateSubtask: vi.fn(),
    deleteSubtask: vi.fn(),
}));

const projectId = '550e8400-e29b-41d4-a716-446655440000';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Server-backed project subtasks', () => {
    it('loads subtasks through the shared API client', async () => {
        vi.mocked(getSubtasks).mockResolvedValue([
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                description: 'Saved subtask',
                completed: false,
                createdAt: '2026-10-20T10:00:00Z',
                updatedAt: '2026-10-20T10:00:00Z',
            },
        ]);

        render(<ProjectSubtasks projectId={projectId} />);

        expect(await screen.findByText('Saved subtask')).toBeTruthy();
        expect(getSubtasks).toHaveBeenCalledWith(
            expect.any(String),
            projectId,
        );
    });

    it('creates a subtask through the shared API client', async () => {
        const user = userEvent.setup();

        vi.mocked(getSubtasks).mockResolvedValue([]);
        vi.mocked(createSubtask).mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440001',
            description: 'New server subtask',
            completed: false,
            createdAt: '2026-10-20T10:00:00Z',
            updatedAt: '2026-10-20T10:00:00Z',
        });

        render(<ProjectSubtasks projectId={projectId} />);

        await screen.findByText('No server-saved subtasks yet.');

        await user.type(
            screen.getByLabelText('New subtask'),
            'New server subtask',
        );

        await user.click(
            screen.getByRole('button', { name: 'Add Subtask' }),
        );

        expect(createSubtask).toHaveBeenCalledWith(
            expect.any(String),
            projectId,
            {
                description: 'New server subtask',
                completed: false,
            },
        );
    });

    it('preserves input after an API failure and allows retry', async () => {
        const user = userEvent.setup();

        vi.mocked(getSubtasks).mockResolvedValue([]);
        vi.mocked(createSubtask)
            .mockRejectedValueOnce(new Error('Backend unavailable'))
            .mockResolvedValueOnce({
                id: '550e8400-e29b-41d4-a716-446655440001',
                description: 'Retry subtask',
                completed: false,
                createdAt: '2026-10-20T10:00:00Z',
                updatedAt: '2026-10-20T10:00:00Z',
            });

        render(<ProjectSubtasks projectId={projectId} />);

        await screen.findByText('No server-saved subtasks yet.');

        await user.type(
            screen.getByLabelText('New subtask'),
            'Retry subtask',
        );

        await user.click(
            screen.getByRole('button', { name: 'Add Subtask' }),
        );

        expect((await screen.findByRole('alert')).textContent).toContain(
            'Backend unavailable',
        );

        expect(
            (screen.getByLabelText('New subtask') as HTMLInputElement).value,
        ).toBe('Retry subtask');

        await user.click(
            screen.getByRole('button', { name: 'Add Subtask' }),
        );

        expect(createSubtask).toHaveBeenCalledTimes(2);
    });


    it('marks a subtask complete through the shared API client', async () => {
        const user = userEvent.setup();

        const subtask = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            description: 'Complete this subtask',
            completed: false,
            createdAt: '2026-10-20T10:00:00Z',
            updatedAt: '2026-10-20T10:00:00Z',
        };

        vi.mocked(getSubtasks).mockResolvedValue([subtask]);
        vi.mocked(updateSubtask).mockResolvedValue({
            ...subtask,
            completed: true,
        });

        render(<ProjectSubtasks projectId={projectId} />);

        const checkbox = await screen.findByRole('checkbox', {
            name: 'Complete this subtask',
        });

        await user.click(checkbox);

        expect(updateSubtask).toHaveBeenCalledWith(
            expect.any(String),
            projectId,
            subtask.id,
            {
                description: 'Complete this subtask',
                completed: true,
            },
        );
    });


    it('edits a subtask without losing its completed status', async () => {
        const user = userEvent.setup();

        const subtask = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            description: 'Original description',
            completed: true,
            createdAt: '2026-10-20T10:00:00Z',
            updatedAt: '2026-10-20T10:00:00Z',
        };

        vi.mocked(getSubtasks).mockResolvedValue([subtask]);

        vi.mocked(updateSubtask).mockResolvedValue({
            ...subtask,
            description: 'Updated description',
        });

        render(<ProjectSubtasks projectId={projectId} />);

        await screen.findByText('Original description');

        await user.click(
            screen.getByRole('button', { name: 'Edit' }),
        );

        const input = screen.getByLabelText('Edit subtask');

        await user.clear(input);
        await user.type(input, 'Updated description');

        await user.click(
            screen.getByRole('button', { name: 'Save Subtask' }),
        );

        expect(updateSubtask).toHaveBeenCalledWith(
            expect.any(String),
            projectId,
            subtask.id,
            {
                description: 'Updated description',
                completed: true,
            },
        );
    });


    it('deletes a subtask through the shared API client', async () => {
        const user = userEvent.setup();

        const subtask = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            description: 'Delete this subtask',
            completed: false,
            createdAt: '2026-10-20T10:00:00Z',
            updatedAt: '2026-10-20T10:00:00Z',
        };

        vi.mocked(getSubtasks).mockResolvedValue([subtask]);
        vi.mocked(deleteSubtask).mockResolvedValue(undefined);

        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(true);

        try {
            render(<ProjectSubtasks projectId={projectId} />);

            await screen.findByText('Delete this subtask');

            await user.click(
                screen.getByRole('button', { name: 'Delete' }),
            );

            expect(confirmSpy).toHaveBeenCalledWith(
                'Delete "Delete this subtask"?',
            );

            expect(deleteSubtask).toHaveBeenCalledWith(
                expect.any(String),
                projectId,
                subtask.id,
            );
        } finally {
            confirmSpy.mockRestore();
        }
    });
});