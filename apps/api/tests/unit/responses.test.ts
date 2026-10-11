import {
  projectListResponseSchema,
  projectResponseSchema,
  subtaskListResponseSchema,
  subtaskResponseSchema,
} from '@project-tracker/contracts';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

const projectId = '11111111-1111-4111-8111-111111111111';
const subtaskId = '22222222-2222-4222-8222-222222222222';
const projects = '/v1/projects';
const project = `${projects}/${projectId}`;
const subtasks = `${project}/subtasks`;
const subtask = `${subtasks}/${subtaskId}`;

describe('project and subtask HTTP responses', () => {
  let app: FastifyInstance;

  beforeEach(() => { app = buildApp(); });
  afterEach(async () => { await app.close(); });

  it.each([
    { label: 'projects', url: projects, schema: projectListResponseSchema },
    { label: 'subtasks', url: subtasks, schema: subtaskListResponseSchema },
  ])('returns a schema-valid $label list', async ({ url, schema }) => {
    const response = await app.inject({ method: 'GET', url });

    expect(response.statusCode).toBe(200);
    expect(schema.safeParse(response.json<unknown>()).success).toBe(true);
  });

  it.each([
    { label: 'omitted', payload: { name: 'New project' } },
    { label: 'null', payload: { name: 'New project', description: null } },
  ])('creates a project with a null description when $label', async ({ payload }) => {
    const response = await app.inject({ method: 'POST', url: projects, payload });

    expect(response.statusCode).toBe(201);
    expect(response.json<unknown>()).toMatchObject({ name: payload.name, description: null });
  });

  it.each([
    { label: 'omitted', payload: { description: 'New subtask' }, expected: false },
    { label: 'false', payload: { description: 'New subtask', completed: false }, expected: false },
    { label: 'true', payload: { description: 'New subtask', completed: true }, expected: true },
  ])('creates a subtask with completion $label', async ({ payload, expected }) => {
    const response = await app.inject({ method: 'POST', url: subtasks, payload });

    expect(response.statusCode).toBe(201);
    expect(response.json<unknown>()).toMatchObject({
      description: payload.description, completed: expected,
    });
  });

  it.each([
    { name: 'Updated project', description: null },
    { name: 'Updated project', description: 'Updated description' },
  ])('returns submitted project update fields: $description', async (payload) => {
    const response = await app.inject({ method: 'PUT', url: project, payload });

    expect(response.statusCode).toBe(200);
    expect(response.json<unknown>()).toMatchObject({ id: projectId, ...payload });
  });

  it.each([false, true])('returns submitted subtask fields with completion %s', async (completed) => {
    const payload = { description: 'Updated subtask', completed };
    const response = await app.inject({ method: 'PUT', url: subtask, payload });

    expect(response.statusCode).toBe(200);
    expect(response.json<unknown>()).toMatchObject({ id: subtaskId, ...payload });
  });

  it.each([
    { label: 'project', url: project },
    { label: 'subtask', url: subtask },
  ])('deletes a $label with a bodyless 204 response', async ({ url }) => {
    const response = await app.inject({ method: 'DELETE', url });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
  });

  // Enable as temporary controllers adopt shared response contracts. These tests
  // deliberately do not bless placeholder IDs or omit required response fields.
  it.skip.each([
    {
      method: 'POST', url: projects, payload: { name: 'New project' }, status: 201,
      schema: projectResponseSchema, reason: 'placeholder ID, missing dates and subtasks',
    },
    {
      method: 'GET', url: project, status: 200,
      schema: projectResponseSchema, reason: 'missing dates and subtasks',
    },
    {
      method: 'PUT', url: project, payload: { name: 'Updated project', description: null }, status: 200,
      schema: projectResponseSchema, reason: 'missing dates and subtasks',
    },
    {
      method: 'POST', url: subtasks, payload: { description: 'New subtask' }, status: 201,
      schema: subtaskResponseSchema, reason: 'placeholder ID and missing dates',
    },
    {
      method: 'GET', url: subtask, status: 200,
      schema: subtaskResponseSchema, reason: 'missing dates',
    },
    {
      method: 'PUT', url: subtask, payload: { description: 'Updated subtask', completed: true }, status: 200,
      schema: subtaskResponseSchema, reason: 'missing dates',
    },
  ] as const)('$method $url matches its response schema [pending: $reason]', async (testCase) => {
    const { schema, status, method, url } = testCase;
    const response = await app.inject({
      method, url, ...('payload' in testCase ? { payload: testCase.payload } : {}),
    });

    expect(response.statusCode).toBe(status);
    expect(schema.safeParse(response.json<unknown>()).success).toBe(true);
  });

  // The request hooks currently discard Zod's normalized output.
  it.skip.each([
    {
      method: 'POST', url: projects,
      payload: { name: '  New project  ', description: '  Description  ' },
      expected: { name: 'New project', description: 'Description' }, status: 201,
    },
    {
      method: 'PUT', url: project,
      payload: { name: '  Updated project  ', description: '  Description  ' },
      expected: { name: 'Updated project', description: 'Description' }, status: 200,
    },
    {
      method: 'POST', url: subtasks, payload: { description: '  New subtask  ' },
      expected: { description: 'New subtask', completed: false }, status: 201,
    },
    {
      method: 'PUT', url: subtask, payload: { description: '  Updated subtask  ', completed: true },
      expected: { description: 'Updated subtask', completed: true }, status: 200,
    },
    {
      method: 'POST', url: '/v1/users',
      payload: { user_name: '  alice  ', email: 'alice@example.com', password: 'test-password' },
      expected: { user_name: 'alice' }, status: 201,
    },
    {
      method: 'PUT', url: '/v1/users/33333333-3333-4333-8333-333333333333',
      payload: { user_name: '  updated  ', email: 'updated@example.com' },
      expected: { user_name: 'updated' }, status: 200,
    },
  ] as const)('$method $url returns normalized text [pending: parsed body discarded]', async ({ expected, status, ...request }) => {
    const response = await app.inject(request);

    expect(response.statusCode).toBe(status);
    // Assert the raw HTTP body: parsing it with Zod would hide untrimmed text.
    expect(response.json<unknown>()).toMatchObject(expected);
  });
});
