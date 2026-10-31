import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPool,
  pool,
  createUserRepository,
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
  createSubtask,
  getSubtaskById,
  listSubtasksByProject,
  updateSubtask,
  deleteSubtask,
  createUser,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
} from '../../src/index.js';

const id = '11111111-1111-4111-8111-111111111111';
const query = vi.fn();
const database = { query };
const row = { id };

beforeEach(() => {
  query.mockReset().mockResolvedValue({ rows: [row], rowCount: 1 });
  vi.spyOn(pool, 'query').mockImplementation(() => {
    throw new Error('Unexpected default database access');
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('injected repository connection', () => {
  it('creates pools lazily without opening connections', async () => {
    const owned = createPool(
      'postgresql://isolated:isolated@localhost:1/unused',
    );
    expect(owned.totalCount).toBe(0);
    await owned.end();
    expect(pool.totalCount).toBe(0);
  });

  const records = [
    {
      name: 'project',
      get: () => getProjectById(id, database),
      update: () => updateProject(id, {}, database),
      remove: () => deleteProject(id, database),
    },
    {
      name: 'subtask',
      get: () => getSubtaskById(id, database),
      update: () => updateSubtask(id, {}, database),
      remove: () => deleteSubtask(id, database),
    },
    {
      name: 'user',
      get: () => getUserById(id, database),
      update: () => updateUser(id, {}, database),
      remove: () => deleteUser(id, database),
    },
  ];

  it.each(records)(
    'uses the injected connection for $name lookups and empty updates',
    async ({ get, update }) => {
      expect(await get()).toEqual(row);
      expect(await update()).toEqual(row);
      expect(query).toHaveBeenCalledTimes(2);
      for (const [sql, values] of query.mock.calls) {
        expect(sql).toMatch(/^\s*SELECT\s/);
        expect(values).toEqual([id]);
      }
    },
  );

  it.each(records)(
    'returns null for absent $name lookups and empty updates',
    async ({ get, update }) => {
      query.mockResolvedValue({ rows: [], rowCount: 0 });
      expect(await get()).toBeNull();
      expect(await update()).toBeNull();
    },
  );

  it.each(records)(
    'preserves boolean $name delete outcomes',
    async ({ remove }) => {
      expect(await remove()).toBe(true);
      for (const rowCount of [0, null]) {
        query.mockResolvedValue({ rows: [], rowCount });
        expect(await remove()).toBe(false);
      }
      expect(query).toHaveBeenLastCalledWith(
        expect.stringMatching(/^DELETE FROM /),
        [id],
      );
    },
  );

  it('preserves creation defaults without interpolating user text into SQL', async () => {
    const text = "Name'; DROP TABLE projects; --";
    await createProject({ name: text }, database);
    expect(query).toHaveBeenLastCalledWith(expect.not.stringContaining(text), [
      text,
      null,
    ]);
    await createSubtask({ project_id: id }, database);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO subtasks'),
      [id, false, null],
    );
    await createUser(
      {
        user_name: 'alice',
        email: 'a@example.com',
        auth0_user_id: 'auth0|alice',
      },
      database,
    );
    expect(query).toHaveBeenLastCalledWith(
      expect.stringMatching(/RETURNING\s+id,\s+auth0_user_id,\s+user_name,\s+email,\s+profile_pic/),
      ['auth0|alice', 'alice', 'a@example.com', null],
    );
  });

  it('distinguishes omitted fields from explicit null/false updates', async () => {
    await updateProject(id, { description: null, name: undefined }, database);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('SET description = $1'),
      [null, id],
    );
    await updateSubtask(id, { description: null, completed: false }, database);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('description = $1, completed = $2'),
      [null, false, id],
    );
    await updateUser(id, { profile_pic: null, user_name: undefined }, database);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('SET profile_pic = $1'),
      [null, id],
    );
  });

  it('preserves null when an UPDATE finds no row', async () => {
    query.mockResolvedValue({ rows: [], rowCount: 0 });
    expect(await updateProject(id, { name: 'missing' }, database)).toBeNull();
    expect(await updateSubtask(id, { completed: true }, database)).toBeNull();
    expect(await updateUser(id, { user_name: 'missing' }, database)).toBeNull();
  });

  it('uses repository column mappings and binds the ID after defined update values', async () => {
    const email = "name'; DROP TABLE users; --";
    const updates = {
      user_name: undefined,
      email,
      profile_pic: null,
      passwordHash: 'new-hash',
      unexpected: 'ignored',
    };
    await updateUser(id, updates, database);
    const [sql, values] = query.mock.lastCall!;
    expect(sql).toContain('email = $1, profile_pic = $2');
    expect(sql).toContain('WHERE id = $3');
    expect(sql).not.toContain('unexpected');
    expect(sql).not.toContain(email);
    expect(values).toEqual([email, null, id]);
  });

  it('keeps list pagination parameters and explicit public user projections', async () => {
    await listProjects(7, 3, database);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [7, 3],
    );
    await listSubtasksByProject(id, 8, 4, database);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [id, 8, 4],
    );
    await getUsers(database);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringMatching(/SELECT\s+id,\s+auth0_user_id,\s+user_name,\s+email,\s+profile_pic\s+FROM users\s+ORDER BY user_name/),
    );
  });

  it('binds every public user operation to its injected repository connection', async () => {
    const users = createUserRepository(database);
    await users.getUsers();
    await users.createUser({
      user_name: 'alice',
      email: 'a@example.com',
      auth0_user_id: 'auth0|alice',
    });
    await users.getUserById(id);
    await users.updateUser(id, { profile_pic: null });
    await users.deleteUser(id);
    expect(query).toHaveBeenCalledTimes(5);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
