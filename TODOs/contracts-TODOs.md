# Shared data rules — packages/contracts

Purpose: agree on actual API values and their TypeScript types. Schemas describe
requests/responses; database tables and server access rules remain separate.

## Implemented

- [x] Use Zod and infer TypeScript DTOs from exported runtime schemas.
- [x] Define create, update, detail, and list project data —
  [#17](https://github.com/better-tracker/tracker-mono/issues/17) (closed).
  Evidence: [projects.ts](../packages/contracts/src/projects.ts).
- [x] Define create, update, detail, and list subtask data —
  [#18](https://github.com/better-tracker/tracker-mono/issues/18) (closed).
  Evidence: [subtasks.ts](../packages/contracts/src/subtasks.ts).
- [x] Define user schemas/types —
  [#16](https://github.com/better-tracker/tracker-mono/issues/16) (closed).
  Evidence: [users.ts](../packages/contracts/src/users.ts).
- [x] Trim and require nonblank project names (1–255 characters) and subtask
  descriptions (1–2000). Project descriptions are nullable, optional on create,
  and limited to 2000 characters.
- [x] Validate UUID IDs and UTC project/subtask date strings. Create schemas do not
  require client-supplied IDs/dates. User responses omit passwords and dates.
- [x] Require both editable fields on project PUT (`name`, `description`) and
  subtask PUT (`description`, `completed`). Subtask creation defaults to incomplete.
- [x] Define `{ error: { code, message } }` in
  [errorstructure.ts](../packages/contracts/src/errorstructure.ts).
- [x] Export schemas/types through [index.ts](../packages/contracts/src/index.ts)
  without database or screen dependencies.
- [x] Test valid/invalid values, boundaries, lists, dates, and exports. All 67
  [contract tests](../packages/contracts/tests) passed during this audit.

## Partial implementation and remaining adoption

- [ ] Use the schemas' **parsed output** in API handlers, and consistently return
  validation errors as 400. POST/PUT hooks parse bodies but discard the result;
  path IDs are unchecked. Related:
  [#30](https://github.com/better-tracker/tracker-mono/issues/30),
  [#20](https://github.com/better-tracker/tracker-mono/issues/20).
- [ ] Return API responses matching these schemas. Temporary project/subtask
  responses lack dates, project detail lacks `subtasks`, and creation uses
  `temporary-id`. Related:
  [#21](https://github.com/better-tracker/tracker-mono/issues/21),
  [#22](https://github.com/better-tracker/tracker-mono/issues/22).
- [ ] Reuse contracts in the client and app flows. Dependencies exist in both
  apps, but client implementation/screens do not. Related:
  [#23](https://github.com/better-tracker/tracker-mono/issues/23),
  [#24](https://github.com/better-tracker/tracker-mono/issues/24),
  [#25](https://github.com/better-tracker/tracker-mono/issues/25),
  [#26](https://github.com/better-tracker/tracker-mono/issues/26).
- [ ] Adopt the shared error shape across API/client. Defining a schema does not
  make Fastify emit it. Related:
  [#19](https://github.com/better-tracker/tracker-mono/issues/19),
  [#27](https://github.com/better-tracker/tracker-mono/issues/27).
- [ ] Align SQL subtask description constraints with the contracts. No matching
  follow-up ticket found; see [database checklist](database-TODOs.md).

## Acceptance checks still needed

- [ ] Verify API responses pass their shared response schemas.
- [ ] Verify API/client/apps reuse agreed definitions throughout real workflows.

## Technical documentation — NO AI Allowed

- [ ] Write packages/contracts/README.md manually. Explain each request and response,
  required fields, data checks, error messages, and date format.
