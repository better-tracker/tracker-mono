// tests for project api functions

import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { 
    getProjects, 
    getProject,
    createProject,
    updateProject,
    deleteProject,
} from '../../src/index.js';

import { server } from '../setup.js';

const baseUrl = 'http://localhost:3001';


// tests for getProjects function
describe('getProjects', () => {
    it('rejects an invalid response', async () => {
    server.use(
      http.get(`${baseUrl}/v1/projects`, () => {
        return HttpResponse.json([
          {
            id: 'not-a-uuid',
            name: 'Invalid project',
            description: null,
            createdAt: 'not-a-date',
          },
        ]);
      }),
    );

    await expect(getProjects(baseUrl)).rejects.toThrow();
  });

  it('returns validated projects', async () => {
    server.use(
      http.get(
        `${baseUrl}/v1/projects`,
        ({ request }) => {
          const url = new URL(request.url);

          expect(url.searchParams.get('limit')).toBe('40');
          expect(url.searchParams.get('offset')).toBe('0');

          return HttpResponse.json([
            {
              id: '11111111-1111-4111-8111-111111111111',
              name: 'Test project',
              description: 'A test project',
              createdAt: '2026-10-19T00:00:00.000Z',
            },
          ]);
        },
      ),
    );

    const projects = await getProjects(baseUrl);

    expect(projects).toEqual([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Test project',
        description: 'A test project',
        createdAt: '2026-10-19T00:00:00.000Z',
      },
    ]);
  });
});

// tests for getProject function
describe('getProject', () => {
  const projectId = '11111111-1111-4111-8111-111111111111';

  it('returns a validated project', async () => {
    server.use(
      http.get(`${baseUrl}/v1/projects/${projectId}`, () => {
        return HttpResponse.json({
          id: projectId,
          name: 'Test project',
          description: 'A test project',
          createdAt: '2026-10-19T00:00:00.000Z',
          subtasks: [],
        });
      }),
    );

    const project = await getProject(baseUrl, projectId);

    expect(project).toEqual({
      id: projectId,
      name: 'Test project',
      description: 'A test project',
      createdAt: '2026-10-19T00:00:00.000Z',
      subtasks: [],
    });
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.get(`${baseUrl}/v1/projects/${projectId}`, () => {
        return HttpResponse.json({
          id: 'not-a-uuid',
          name: 'Invalid project',
          description: null,
          createdAt: 'not-a-date',
          subtasks: [],
        });
      }),
    );

    await expect(
      getProject(baseUrl, projectId),
    ).rejects.toThrow();
  });
});


// tests for createProject function
describe('createProject', () => {
  it('creates and validates a project', async () => {
    server.use(
      http.post(`${baseUrl}/v1/projects`, async ({ request }) => {
        const body = await request.json();

        expect(body).toEqual({
          name: 'New project',
          description: 'A new project',
        });

        return HttpResponse.json(
          {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'New project',
            description: 'A new project',
            createdAt: '2026-10-19T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const project = await createProject(baseUrl, {
      name: 'New project',
      description: 'A new project',
    });

    expect(project.name).toBe('New project');
    expect(project.description).toBe('A new project');
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.post(`${baseUrl}/v1/projects`, () => {
        return HttpResponse.json(
          {
            id: 'not-a-uuid',
            name: 'Invalid project',
            description: null,
            createdAt: 'not-a-date',
          },
          { status: 201 },
        );
      }),
    );

    await expect(
      createProject(baseUrl, {
        name: 'New project',
        description: null,
      }),
    ).rejects.toThrow();
  });
});

// tests for updateProject function
describe('updateProject', () => {
  const projectId = '11111111-1111-4111-8111-111111111111';

  it('updates and validates a project', async () => {
    server.use(
      http.put(`${baseUrl}/v1/projects/${projectId}`, async ({ request }) => {
        const body = await request.json();

        expect(body).toEqual({
          name: 'Updated project',
          description: 'Updated description',
        });

        return HttpResponse.json({
          id: projectId,
          name: 'Updated project',
          description: 'Updated description',
          createdAt: '2026-10-19T00:00:00.000Z',
        });
      }),
    );

    const project = await updateProject(baseUrl, projectId, {
      name: 'Updated project',
      description: 'Updated description',
    });

    expect(project.name).toBe('Updated project');
    expect(project.description).toBe('Updated description');
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.put(`${baseUrl}/v1/projects/${projectId}`, () => {
        return HttpResponse.json({
          id: 'not-a-uuid',
          name: 'Invalid project',
          description: null,
          createdAt: 'not-a-date',
        });
      }),
    );

    await expect(
      updateProject(baseUrl, projectId, {
        name: 'Updated project',
        description: null,
      }),
    ).rejects.toThrow();
  });
});

describe('deleteProject', () => {
  const projectId = '11111111-1111-4111-8111-111111111111';

  it('handles a successful 204 response', async () => {
    server.use(
      http.delete(`${baseUrl}/v1/projects/${projectId}`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(
      deleteProject(baseUrl, projectId),
    ).resolves.toBeUndefined();
  });

  it('rejects HTTP errors', async () => {
    server.use(
      http.delete(`${baseUrl}/v1/projects/${projectId}`, () => {
        return HttpResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Project not found',
            },
          },
          { status: 404 },
        );
      }),
    );

    await expect(
      deleteProject(baseUrl, projectId),
    ).rejects.toThrow('Project not found');
  });
});

describe('network failures', () => {
  it('reports a connection failure', async () => {
    server.use(
      http.get(`${baseUrl}/v1/projects`, () => {
        return HttpResponse.error();
      }),
    );

    await expect(
      getProjects(baseUrl),
    ).rejects.toThrow('Unable to connect to the API.');
  });
});