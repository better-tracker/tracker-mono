import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createPool, createUserRepository, pool as defaultPool,
  createProject, getProjectById, listProjects, updateProject, deleteProject,
  createSubtask, getSubtaskById, listSubtasksByProject, updateSubtask, deleteSubtask,
} from '../../src/index.js';
import { migrate } from '../../src/migrate.js';

const migrationsDir = fileURLToPath(new URL('../../migrations/', import.meta.url));

describe('repositories with caller-owned PostgreSQL pools', () => {
  let container: StartedPostgreSqlContainer | undefined;
  let database: ReturnType<typeof createPool> | undefined;
  let other: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').withDatabase('repositories').start();
    database = createPool(container.getConnectionUri());
    await database.query('CREATE DATABASE repositories_other');
    const otherUrl = new URL(container.getConnectionUri());
    otherUrl.pathname = '/repositories_other';
    other = createPool(otherUrl.toString());
    await migrate(database, migrationsDir);
    await migrate(other, migrationsDir);
  });
  beforeEach(async () => {
    await database!.query('TRUNCATE users, projects CASCADE');
    await other!.query('TRUNCATE users, projects CASCADE');
  });
  afterAll(async () => {
    try {
      await Promise.all([database?.end(), other?.end()]);
    } finally {
      await container?.stop();
    }
  });

  it('preserves project records, pagination, null updates, and delete results', async () => {
    const project = await createProject({ name: 'First', description: 'Keep' }, database!);
    const second = await createProject({ name: 'Second' }, database!);
    expect(project.created_at).toBeInstanceOf(Date);
    expect(second.description).toBeNull();
    expect(await updateProject(project.id, { name: 'Renamed' }, database!)).toMatchObject({ description: 'Keep', name: 'Renamed' });
    expect(await updateProject(project.id, { description: null }, database!)).toMatchObject({ description: null });
    const all = await listProjects(10, 0, database!);
    expect(await listProjects(1, 1, database!)).toEqual(all.slice(1, 2));
    expect(await deleteProject(project.id, database!)).toBe(true);
    expect(await getProjectById(project.id, database!)).toBeNull();
    expect(await updateProject(project.id, { name: 'Missing' }, database!)).toBeNull();
    expect(await deleteProject(project.id, database!)).toBe(false);
  });

  it('retains legacy nullable subtask descriptions and explicit false updates', async () => {
    const project = await createProject({ name: 'Parent' }, database!);
    const subtask = await createSubtask({ project_id: project.id }, database!);
    expect(subtask).toMatchObject({ description: null, completed: false, project_id: project.id });
    expect(subtask.created_at).toBeInstanceOf(Date);
    expect(subtask.updated_at).toBeInstanceOf(Date);
    await updateSubtask(subtask.id, { description: 'Keep', completed: true }, database!);
    expect(await updateSubtask(subtask.id, { completed: false }, database!)).toMatchObject({ description: 'Keep', completed: false });
    expect(await updateSubtask(subtask.id, { description: null }, database!)).toMatchObject({ description: null, completed: false });
    expect(await listSubtasksByProject(project.id, 10, 0, database!)).toEqual([await getSubtaskById(subtask.id, database!)]);
    expect(await deleteSubtask(subtask.id, database!)).toBe(true);
    expect(await updateSubtask(subtask.id, { completed: true }, database!)).toBeNull();
    expect(await deleteSubtask(subtask.id, database!)).toBe(false);
  });

  it('retains public user projections, partial updates, uniqueness errors, and absent rows', async () => {
    const users = createUserRepository(database!);
    const user = await users.createUser({ user_name: 'alice', email: 'a@example.com', profile_pic: 'avatar.png', passwordHash: 'existing-hash' });
    expect(Object.keys(user).sort()).toEqual(['email', 'id', 'profile_pic', 'user_name']);
    expect(await users.getUsers()).toEqual([user]);
    expect(await users.updateUser(user.id, { user_name: 'renamed' })).toMatchObject({ profile_pic: 'avatar.png', email: 'a@example.com' });
    expect(await users.updateUser(user.id, { profile_pic: null })).toMatchObject({ profile_pic: null });
    expect(await users.updateUser(user.id, {})).toEqual(await users.getUserById(user.id));
    await expect(users.createUser({ user_name: 'renamed', email: 'other@example.com', passwordHash: 'existing-hash' })).rejects.toMatchObject({ code: '23505' });
    expect(await users.deleteUser(user.id)).toBe(true);
    expect(await users.getUserById(user.id)).toBeNull();
    expect(await users.updateUser(user.id, { email: 'missing@example.com' })).toBeNull();
    expect(await users.deleteUser(user.id)).toBe(false);
  });

  it('isolates injected databases and keeps both caller-owned pools usable', async () => {
    await createProject({ name: 'First database' }, database!);
    await createProject({ name: 'Other database' }, other!);
    expect((await listProjects(10, 0, database!)).map((project) => project.name)).toEqual(['First database']);
    expect((await listProjects(10, 0, other!)).map((project) => project.name)).toEqual(['Other database']);
    expect((await database!.query('SELECT 1 AS alive')).rows).toEqual([{ alive: 1 }]);
    expect((await other!.query('SELECT 1 AS alive')).rows).toEqual([{ alive: 1 }]);
    expect(defaultPool.totalCount).toBe(0);
  });
});
