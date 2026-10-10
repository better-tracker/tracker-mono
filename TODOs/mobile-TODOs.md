# Mobile application — apps/mobile

Purpose: manage the same saved projects/subtasks on a phone. Reuse the API/client
once the first web workflow works. No matching mobile feature issue was found.
The API/client tickets below are dependencies, not mobile implementation tickets.

## Implemented scaffolding

- [x] Put Expo Router screen entry files in `src/app`, with
  [_layout.tsx](../apps/mobile/src/app/_layout.tsx) and
  [index.tsx](../apps/mobile/src/app/index.tsx). The only screen is the starter
  “Mobile application is running.”
- [x] Declare shared API-client/contracts dependencies in
  [package.json](../apps/mobile/package.json). They are not used by the screen yet.
- [x] Configure Jest/React Native Testing Library; no feature test files exist.
- [x] Pass mobile lint and TypeScript checks during the audit's `pnpm check`.

At this checkout, mobile is tracked as regular files in the monorepo, rather than
an active Git link; the old repository guidance predates that change.

## Remaining work — no matching feature ticket

- [ ] Reuse the API client and contracts in real screens. Depends on
  [#23](https://github.com/better-tracker/tracker-mono/issues/23),
  [#25](https://github.com/better-tracker/tracker-mono/issues/25),
  [#26](https://github.com/better-tracker/tracker-mono/issues/26), and
  [#27](https://github.com/better-tracker/tracker-mono/issues/27).
- [ ] Read `EXPO_PUBLIC_API_URL` from the mobile app's `.env`; never place secrets
  in it. The root environment example mentions it, but mobile code does not read it.
- [ ] Configure and verify addresses on target devices: use the computer's LAN IP
  on a physical phone, and `http://10.0.2.2:3001` on the Android emulator.
  `localhost` on a phone refers to that phone. Match any overridden API port.
- [ ] Build project list, create, detail, edit, and delete screens; keep non-route
  helpers/components outside `src/app`.
- [ ] Allow adding, editing, completing, and deleting subtasks.
- [ ] Show loading, empty, invalid-input, and connection-error states.
- [ ] Keep forms usable with the keyboard open and label buttons/inputs clearly.
- [ ] Refresh after saving and support retry without losing form input.
- [ ] Call the API for data and keep database dependencies out of the phone app.

## Acceptance checks still needed

- [ ] Start Expo and verify iOS/Android bundles using
  `pnpm --filter @project-tracker/mobile exec expo export --platform all`.
- [ ] Create a project on a device/emulator, reopen the app, and find it again.
- [ ] Complete a subtask on mobile, refresh web, and see the same saved result.
- [ ] Verify failed requests show errors without crashing or clearing form input.
- [ ] Add user-action tests and run them through the configured Jest runner.

## Technical documentation — NO AI Allowed

- [ ] Write apps/mobile/README.md manually. Explain startup, server addresses,
  screen files, API calls, and how to check the app on a device or emulator.
