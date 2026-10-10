# API client — packages/api-client

Purpose: share HTTP calls between web and mobile. This calls Fastify rather than
PostgreSQL. The [entry point](../packages/api-client/src/index.ts) is `export {}`;
none of the request functions are implemented.

## Implemented scaffolding

- [x] Provide a cross-platform package boundary without database/platform imports.
- [x] Configure Vitest and MSW in [package.json](../packages/api-client/package.json),
  [vitest.config.ts](../packages/api-client/vitest.config.ts), and
  [tests/setup.ts](../packages/api-client/tests/setup.ts). No feature tests exist.

## Remaining work linked to tickets

- [ ] Set up the shared HTTP client —
  [#23](https://github.com/better-tracker/tracker-mono/issues/23) (open).
  Add `@project-tracker/contracts` as a `workspace:*` dependency; accept the app's
  API base URL, encode IDs in URLs, and set JSON Content-Type for JSON bodies.
- [ ] Implement user list/create/read/update/delete calls —
  [#24](https://github.com/better-tracker/tracker-mono/issues/24) (open).
- [ ] Implement project list/create/read/update/delete calls —
  [#25](https://github.com/better-tracker/tracker-mono/issues/25) (open).
- [ ] Implement nested subtask list/create/read/update/delete/completion calls —
  [#26](https://github.com/better-tracker/tracker-mono/issues/26) (open).
  Completion updates must send both fields required by the subtask PUT schema.
- [ ] Check HTTP status and response schemas; provide useful server/network errors —
  [#27](https://github.com/better-tracker/tracker-mono/issues/27) (open).
- [ ] Treat 204 as success without attempting to read JSON. Related: #23 and #27.
- [ ] Accept request cancellation signals and propagate cancellation predictably.
  Related client foundation: #23; the ticket body does not explicitly mention
  cancellation, so confirm that detail when implementing it.
- [ ] Keep the completed client free of database and platform-specific dependencies.

## Acceptance checks still needed

- [ ] Have both apps use the same client functions with their own API addresses.
- [ ] Add tests for valid responses, invalid data, non-success statuses, and failed
  connections. Related: #24–#27.
- [ ] Verify bodyless 204 deletion and cancellation handling without app crashes.
- [ ] Verify complete PUT payloads and encoded URL IDs.

## Technical documentation — NO AI Allowed

- [ ] Write packages/api-client/README.md manually. Explain setup, function inputs,
  returned data, errors, cancellation, and examples for web and mobile.
