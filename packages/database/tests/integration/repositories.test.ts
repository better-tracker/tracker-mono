import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { migrate } from '../../src/migrate.js';

describe('project and subtask repository pagination', () => {
  let container: StartedPostgreSqlContainer | undefined;
  let database: typeof import('../../src/index.js') | undefined;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').start();
    vi.stubEnv('DATABASE_URL', container.getConnectionUri());
    database = await import('../../src/index.js');
    await migrate(database.pool, fileURLToPath(new URL('../../migrations/', import.meta.url)));
  });

  afterAll(async () => {
    try {
      await database?.pool.end();
    } finally {
      vi.unstubAllEnvs();
      await container?.stop();
    }
  });

  it('pages projects and subtasks and can load all subtasks for project detail', async () => {
    const db = database!;
    const project = await db.createProject({ name: 'Parent' });
    for (let i = 0; i < 44; i++) await db.createProject({ name: `Project ${i}` });
    for (let i = 0; i < 45; i++) {
      await db.createSubtask({ project_id: project.id, description: `Task ${i}` });
    }
    const other = (await db.listProjects()).find((row) => row.id !== project.id)!;
    await db.createSubtask({ project_id: other.id, description: 'Other task' });

    const firstProjects = await db.listProjects();
    const nextProjects = await db.listProjects(40, 40);
    expect(firstProjects).toHaveLength(40);
    expect(nextProjects).toHaveLength(5);
    expect(new Set([...firstProjects, ...nextProjects].map((row) => row.id)).size).toBe(45);

    const firstTasks = await db.listSubtasksByProject(project.id);
    const nextTasks = await db.listSubtasksByProject(project.id, 40, 40);
    const allTasks = await db.listSubtasksByProject(project.id, null);
    expect(firstTasks).toHaveLength(40);
    expect(nextTasks).toHaveLength(5);
    expect(allTasks).toEqual([...firstTasks, ...nextTasks]);
    expect(allTasks.every((row) => row.project_id === project.id)).toBe(true);
    expect(await db.listSubtasksByProject(project.id.toUpperCase(), null)).toEqual(allTasks);
  });
});
