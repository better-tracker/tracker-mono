# Web application — apps/web

Purpose: manage projects and subtasks in a browser. The current app is
**React with Vite**, replacing the older Next.js plan. Product screens are absent;
[App.tsx](../apps/web/src/App.tsx) only shows “Web application is running.”

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
- [x] Configure Vitest/Testing Library/MSW and Playwright. No unit or browser
  workflow test files exist yet.

## Remaining work — no matching feature ticket

- [ ] Use the shared client/contracts in actual screens. Depends on
  [#23](https://github.com/better-tracker/tracker-mono/issues/23),
  [#25](https://github.com/better-tracker/tracker-mono/issues/25),
  [#26](https://github.com/better-tracker/tracker-mono/issues/26), and
  [#27](https://github.com/better-tracker/tracker-mono/issues/27).
- [ ] Read the app-local API URL and configure browser access with API CORS
  ([#19](https://github.com/better-tracker/tracker-mono/issues/19)).
- [ ] Build the project list/create workflow at `/` and detail/subtask workflow at
  `/projects/:id`; choose routing suitable for Vite rather than Next.js `page.tsx`.
- [ ] Allow project editing/deletion with deletion confirmation.
- [ ] Show subtasks and allow adding, editing, completing, and deleting them.
- [ ] Send all editable fields on PUT, including unchanged fields.
- [ ] Show loading, empty, success, invalid-input, and connection-error states.
- [ ] Label fields and make controls usable with a keyboard.
- [ ] Prevent duplicate submissions, refresh saved data, and preserve input for retry.

## Acceptance checks still needed

- [ ] Create a project, refresh, and confirm it remains saved.
- [ ] Complete a subtask, reload, and confirm it stays complete.
- [ ] Verify actionable validation messages and retry after failed requests.
- [ ] Add a browser test that creates a project and completes a subtask; run
  `pnpm test:e2e`. Persistent API behavior is required first.
- [ ] Verify the production preview serves the workflow and its JavaScript, styles,
  and images. Building the starter is verified; the product workflow is not.

## Technical documentation — NO AI Allowed

- [ ] Write apps/web/README.md manually. Explain startup, settings, pages,
  how screens call the API, and how to run the browser tests.
