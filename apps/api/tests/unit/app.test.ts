import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../src/app.js';

const projectId = '11111111-1111-4111-8111-111111111111';
const subtaskId = '22222222-2222-4222-8222-222222222222';
const projects = '/v1/projects';
const project = `${projects}/${projectId}`;
const subtasks = `${project}/subtasks`;
const subtask = `${subtasks}/${subtaskId}`;

describe('application lifecycle and routing', () => {
  let app: FastifyInstance;

  beforeEach(() => { app = buildApp(); });
  afterEach(async () => { await app.close(); });

  it('boots and closes plugins without opening a listening socket', async () => {
    const onClose = vi.fn();
    app.addHook('onClose', async () => { onClose(); });
    await app.ready();
    expect(app.server.listening).toBe(false);
    await app.close();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it.each([
    { method: 'GET', url: projects, status: 200 },
    { method: 'POST', url: projects, payload: { name: 'Test project' }, status: 201 },
    { method: 'GET', url: project, status: 200 },
    { method: 'PUT', url: project, payload: { name: 'Updated project', description: null }, status: 200 },
    { method: 'DELETE', url: project, status: 204 },
    { method: 'GET', url: subtasks, status: 200 },
    { method: 'POST', url: subtasks, payload: { description: 'Test subtask' }, status: 201 },
    { method: 'GET', url: subtask, status: 200 },
    { method: 'PUT', url: subtask, payload: { description: 'Updated subtask', completed: true }, status: 200 },
    { method: 'DELETE', url: subtask, status: 204 },
  ] as const)('registers $method $url', async ({ status, ...request }) => {
    const response = await app.inject(request);
    expect(response.statusCode).toBe(status);
    if (status === 204) expect(response.body).toBe('');
  });

  it('returns 404 for an unregistered route', async () => {
    const response = await app.inject({ method: 'GET', url: '/unknown' });
    expect(response.statusCode).toBe(404);
  });
});
