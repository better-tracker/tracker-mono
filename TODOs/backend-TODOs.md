# Backend — apps/api

Purpose: handle HTTP requests, apply rules, and return stored records. Route
registration and temporary responses are implemented; persistent CRUD is not.

## Implemented

- [x] Separate [app.ts](../apps/api/src/app.ts) setup from
  [server.ts](../apps/api/src/server.ts) startup.
- [x] Keep JSON logs, listen on `0.0.0.0`, and close Fastify on SIGINT/SIGTERM.
- [x] Validate PORT in [env.ts](../apps/api/src/config/env.ts); default to 3001 and
  accept overrides such as 6969. Tests instantiate the app without a live port.
- [x] Register project, subtask, and user routes with controllers. Related:
  [#21](https://github.com/better-tracker/tracker-mono/issues/21),
  [#22](https://github.com/better-tracker/tracker-mono/issues/22),
  [#20](https://github.com/better-tracker/tracker-mono/issues/20).
- [x] Provide Fastify `inject()` routing/lifecycle tests and PORT tests in
  [tests/unit](../apps/api/tests/unit). All 24 passed during this audit.
  Registered handlers use 200/201/204, and DELETE returns no body.

Registered URLs (all currently backed by temporary controllers):

| Resource | Collection methods | Item methods |
| --- | --- | --- |
| `/v1/projects` | GET, POST | GET, PUT, DELETE at `/:id` |
| `/v1/projects/:projectId/subtasks` | GET, POST | GET, PUT, DELETE at `/:id` |
| `/v1/users` | GET, POST | GET, PUT, DELETE at `/:id` |

## Partial implementation

- [ ] Finish configuration —
  [#19](https://github.com/better-tracker/tracker-mono/issues/19) (open).
  PORT validation exists; `DATABASE_URL` validation, a database pool, CORS, and
  a shared safe error handler do not.
- [ ] Finish persistent project CRUD —
  [#21](https://github.com/better-tracker/tracker-mono/issues/21) (open).
  [Controllers](../apps/api/src/modules/projects/projects.controller.ts) return
  empty lists or fixed/echoed values; creates use `temporary-id`; writes save nothing.
- [ ] Finish persistent subtask CRUD/completion —
  [#22](https://github.com/better-tracker/tracker-mono/issues/22) (open).
  [Controllers](../apps/api/src/modules/subtasks/subtasks.controller.ts) return
  temporary data and do not verify the URL's project/subtask relationship.
- [ ] Finish persistent user CRUD —
  [#20](https://github.com/better-tracker/tracker-mono/issues/20) (open).
  [Controllers](../apps/api/src/modules/users/users.controller.ts) generate a UUID
  on create but save nothing; reads return a temporary user.
- [ ] Finish runtime validation —
  [#30](https://github.com/better-tracker/tracker-mono/issues/30) (open).
  All POST/PUT routes now call shared Zod body schemas in `preValidation`, so the
  ticket's original claim of no runtime schemas is stale. However, parsed output
  is discarded, UUID parameters are unchecked, and Zod failures have no 400 mapping.
  Project/subtask controllers also duplicate body types instead of shared DTOs.

## Remaining work

- [ ] Connect controllers/services to database repositories. Service files contain
  only comments. Related: #20–#22; database dependencies are in
  [#11–#14](database-TODOs.md).
- [ ] Return server-generated IDs/dates and schema-valid responses, including
  project detail subtasks. Related: #21 and #22.
- [ ] Update subtask `updatedAt` on every edit; check project membership before
  reading, updating, or deleting a subtask. Related: #22.
- [ ] Return 400 for invalid bodies/IDs, 404 for missing records, and a safe shared
  500 error for unexpected failures. Related: #19, #20–#22, #30.
- [ ] Require all agreed editable PUT fields and pass parsed/normalized data into
  handlers. Body schemas require fields already; correct error handling and
  normalization are still needed. Related: #30 and #20.
- [ ] Configure allowed browser origins and clean up the database pool on shutdown.
  Related: #19 and #11.
- [ ] Implement safe user password storage before persistent user creation.
  Related: #20 and #12; user CRUD alone does not add login or authorization.

## Acceptance checks still needed

- [ ] Test invalid/missing/wrong-type bodies and malformed UUIDs with `inject()`.
- [ ] Test missing IDs and subtasks addressed under another project.
- [ ] Test persistent CRUD with PostgreSQL and verify data after API restart.
- [ ] Test response schema conformity, safe error details, and CORS behavior.
- [ ] Keep success statuses 200/201 and bodyless 204 after persistence is added.

Audit probes reproduced invalid project creation returning **500**, malformed
project IDs returning **200**, accepted names retaining surrounding whitespace,
and a created project not appearing in the following list request. Existing
routing tests pass because they exercise the temporary handlers.

## Technical documentation — NO AI Allowed

- [ ] Write apps/api/README.md manually: startup, settings, and how requests are handled.
- [ ] Write apps/api/docs/endpoints.md manually: URLs, input/output examples,
  response status codes, and instructions for trying requests locally.
