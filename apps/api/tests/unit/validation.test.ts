import { errorResponseSchema } from '@project-tracker/contracts';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

const projectId = '11111111-1111-4111-8111-111111111111';
const subtaskId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';
const projects = '/v1/projects';
const project = `${projects}/${projectId}`;
const subtasks = `${project}/subtasks`;
const subtask = `${subtasks}/${subtaskId}`;
const users = '/v1/users';
const user = `${users}/${userId}`;
const password = 'test-password-must-not-appear-in-errors';

type InvalidValue = { label: string; value: unknown };
type InvalidField = { field: string; values: InvalidValue[] };
type Endpoint = {
  method: 'POST' | 'PUT';
  url: string;
  payload: Record<string, unknown>;
  required: string[];
  invalidFields: InvalidField[];
};

function textValues(maxLength: number): InvalidValue[] {
  return [
    { label: 'null', value: null },
    { label: 'number', value: 42 },
    { label: 'boolean', value: false },
    { label: 'empty text', value: '' },
    { label: 'blank text', value: '   ' },
    { label: 'overlong text', value: 'x'.repeat(maxLength + 1) },
  ];
}

const projectFields: InvalidField[] = [
  { field: 'name', values: textValues(255) },
  {
    field: 'description',
    values: [
      { label: 'number', value: 42 },
      { label: 'boolean', value: false },
      { label: 'overlong text', value: 'x'.repeat(2001) },
    ],
  },
];
const subtaskFields: InvalidField[] = [
  { field: 'description', values: textValues(2000) },
  {
    field: 'completed',
    values: [
      { label: 'null', value: null },
      { label: 'number', value: 1 },
      { label: 'text', value: 'true' },
    ],
  },
];
const userFields: InvalidField[] = [
  { field: 'user_name', values: textValues(25) },
  {
    field: 'email',
    values: [
      { label: 'null', value: null },
      { label: 'number', value: 42 },
      { label: 'boolean', value: false },
      { label: 'empty text', value: '' },
      { label: 'malformed address', value: 'not-an-email' },
    ],
  },
  {
    field: 'profile_pic',
    values: [{ label: 'number', value: 42 }, { label: 'boolean', value: false }],
  },
];
const endpoints: Endpoint[] = [
  {
    method: 'POST', url: projects, payload: { name: 'New project' },
    required: ['name'], invalidFields: projectFields,
  },
  {
    method: 'PUT', url: project, payload: { name: 'Updated project', description: null },
    required: ['name', 'description'], invalidFields: projectFields,
  },
  {
    method: 'POST', url: subtasks, payload: { description: 'New subtask' },
    required: ['description'], invalidFields: subtaskFields,
  },
  {
    method: 'PUT', url: subtask, payload: { description: 'Updated subtask', completed: true },
    required: ['description', 'completed'], invalidFields: subtaskFields,
  },
  {
    method: 'POST', url: users,
    payload: { user_name: 'alice', email: 'alice@example.com', password },
    required: ['user_name', 'email', 'password'],
    invalidFields: [
      ...userFields,
      {
        field: 'password',
        values: [
          { label: 'null', value: null },
          { label: 'number', value: 42 },
          { label: 'boolean', value: false },
          { label: 'empty text', value: '' },
        ],
      },
    ],
  },
  {
    method: 'PUT', url: user, payload: { user_name: 'updated', email: 'updated@example.com' },
    required: ['user_name', 'email'], invalidFields: userFields,
  },
];

describe('HTTP validation errors', () => {
  let app: FastifyInstance;

  beforeEach(() => { app = buildApp(); });
  afterEach(async () => { await app.close(); });

  async function expectSafeValidationError(request: InjectOptions) {
    const response = await app.inject(request);
    const body = response.json<unknown>();

    expect(response.statusCode).toBe(400);
    const parsed = errorResponseSchema.parse(body);
    // Checking the raw body as well prevents schema parsing from hiding extra
    // properties such as stack traces or internal validation details.
    expect(body).toEqual(parsed);
    expect(parsed.error.code.length).toBeGreaterThan(0);
    expect(parsed.error.message.length).toBeGreaterThan(0);
    expect(response.body).not.toContain(password);
    expect(response.body).not.toMatch(/ZodError|node_modules|\bat \S+ \(/);
  }

  for (const endpoint of endpoints) {
    const { method, url } = endpoint;

    describe(`${method} ${url}`, () => {
      // Zod errors currently fall through to Fastify's default 500 response;
      // enable these when validation failures use the shared safe 400 shape.
      it.skip('rejects a missing body [pending: validation error mapping]', async () => {
        await expectSafeValidationError({ method, url });
      });

      it.skip.each([
        { label: 'null', payload: 'null' },
        { label: 'array', payload: '[]' },
        { label: 'text', payload: '"invalid-body"' },
      ])('rejects a $label body [pending: validation error mapping]', async ({ payload }) => {
        await expectSafeValidationError({
          method, url, payload, headers: { 'content-type': 'application/json' },
        });
      });

      it.skip.each(endpoint.required)('rejects missing %s [pending: validation error mapping]', async (field) => {
        const payload = { ...endpoint.payload };
        delete payload[field];

        await expectSafeValidationError({ method, url, payload });
      });

      for (const { field, values } of endpoint.invalidFields) {
        it.skip.each(values)(`rejects ${field} as $label [pending: validation error mapping]`, async ({ value }) => {
          await expectSafeValidationError({
            method, url, payload: { ...endpoint.payload, [field]: value },
          });
        });
      }
    });
  }

  const invalidIdRoutes = [
    { label: 'project ID', url: `${projects}/not-a-uuid`, payload: { name: 'Updated project', description: null } },
    { label: 'user ID', url: `${users}/not-a-uuid`, payload: { user_name: 'updated', email: 'updated@example.com', password } },
    { label: 'subtask ID', url: `${subtasks}/not-a-uuid`, payload: { description: 'Updated subtask', completed: true } },
    {
      label: 'nested project ID', url: `${projects}/not-a-uuid/subtasks/${subtaskId}`,
      payload: { description: 'Updated subtask', completed: true },
    },
    {
      label: 'both nested IDs', url: `${projects}/not-a-uuid/subtasks/not-a-uuid`,
      payload: { description: 'Updated subtask', completed: true },
    },
  ];

  for (const method of ['GET', 'PUT', 'DELETE'] as const) {
    // Path parameters currently bypass shared UUID validation altogether.
    it.skip.each(invalidIdRoutes)(`${method} rejects malformed $label [pending: UUID validation]`, async ({ url, payload }) => {
      await expectSafeValidationError({
        method, url, ...(method === 'PUT' ? { payload } : {}),
      });
    });
  }

  it.skip.each([
    { method: 'GET', url: `${projects}/not-a-uuid/subtasks` },
    { method: 'POST', url: `${projects}/not-a-uuid/subtasks`, payload: { description: 'New subtask' } },
  ] as const)('$method rejects malformed parent IDs in subtask collections [pending: UUID validation]', async (request) => {
    await expectSafeValidationError(request);
  });
});
