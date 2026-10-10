# Mobile application — apps/mobile

Purpose: manage the same projects and subtasks from a phone.
Start after the API and first web workflow work, so we can reuse them.

## HBNB comparison: another presentation layer
- Like HBNB's [browser pages](/Users/ben/holberton-bootcamp/holbertonschool-hbnb/client/js/core/pages/places-page.js), these screens show records and collect user input.
- This HBNB project has a browser client; our mobile app adds a phone interface.
- React Native uses phone components instead of HBNB's HTML and browser DOM code.
- Web and mobile will call the same API; business rules and storage stay on the server.
- We share the API client and data contracts, rather than copying browser screen code.

## Build the mobile screens
Requirements:
- [ ] Put Expo Router screen entry files in src/app; keep other code outside it.
- [ ] Reuse packages/contracts and packages/api-client to call the API.
- [ ] Read the API address from EXPO_PUBLIC_API_URL; never put secrets in it.
- [ ] For a physical phone, use the development computer's local network IP address.
  localhost on a phone means the phone itself, not the development computer.
- [ ] For the Android emulator, use 10.0.2.2 to reach the development computer.
- [ ] Build a project list and screens to create, view, edit, and delete projects.
- [ ] Let users add, edit, complete, and delete subtasks.
- [ ] Show loading, empty-list, invalid-input, and connection-error messages.
- [ ] Keep forms usable when the keyboard is open; label buttons and inputs clearly.
- [ ] Refresh data after saving; let users retry failed requests without losing input.
- [ ] Call the API for data; never connect the phone directly to PostgreSQL.

Suggested screen files:
```text
src/app/_layout.tsx        Sets up navigation between screens
src/app/index.tsx          Project list
src/app/projects/[id].tsx  One project and its subtasks
```
Example apps/mobile/.env setting for the Android emulator:
```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```
Use the API's actual port if we change it from 3001.

Acceptance criteria (how to check it works):
- [ ] Expo starts and bundles the JavaScript for both iOS and Android successfully.
- [ ] Create a project on a device or emulator, reopen the app, and find it again.
- [ ] Complete a subtask on mobile, refresh web, and see the same saved result.
- [ ] Failed requests show an error without crashing or clearing form input.
- [ ] Code style checks, TypeScript checks, and tests of user actions pass.

## Technical documentation — NO AI Allowed
- [ ] Write apps/mobile/README.md manually. Explain startup, server addresses,
  screen files, API calls, and how to check the app on a device or emulator.
