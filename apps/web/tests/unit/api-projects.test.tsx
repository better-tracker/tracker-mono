import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiProjects } from '../../src/pages/ApiProjects';
import { getProjects, createProject } from '@project-tracker/api-client';

vi.mock('@project-tracker/api-client', () => ({
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getSubtasks: vi.fn(),
    createSubtask: vi.fn(),
    updateSubtask: vi.fn(),
    deleteSubtask: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('API-backed projects', () => {
    it('loads and displays projects from the shared API client', async () => {
        vi.mocked(getProjects).mockResolvedValue([
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Backend Project',
                description: 'Saved through the API',
                createdAt: '2026-10-20T10:00:00Z',
            },
        ]);

        render(<ApiProjects />);

        expect(
            await screen.findByText('Backend Project'),
        ).toBeTruthy();

        expect(screen.getByText(/Saved through the API/)).toBeTruthy();
        expect(getProjects).toHaveBeenCalledOnce();
    });

    it('creates a project through the shared API client', async () => {
        const user = userEvent.setup();

        vi.mocked(getProjects).mockResolvedValue([]);

        vi.mocked(createProject).mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'New Project',
            description: 'Created from React',
            createdAt: '2026-10-20T10:00:00Z',
        });

        render(<ApiProjects />);

        await screen.findByText('No API projects yet.');

        await user.type(
            screen.getByLabelText('Project name'),
            'New Project',
        );

        await user.type(
            screen.getByLabelText('Description'),
            'Created from React',
        );

        await user.click(
            screen.getByRole('button', { name: 'Create project' }),
        );

        expect(createProject).toHaveBeenCalledWith(
            expect.any(String),
            {
                name: 'New Project',
                description: 'Created from React',
            },
        );
    });

    it('preserves project input after an API failure and allows retry', async () => {
        const user = userEvent.setup();

        vi.mocked(getProjects).mockResolvedValue([]);

        vi.mocked(createProject)
            .mockRejectedValueOnce(new Error('Backend unavailable'))
            .mockResolvedValueOnce({
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Retry Project',
                description: 'Keep this description',
                createdAt: '2026-10-20T10:00:00Z',
            });

        render(<ApiProjects />);

        await screen.findByText('No API projects yet.');

        await user.type(
            screen.getByLabelText('Project name'),
            'Retry Project',
        );

        await user.type(
            screen.getByLabelText('Description'),
            'Keep this description',
        );

        await user.click(
            screen.getByRole('button', { name: 'Create project' }),
        );

        expect((await screen.findByRole('alert')).textContent).toContain(
            'Unable to save project',
        );

        expect(
            (screen.getByLabelText('Project name') as HTMLInputElement).value,
        ).toBe('Retry Project');

        expect(
            (screen.getByLabelText('Description') as HTMLTextAreaElement).value,
        ).toBe('Keep this description');

        await user.click(
            screen.getByRole('button', { name: 'Create project' }),
        );

        expect(createProject).toHaveBeenCalledTimes(2);
    });
});