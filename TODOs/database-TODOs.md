# Database — packages/database

Purpose: store projects, subtasks, and users in PostgreSQL. Read the
[status conventions](README.md) and [issue map](github-issues.md) first.

## Implemented

- [x] Define projects, subtasks, and users tables in numbered SQL migrations —
  [#9](https://github.com/better-tracker/tracker-mono/issues/9) (closed).
  Evidence: [001](../packages/database/migrations/001_create_projects_and_subtasks.sql)
  and [002](../packages/database/migrations/002_create_users.sql).
- [x] Generate UUIDs in PostgreSQL, default subtasks to incomplete, and store
  project/subtask timestamps as `TIMESTAMPTZ`.
- [x] Require an existing project for each subtask, cascade project deletion to its
  subtasks, and index `subtasks.project_id`.
- [x] Require unique usernames/emails; allow nullable profile pictures. The users
  table requires a password value, but does not itself implement hashing.
- [x] Apply pending migrations in filename order, record applied files, skip
  reruns, and roll back failed migrations —
  [#10](https://github.com/better-tracker/tracker-mono/issues/10) (closed).
  Evidence: [migrate.ts](../packages/database/src/migrate.ts) and the `migrate`
  command in [package.json](../packages/database/package.json).
- [x] Close migration-runner connections and keep migration imports free of
  automatic connections/settings reads.
- [x] Use SQL/pg without an ORM and keep database imports out of client apps.
- [x] Provide local PostgreSQL in [compose.yml](../compose.yml) and integration
  tests in [migrations.test.ts](../packages/database/tests/integration/migrations.test.ts).
  All 6 tests passed in this audit; this does not verify the development Compose
  instance is running or healthy.

## Partial implementation

- [ ] Provide a reusable API database connection via `DATABASE_URL` —
  [#11](https://github.com/better-tracker/tracker-mono/issues/11) is **closed**, but
  only the migration runner opens a pool. There is no `src/client.ts`, the package
  entry point is `export {}`, and the API has no database dependency.
  Reconcile the ticket with this checkout before treating it as complete.
- [ ] Apply agreed field constraints consistently. SQL permits a null subtask
  description and has no text-length/nonblank checks; the shared schemas require
  nonblank descriptions up to 2000 characters and names up to 255 characters.
  No matching follow-up ticket found; related table work is #9.

## Remaining work

- [ ] Add user database functions/repository —
  [#12](https://github.com/better-tracker/tracker-mono/issues/12) (closed; code missing).
- [ ] Add project CRUD/list repository functions —
  [#13](https://github.com/better-tracker/tracker-mono/issues/13) (closed; code missing).
- [ ] Add subtask CRUD/list functions scoped to their project —
  [#14](https://github.com/better-tracker/tracker-mono/issues/14) (closed; code missing).
- [ ] Parameterize user values in repository SQL. Parameterized migration queries
  and test inserts exist, but product repository queries do not.
- [ ] Use transactions when related product writes must succeed or fail together.
  Migration transactions are already implemented under #10.
- [ ] Add idempotent seed data: one project and two subtasks, one complete and one
  incomplete — [#15](https://github.com/better-tracker/tracker-mono/issues/15)
  (closed; no seed file or command exists).
- [ ] Ensure subtask edits update `updated_at`. SQL only sets its creation default;
  no update repository or trigger exists. Related: #14 and
  [#22](https://github.com/better-tracker/tracker-mono/issues/22).
- [ ] Implement password hashing before saving user passwords; never persist
  plaintext. Related: #12 and
  [#20](https://github.com/better-tracker/tracker-mono/issues/20).
- [ ] Close the reusable pool when the API shuts down. Migration pool cleanup does
  not implement API pool cleanup. Related: #11 and
  [#19](https://github.com/better-tracker/tracker-mono/issues/19).

## Acceptance checks still needed

- [ ] Start local PostgreSQL with `docker compose up -d postgres` and verify it is
  healthy/reachable on `localhost:5432`.
- [ ] Test repository saving, reading, updating, deletion, and project scoping
  against an isolated test database. Existing tests cover migrations/constraints.
- [ ] Run seeding twice without duplicate examples.
- [ ] Verify API persistence across restart and connection cleanup on shutdown.

## Technical documentation — NO AI Allowed

- [ ] Write packages/database/README.md manually. Explain tables, relationships,
  setup, migration and seed commands, and how to reset local data.
