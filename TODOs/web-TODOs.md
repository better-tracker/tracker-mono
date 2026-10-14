# Web application — apps/web

Purpose: manage projects, tasks, subtasks, and profile preferences in a browser.
The app uses **React with Vite** and React Router. Its current demo persists data
locally; production API integration remains pending.

No matching web feature issue was found among the repository's 20 issues.
The API/client tickets below are dependencies, not web implementation tickets.

## Implemented scaffolding

- [x] Configure the React/Vite entry point and static production build in
  [package.json](../apps/web/package.json) and [vite.config.ts](../apps/web/vite.config.ts).
  The production build passed during this audit.
- [x] Declare dependencies on contracts and the shared API client.
- [x] Provide a public `VITE_API_URL` example in
  [.env.example](../apps/web/.env.example). It is currently unused; future browser
  code should read `import.meta.env.VITE_API_URL`. Never put secrets in `VITE_*`.
- [x] Configure Vitest/Testing Library/MSW and Playwright, with unit and browser
  workflow tests for the local demo.
- [x] Require web unit tests in the fast CI suite and run Chromium workflows and
  responsive layout checks in a separate GitHub Actions job. Retain browser
  reports, screenshots, and failure traces for 14 days.

## Remaining work — no matching feature ticket

- [ ] Use the shared client/contracts in actual screens. Depends on
  [#23](https://github.com/better-tracker/tracker-mono/issues/23),
  [#25](https://github.com/better-tracker/tracker-mono/issues/25),
  [#26](https://github.com/better-tracker/tracker-mono/issues/26), and
  [#27](https://github.com/better-tracker/tracker-mono/issues/27).
- [ ] Read the app-local API URL and configure browser access with API CORS
  ([#19](https://github.com/better-tracker/tracker-mono/issues/19)).
- [x] Wire the Today, project/task list/detail, creation/editing, subtask, login,
  and profile routes using React Router.
- [x] Allow local project editing/deletion with deletion confirmation.
- [x] Show subtasks and allow adding, editing, completing, and deleting them locally.
- [ ] Send all editable fields on PUT, including unchanged fields.
- [x] Show loading, empty, success, invalid-input, and storage-error states.
- [x] Label fields and make controls usable with a keyboard.
- [x] Prevent duplicate submissions, refresh saved data, and preserve input for retry.

## Acceptance checks still needed

- [x] Test local project creation and persistence after refresh.
- [x] Test independent task/subtask completion and persistence after reload.
- [x] Test actionable validation, storage failures, and failed-save retry.
- [x] Add browser tests for CRUD, profile, sessions, navigation, missing pages,
  and responsive layouts at 375, 430, 900, and 1600px; require `pnpm test:e2e` in CI.
- [x] Exercise the built production preview in the browser suite.
- [ ] Repeat persistence, authentication, and network-failure checks against the
  production API after integration.

## Technical documentation — NO AI Allowed

- [ ] Write apps/web/README.md manually. Explain startup, settings, pages,
  how screens call the API, and how to run the browser tests.
