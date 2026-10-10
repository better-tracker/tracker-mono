import {
  userListResponseSchema,
  userResponseSchema,
} from '@project-tracker/contracts';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

const userId = '33333333-3333-4333-8333-333333333333';
const users = '/v1/users';
const user = `${users}/${userId}`;
const password = 'test-password-must-not-be-returned';
const profilePictures = [
  { label: 'omitted', fields: {}, expected: null },
  { label: 'null', fields: { profile_pic: null }, expected: null },
  {
    label: 'provided',
    fields: { profile_pic: 'https://example.com/avatar.png' },
    expected: 'https://example.com/avatar.png',
  },
];

describe('user HTTP responses', () => {
  let app: FastifyInstance;

  beforeEach(() => { app = buildApp(); });
  afterEach(async () => { await app.close(); });

  it('returns a schema-valid user list without password fields', async () => {
    const response = await app.inject({ method: 'GET', url: users });
    const body = response.json<unknown>();

    expect(response.statusCode).toBe(200);
    expect(userListResponseSchema.safeParse(body).success).toBe(true);
    expect(Array.isArray(body)).toBe(true);
    for (const item of body as unknown[]) {
      expect(item).not.toHaveProperty('password');
    }
  });

  it.each(profilePictures)('creates a user with a $label profile picture', async ({ fields, expected }) => {
    const response = await app.inject({
      method: 'POST',
      url: users,
      payload: { user_name: 'alice', email: 'alice@example.com', password, ...fields },
    });
    const body = response.json<unknown>();

    expect(response.statusCode).toBe(201);
    expect(userResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      user_name: 'alice', email: 'alice@example.com', profile_pic: expected,
    });
    expect(body).not.toHaveProperty('password');
    expect(response.body).not.toContain(password);
  });

  it('generates distinct valid IDs instead of echoing a client-supplied ID', async () => {
    const ids: string[] = [];

    for (const userName of ['alice', 'bob']) {
      const response = await app.inject({
        method: 'POST',
        url: users,
        payload: {
          id: userId, user_name: userName, email: `${userName}@example.com`, password,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = userResponseSchema.parse(response.json<unknown>());
      expect(body.id).not.toBe(userId);
      ids.push(body.id);
    }

    expect(ids[0]).not.toBe(ids[1]);
  });

  it('returns a schema-valid user with the requested ID and no password field', async () => {
    const response = await app.inject({ method: 'GET', url: user });
    const body = response.json<unknown>();

    expect(response.statusCode).toBe(200);
    expect(userResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({ id: userId });
    expect(body).not.toHaveProperty('password');
  });

  it.each(profilePictures)('updates a user with a $label profile picture', async ({ fields, expected }) => {
    const response = await app.inject({
      method: 'PUT',
      url: user,
      payload: {
        user_name: 'updated', email: 'updated@example.com', password, ...fields,
      },
    });
    const body = response.json<unknown>();

    expect(response.statusCode).toBe(200);
    expect(userResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      id: userId, user_name: 'updated', email: 'updated@example.com', profile_pic: expected,
    });
    expect(body).not.toHaveProperty('password');
    expect(response.body).not.toContain(password);
  });

  it('deletes a user with a bodyless 204 response', async () => {
    const response = await app.inject({ method: 'DELETE', url: user });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
  });
});
