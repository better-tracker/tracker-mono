import { randomUUID } from 'node:crypto';
import { projectResponseSchema, subtaskResponseSchema } from '@project-tracker/contracts';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { database, projectId, subtaskId } from '../fixtures/database.js';

describe('project and subtask endpoint regressions', () => {
  let app: FastifyInstance;
  beforeEach(() => { app = buildApp(); });
  afterEach(async () => { await app.close(); });
  const projectUrl = `/v1/projects/${projectId}`;
  const subtasksUrl = `${projectUrl}/subtasks`;

  it('includes every saved subtask in project detail and update responses', async () => {
    for (let i = 0; i < 44; i++) {
      await database.createSubtask({ project_id: projectId, description: `Task ${i}` });
    }
    const other = await database.createProject({ name: 'Other project' });
    await database.createSubtask({ project_id: other.id, description: 'Other task' });

    for (const method of ['GET', 'PUT'] as const) {
      const response = await app.inject({
        method, url: projectUrl,
        ...(method === 'PUT' ? { payload: { name: 'Updated', description: null } } : {}),
      });
      expect(response.statusCode).toBe(200);
      const body = projectResponseSchema.parse(response.json());
      expect(body.subtasks).toHaveLength(45);
      expect(body.subtasks.some((task) => task.description === 'Other task')).toBe(false);
    }
  });

  it.each(['projects', 'subtasks'] as const)('can page past 40 %s without losing records', async (resource) => {
    for (let i = 0; i < 44; i++) {
      if (resource === 'projects') await database.createProject({ name: `Project ${i}` });
      else await database.createSubtask({ project_id: projectId, description: `Task ${i}` });
    }
    const url = resource === 'projects' ? '/v1/projects' : subtasksUrl;
    const first = await app.inject({ method: 'GET', url });
    const second = await app.inject({ method: 'GET', url: `${url}?limit=40&offset=40` });
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    const firstIds = first.json<{ id: string }[]>().map((row) => row.id);
    const secondIds = second.json<{ id: string }[]>().map((row) => row.id);
    expect(firstIds).toHaveLength(40);
    expect(secondIds).toHaveLength(5);
    expect(new Set([...firstIds, ...secondIds]).size).toBe(45);
  });

  it.each(['limit=0', 'limit=101', 'limit=1.5', 'limit=abc', 'offset=-1', 'offset=1.5', 'offset=9007199254740992'])(
    'rejects invalid pagination: %s', async (query) => {
      for (const url of ['/v1/projects', subtasksUrl]) {
        const response = await app.inject({ method: 'GET', url: `${url}?${query}` });
        expect(response.statusCode).toBe(400);
      }
    },
  );

  it('returns 404 for missing project collections and subtask creation', async () => {
    const url = `/v1/projects/${randomUUID()}/subtasks`;
    for (const method of ['GET', 'POST'] as const) {
      const response = await app.inject({ method, url, ...(method === 'POST' ? { payload: { description: 'Task' } } : {}) });
      expect(response.statusCode).toBe(404);
    }
    expect(database.createSubtask).not.toHaveBeenCalled();
  });

  it('returns 404 when the parent disappears during subtask creation', async () => {
    database.createSubtask.mockRejectedValueOnce({ code: '23503', constraint: 'fk_subtasks_project' });
    const response = await app.inject({ method: 'POST', url: subtasksUrl, payload: { description: 'Task' } });
    expect(response.statusCode).toBe(404);
  });

  it('keeps unexpected database errors as safe 500 responses', async () => {
    database.createSubtask.mockRejectedValueOnce(new Error('private database details'));
    const response = await app.inject({ method: 'POST', url: subtasksUrl, payload: { description: 'Task' } });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('private database details');
  });

  it.each(['GET', 'PUT', 'DELETE'] as const)('accepts uppercase UUIDs for subtask %s', async (method) => {
    // Ensure the project UUID contains letters regardless of random UUID generation.
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const task = await database.createSubtask({ project_id: id, description: 'Task' });
    const response = await app.inject({
      method, url: `/v1/projects/${id.toUpperCase()}/subtasks/${task.id.toUpperCase()}`,
      ...(method === 'PUT' ? { payload: { description: 'Updated', completed: true } } : {}),
    });
    expect(response.statusCode).toBe(method === 'DELETE' ? 204 : 200);
    if (method !== 'DELETE') expect(subtaskResponseSchema.safeParse(response.json()).success).toBe(true);
  });

  it.each(['GET', 'PUT', 'DELETE'] as const)('does not allow subtask %s under another project', async (method) => {
    const other = await database.createProject({ name: 'Other' });
    const response = await app.inject({
      method, url: `/v1/projects/${other.id}/subtasks/${subtaskId}`,
      ...(method === 'PUT' ? { payload: { description: 'Changed', completed: true } } : {}),
    });
    expect(response.statusCode).toBe(404);
    expect(database.updateSubtask).not.toHaveBeenCalled();
    expect(database.deleteSubtask).not.toHaveBeenCalled();
  });

  it.each(['GET', 'PUT', 'DELETE'] as const)('rejects malformed UUIDs before repository calls for %s', async (method) => {
    const response = await app.inject({
      method, url: '/v1/projects/not-a-uuid',
      ...(method === 'PUT' ? { payload: { name: 'Updated', description: null } } : {}),
    });
    expect(response.statusCode).toBe(400);
    expect(database.getProjectById).not.toHaveBeenCalled();
    expect(database.updateProject).not.toHaveBeenCalled();
    expect(database.deleteProject).not.toHaveBeenCalled();
  });

  it('makes created projects and subtasks visible in later reads and removes them on delete', async () => {
    const created = await app.inject({ method: 'POST', url: '/v1/projects', payload: { name: 'New project' } });
    expect(created.statusCode).toBe(201);
    const project = projectResponseSchema.parse(created.json());
    expect(project.subtasks).toEqual([]);
    const url = `/v1/projects/${project.id}`;
    const taskResponse = await app.inject({ method: 'POST', url: `${url}/subtasks`, payload: { description: 'New task' } });
    expect(taskResponse.statusCode).toBe(201);
    const task = subtaskResponseSchema.parse(taskResponse.json());
    const detail = await app.inject({ method: 'GET', url });
    expect(projectResponseSchema.parse(detail.json()).subtasks).toEqual([task]);
    expect((await app.inject({ method: 'DELETE', url })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: `${url}/subtasks/${task.id}` })).statusCode).toBe(404);
  });
});
