import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { migrate } from '../../src/migrate.js';

const migrationsDir = fileURLToPath(new URL('../../migrations/', import.meta.url));

describe('PostgreSQL migrations', () => {
  let container: StartedPostgreSqlContainer | undefined;
  let admin: Pool | undefined;
  let pool: Pool | undefined;
  let databaseName: string | undefined;
  let nextDatabase = 0;
  const temporaryDirs: string[] = [];

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').withDatabase('test_admin').start();
    admin = new Pool({ connectionString: container.getConnectionUri() });
  });

  beforeEach(async () => {
    databaseName = `migration_test_${++nextDatabase}`;
    await admin!.query(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(container!.getConnectionUri());
    url.pathname = `/${databaseName}`;
    pool = new Pool({ connectionString: url.toString(), max: 1 });
  });

  afterEach(async () => {
    await pool?.end();
    pool = undefined;
    if (databaseName) await admin?.query(`DROP DATABASE "${databaseName}"`);
    databaseName = undefined;
    for (const dir of temporaryDirs.splice(0)) await rm(dir, { recursive: true, force: true });
  });

  afterAll(async () => {
    try { await admin?.end(); } finally { await container?.stop(); }
  });

  async function migrationFixture(files: Record<string, string>): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'project-tracker-migrations-'));
    temporaryDirs.push(dir);
    for (const [name, sql] of Object.entries(files)) await writeFile(join(dir, name), sql);
    return dir;
  }

  it('applies the real migrations in order and leaves data unchanged on reruns', async () => {
    await migrate(pool!, migrationsDir);
    const applied = await pool!.query('SELECT name, applied_at FROM migrations ORDER BY id');
    expect(applied.rows.map((row) => row.name)).toEqual([
      '001_create_projects_and_subtasks.sql', '002_create_users.sql',
    ]);
    expect(applied.rows.every((row) => row.applied_at instanceof Date)).toBe(true);
    const inserted = await pool!.query("INSERT INTO projects (name) VALUES ('Kept across reruns') RETURNING *");
    await migrate(pool!, migrationsDir);
    expect((await pool!.query('SELECT * FROM projects')).rows).toEqual(inserted.rows);
    expect((await pool!.query('SELECT name, applied_at FROM migrations ORDER BY id')).rows).toEqual(applied.rows);
  });

  it('sorts SQL filenames and ignores non-SQL files', async () => {
    const dir = await migrationFixture({
      '002_insert.sql': "INSERT INTO ordered_values (value) VALUES ('second');",
      '001_create.sql': 'CREATE TABLE ordered_values (value TEXT NOT NULL);',
      'notes.txt': 'This is not SQL.',
    });
    await migrate(pool!, dir);
    expect((await pool!.query('SELECT value FROM ordered_values')).rows).toEqual([{ value: 'second' }]);
    expect((await pool!.query('SELECT name FROM migrations ORDER BY id')).rows).toEqual([
      { name: '001_create.sql' }, { name: '002_insert.sql' },
    ]);
  });

  it('rolls back a failed migration, keeps earlier commits, and can retry after repair', async () => {
    const dir = await migrationFixture({
      '001_create.sql': 'CREATE TABLE committed_values (value TEXT);',
      '002_fail.sql': "INSERT INTO committed_values VALUES ('rolled back'); CREATE TABLE rolled_back (id INT); SELECT * FROM missing_table;",
    });
    await expect(migrate(pool!, dir)).rejects.toMatchObject({ code: '42P01' });
    expect((await pool!.query('SELECT * FROM committed_values')).rows).toEqual([]);
    expect((await pool!.query("SELECT to_regclass('rolled_back') AS table_name")).rows[0].table_name).toBeNull();
    expect((await pool!.query('SELECT name FROM migrations')).rows).toEqual([{ name: '001_create.sql' }]);
    await writeFile(join(dir, '002_fail.sql'), "INSERT INTO committed_values VALUES ('repaired');");
    await migrate(pool!, dir);
    expect((await pool!.query('SELECT * FROM committed_values')).rows).toEqual([{ value: 'repaired' }]);
    expect((await pool!.query('SELECT COUNT(*)::int AS count FROM migrations')).rows[0].count).toBe(2);
  });

  it('generates IDs and dates and defaults subtasks to incomplete', async () => {
    await migrate(pool!, migrationsDir);
    const project = (await pool!.query("INSERT INTO projects (name) VALUES ('Defaults') RETURNING *")).rows[0];
    const subtask = (await pool!.query('INSERT INTO subtasks (project_id) VALUES ($1) RETURNING *', [project.id])).rows[0];
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(project.id).toMatch(uuid);
    expect(subtask.id).toMatch(uuid);
    expect(subtask.id).not.toBe(project.id);
    expect(project.created_at).toBeInstanceOf(Date);
    expect(subtask.created_at).toBeInstanceOf(Date);
    expect(subtask.updated_at).toBeInstanceOf(Date);
    expect(subtask.completed).toBe(false);
    expect(project.description).toBeNull();
    // SQL currently permits this; the contract requires a description. See the roadmap.
    expect(subtask.description).toBeNull();
  });

  it('enforces required fields and foreign keys, and cascades only the deleted project', async () => {
    await migrate(pool!, migrationsDir);
    await expect(pool!.query('INSERT INTO projects DEFAULT VALUES')).rejects.toMatchObject({ code: '23502' });
    await expect(pool!.query('INSERT INTO subtasks DEFAULT VALUES')).rejects.toMatchObject({ code: '23502' });
    await expect(pool!.query('INSERT INTO subtasks (project_id) VALUES ($1)', [
      '11111111-1111-4111-8111-111111111111',
    ])).rejects.toMatchObject({ code: '23503' });
    const projects = (await pool!.query("INSERT INTO projects (name) VALUES ('Deleted'), ('Retained') RETURNING id")).rows;
    for (const project of projects) await pool!.query('INSERT INTO subtasks (project_id) VALUES ($1)', [project.id]);
    await pool!.query('DELETE FROM projects WHERE id = $1', [projects[0].id]);
    expect((await pool!.query('SELECT project_id FROM subtasks')).rows).toEqual([{ project_id: projects[1].id }]);
  });

  it('enforces unique usernames/emails and defaults profile pictures to null', async () => {
    await migrate(pool!, migrationsDir);
    const user = (await pool!.query(
      'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING *',
      ['alice', 'alice@example.com', 'test-hash'],
    )).rows[0];
    expect(user.profile_pic).toBeNull();
    await expect(pool!.query(
      'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3)',
      ['alice', 'another@example.com', 'test-hash'],
    )).rejects.toMatchObject({ code: '23505' });
    await expect(pool!.query(
      'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3)',
      ['another', 'alice@example.com', 'test-hash'],
    )).rejects.toMatchObject({ code: '23505' });
    await expect(pool!.query(
      "INSERT INTO users (user_name, email) VALUES ('missing-password', 'missing@example.com')",
    )).rejects.toMatchObject({ code: '23502' });
  });
});
