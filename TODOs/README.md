# Project Tracker work plan

Audited on **11 October 2026** against checkout `test-bot` at `f35c2b7` and all
20 GitHub issues in `better-tracker/tracker-mono` (open and closed).
The checkout matched the local `origin/main` ref at audit time.

These are planning checklists. `[x]` means the described implementation exists;
`[ ]` means work or verification remains. Partial work stays unchecked and explains
what is already present. A closed GitHub issue does not prove code is implemented.
See the [issue map](github-issues.md) for ticket states, evidence, and discrepancies.
Keep this directory named `TODOs/`, matching the tracked repository path.

## Current implementation

| Area | Implemented | Still needed | Checklist |
| --- | --- | --- | --- |
| Database | Three tables, numbered migrations, transactional runner, integration tests | Reusable API connection, repositories, seed data, schema alignment | [Database](database-TODOs.md) |
| Contracts | Zod schemas/types for projects, subtasks, users, and errors; schema tests | Adoption throughout API/client/apps; database alignment | [Contracts](contracts-TODOs.md) |
| Backend | Fastify startup, PORT validation, registered routes, temporary controllers, routing tests | Persistence, reliable validation/errors, CORS, ownership rules | [Backend](backend-TODOs.md) |
| API client | Package boundary and test configuration | HTTP implementation and feature tests | [API client](api-client-TODOs.md) |
| Web | React/Vite starter, shared package dependencies, test/build configuration | Project/subtask screens and API integration | [Web](web-TODOs.md) |
| Mobile | Expo Router starter, shared package dependencies, Jest configuration | Project/subtask screens and API integration | [Mobile](mobile-TODOs.md) |

The first saved project/subtask workflow is **not implemented**. API controllers
return empty lists or temporary objects; neither app currently calls the API.
Users now have tables, schemas, and route scaffolding, so they are included here.

## Suggested work order

1. Reconcile closed database tickets [#11–#15](github-issues.md#closed-ticket-discrepancies)
   with the missing connection, repositories, and seeding in this checkout.
2. Align SQL with the shared contracts, then finish persistent API behavior and
   request validation ([#19](https://github.com/better-tracker/tracker-mono/issues/19),
   [#20](https://github.com/better-tracker/tracker-mono/issues/20),
   [#21](https://github.com/better-tracker/tracker-mono/issues/21),
   [#22](https://github.com/better-tracker/tracker-mono/issues/22),
   [#30](https://github.com/better-tracker/tracker-mono/issues/30)).
3. Implement the shared client ([#23–#27](api-client-TODOs.md)).
4. Build the first web workflow, then reuse the server/client for mobile.
5. Verify saved changes across API restarts and both apps; finish access control
   and launch preparation before private multi-user use.

Plan database fields and contracts together. The request path is:
screen → API client → route/controller → service → repository → PostgreSQL.
As in HBNB, screens present data, controllers handle HTTP, services coordinate
business rules, and repositories handle persistence. Shared schemas describe API
data rather than database models. Simple handlers are fine until separation helps.

## Product decisions

- [x] Use **Project**, replacing the earlier **Thing** examples: schemas and URLs
  consistently use projects.
- [x] Define project/subtask API fields and PUT replacement fields in
  [contracts](../packages/contracts/src/projects.ts) and
  [subtasks](../packages/contracts/src/subtasks.ts).
- [x] Delete subtasks when their project is deleted: SQL uses `ON DELETE CASCADE`.
- [ ] Reconcile subtask description requirements: contracts require nonblank text;
  SQL currently allows null. See [database follow-ups](database-TODOs.md).
- [ ] Decide whether projects belong to one user or are shared, and implement the
  ownership/access model. No matching issue found; tables currently have no
  project-to-user relationship.
- [ ] Confirm the first user workflow with the team. Defined schemas and routes
  alone do not confirm product agreement.

## Testing and acceptance

- [x] Configure tests and CI: [scripts/test.mjs](../scripts/test.mjs) runs the
  current fast suites; [CI](../.github/workflows/ci.yml) also runs PostgreSQL tests.
- [x] Run `pnpm check` on Node 24 / pnpm 12.5.1: passed during this audit (lint,
  typecheck, build, 9 notification tests, 67 contract tests, 24 API tests).
- [x] Run `pnpm test:integration`: all 6 PostgreSQL migration/constraint tests passed
  against an isolated Testcontainers database.
- [ ] Add feature tests for API-client, web, and mobile. Their runners are
  configured, but the root test script explicitly defers these empty suites.
- [ ] Add API invalid-input, missing-record, wrong-project, and persistence tests;
  existing API tests cover routing/lifecycle and PORT configuration.
- [ ] Add and run the browser workflow test (`pnpm test:e2e`). Playwright is
  configured, but there are no browser test files.
- [ ] Verify saved projects and subtask changes after refresh and API restart.
- [ ] Verify mobile bundles and real device/emulator workflows. Mobile lint and
  typecheck passed; Expo export and device checks were not run in this audit.
- [ ] Add login and authorization before private multi-user use. User CRUD
  scaffolding is not authentication.
- [ ] Plan deployment settings, database updates, backups, and health checks.
- [ ] Have a person review the technical documentation listed in each checklist.

Unticketed work is listed in the [issue map](github-issues.md#work-without-a-matching-ticket).
No GitHub issues were created, closed, reopened, or commented on during this audit.

## Technical documentation — NO AI Allowed

The package/app technical documents must be written manually, as required by the
original plan. This rule covers those future technical documents, not these
planning checklists. Their required topics are preserved in each area checklist.
The root README and AGENTS.md also contain stale implementation/tooling claims;
reconcile them manually with the audited source.

Local defaults: web `http://localhost:3000`, API `http://localhost:3001`, PostgreSQL
`localhost:5432`. `PORT=6969 pnpm dev:api` changes the API port; update client URLs
accordingly. Web uses `VITE_API_URL`; mobile uses `EXPO_PUBLIC_API_URL`.
