import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '../setup.js';
import {
  createSubtask,
  getSubtasks,
  getSubtask,
  updateSubtask,
  deleteSubtask,
} from '../../src/index.js';

const baseUrl = 'http://localhost:3001';

const projectId = '550e8400-e29b-41d4-a716-446655440000';

const subtask = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  completed: false,
  description: 'Write API client tests',
  createdAt: '2026-10-06T03:00:00.000Z',
  updatedAt: '2026-10-06T03:00:00.000Z',
};

describe('getSubtasks', () => {
  it('returns subtasks successfully', async () => {
    server.use(
      http.get(
        `${baseUrl}/v1/projects/${projectId}/subtasks`,
        () => HttpResponse.json([subtask]),
      ),
    );

    const result = await getSubtasks(baseUrl, projectId);

    expect(result).toEqual([subtask]);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.get(
        `${baseUrl}/v1/projects/${projectId}/subtasks`,
        () => HttpResponse.json([{ invalid: true }]),
      ),
    );

    await expect(
      getSubtasks(baseUrl, projectId),
    ).rejects.toThrow();
  });
});

describe('createSubtask', () => {
  it('creates a subtask successfully', async () => {
    server.use(
      http.post(
        `${baseUrl}/v1/projects/${projectId}/subtasks`,
        async ({ request }) => {
          const body = await request.json();

          expect(body).toEqual({
            completed: false,
            description: 'Write API client tests',
          });

          return HttpResponse.json(subtask, { status: 201 });
        },
      ),
    );

    const result = await createSubtask(baseUrl, projectId, {
      completed: false,
      description: 'Write API client tests',
    });

    expect(result).toEqual(subtask);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.post(
        `${baseUrl}/v1/projects/${projectId}/subtasks`,
        () => HttpResponse.json({ invalid: true }, { status: 201 }),
      ),
    );

    await expect(
      createSubtask(baseUrl, projectId, {
        completed: false,
        description: 'Write API client tests',
      }),
    ).rejects.toThrow();
  });

  it('URL-encodes the project ID', async () => {
    const specialProjectId = 'project/id';

    server.use(
      http.post(
        `${baseUrl}/v1/projects/project%2Fid/subtasks`,
        () => HttpResponse.json(subtask, { status: 201 }),
      ),
    );

    const result = await createSubtask(baseUrl, specialProjectId, {
      completed: false,
      description: 'Write API client tests',
    });

    expect(result).toEqual(subtask);
  });
});

describe('getSubtask', () => {
  it('returns a subtask successfully', async () => {
    server.use(
      http.get(
        `${baseUrl}/v1/projects/${projectId}/subtasks/${subtask.id}`,
        () => HttpResponse.json(subtask),
      ),
    );

    const result = await getSubtask(
      baseUrl,
      projectId,
      subtask.id,
    );

    expect(result).toEqual(subtask);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.get(
        `${baseUrl}/v1/projects/${projectId}/subtasks/${subtask.id}`,
        () => HttpResponse.json({ invalid: true }),
      ),
    );

    await expect(
      getSubtask(baseUrl, projectId, subtask.id),
    ).rejects.toThrow();
  });
});

describe('updateSubtask', () => {
  it('updates a subtask successfully', async () => {
    const updatedSubtask = {
      ...subtask,
      completed: true,
      description: 'Updated API client tests',
    };

    server.use(
      http.put(
        `${baseUrl}/v1/projects/${projectId}/subtasks/${subtask.id}`,
        async ({ request }) => {
          const body = await request.json();

          expect(body).toEqual({
            completed: true,
            description: 'Updated API client tests',
          });

          return HttpResponse.json(updatedSubtask);
        },
      ),
    );

    const result = await updateSubtask(
      baseUrl,
      projectId,
      subtask.id,
      {
        completed: true,
        description: 'Updated API client tests',
      },
    );

    expect(result).toEqual(updatedSubtask);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.put(
        `${baseUrl}/v1/projects/${projectId}/subtasks/${subtask.id}`,
        () => HttpResponse.json({ invalid: true }),
      ),
    );

    await expect(
      updateSubtask(
        baseUrl,
        projectId,
        subtask.id,
        {
          completed: true,
          description: 'Updated API client tests',
        },
      ),
    ).rejects.toThrow();
  });
});

describe('deleteSubtask', () => {
  it('deletes a subtask successfully', async () => {
    server.use(
      http.delete(
        `${baseUrl}/v1/projects/${projectId}/subtasks/${subtask.id}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(
      deleteSubtask(
        baseUrl,
        projectId,
        subtask.id,
      ),
    ).resolves.toBeUndefined();
  });

  it('throws an error for an HTTP failure', async () => {
    server.use(
      http.delete(
        `${baseUrl}/v1/projects/${projectId}/subtasks/${subtask.id}`,
        () =>
          HttpResponse.json(
            {
              error: {
                code: 'NOT_FOUND',
                message: 'Subtask not found',
              },
            },
            { status: 404 },
          ),
      ),
    );

    await expect(
      deleteSubtask(
        baseUrl,
        projectId,
        subtask.id,
      ),
    ).rejects.toThrow('Subtask not found');
  });
});