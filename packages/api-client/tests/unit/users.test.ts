import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '../setup.js';
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../../src/index.js';

const baseUrl = 'http://localhost:3001';

const user = {
  id: '770e8400-e29b-41d4-a716-446655440000',
  user_name: 'Lachlan',
  email: 'lachlan@example.com',
  profile_pic: null,
};

describe('getUsers', () => {
  it('returns users successfully', async () => {
    server.use(
      http.get(`${baseUrl}/v1/users`, () => HttpResponse.json([user])),
    );

    const result = await getUsers(baseUrl);

    expect(result).toEqual([user]);
  });

  it('sends limit and offset as query params', async () => {
    server.use(
      http.get(`${baseUrl}/v1/users`, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('limit')).toBe('10');
        expect(url.searchParams.get('offset')).toBe('20');

        return HttpResponse.json([user]);
      }),
    );

    await getUsers(baseUrl, 10, 20);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.get(`${baseUrl}/v1/users`, () =>
        HttpResponse.json([{ invalid: true }]),
      ),
    );

    await expect(getUsers(baseUrl)).rejects.toThrow();
  });
});

describe('createUser', () => {
  it('creates a user successfully', async () => {
    server.use(
      http.post(`${baseUrl}/v1/users`, async ({ request }) => {
        const body = await request.json();

        expect(body).toEqual({
          user_name: 'Lachlan',
          email: 'lachlan@example.com',
          password: 'password123',
        });

        return HttpResponse.json(user, { status: 201 });
      }),
    );

    const result = await createUser(baseUrl, {
      user_name: 'Lachlan',
      email: 'lachlan@example.com',
      password: 'password123',
    });

    expect(result).toEqual(user);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.post(`${baseUrl}/v1/users`, () =>
        HttpResponse.json({ invalid: true }, { status: 201 }),
      ),
    );

    await expect(
      createUser(baseUrl, {
        user_name: 'Lachlan',
        email: 'lachlan@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow();
  });
});

describe('getUser', () => {
  it('returns a user successfully', async () => {
    server.use(
      http.get(`${baseUrl}/v1/users/${user.id}`, () =>
        HttpResponse.json(user),
      ),
    );

    const result = await getUser(baseUrl, user.id);

    expect(result).toEqual(user);
  });

  it('URL-encodes the user ID', async () => {
    server.use(
      http.get(`${baseUrl}/v1/users/user%2Fid`, () =>
        HttpResponse.json(user),
      ),
    );

    const result = await getUser(baseUrl, 'user/id');

    expect(result).toEqual(user);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.get(`${baseUrl}/v1/users/${user.id}`, () =>
        HttpResponse.json({ invalid: true }),
      ),
    );

    await expect(getUser(baseUrl, user.id)).rejects.toThrow();
  });
});

describe('updateUser', () => {
  it('updates a user successfully', async () => {
    const updatedUser = {
      ...user,
      user_name: 'Updated Name',
    };

    server.use(
      http.put(`${baseUrl}/v1/users/${user.id}`, async ({ request }) => {
        const body = await request.json();

        expect(body).toEqual({
          user_name: 'Updated Name',
          email: 'lachlan@example.com',
          profile_pic: null,
        });

        return HttpResponse.json(updatedUser);
      }),
    );

    const result = await updateUser(baseUrl, user.id, {
      user_name: 'Updated Name',
      email: 'lachlan@example.com',
      profile_pic: null,
    });

    expect(result).toEqual(updatedUser);
  });

  it('rejects an invalid response', async () => {
    server.use(
      http.put(`${baseUrl}/v1/users/${user.id}`, () =>
        HttpResponse.json({ invalid: true }),
      ),
    );

    await expect(
      updateUser(baseUrl, user.id, {
        user_name: 'Updated Name',
        email: 'lachlan@example.com',
      }),
    ).rejects.toThrow();
  });
});

describe('deleteUser', () => {
  it('deletes a user successfully', async () => {
    server.use(
      http.delete(
        `${baseUrl}/v1/users/${user.id}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(deleteUser(baseUrl, user.id)).resolves.toBeUndefined();
  });

  it('throws an error for an HTTP failure', async () => {
    server.use(
      http.delete(`${baseUrl}/v1/users/${user.id}`, () =>
        HttpResponse.json(
          { error: { message: 'User not found' } },
          { status: 404 },
        ),
      ),
    );

    await expect(deleteUser(baseUrl, user.id)).rejects.toThrow(
      'User not found',
    );
  });
});