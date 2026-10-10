# Web application — apps/web

Purpose: let users manage projects and subtasks in a browser.

## HBNB comparison: browser presentation layer
- HBNB client/ HTML pages and JavaScript display data and handle user input.
- [places-page.js](/Users/ben/holberton-bootcamp/holbertonschool-hbnb/client/js/core/pages/places-page.js) builds place cards; our React screens will display projects.
- HBNB screens call places-api.js; our screens will call packages/api-client.
- React components will update the page instead of manually creating HTML elements.
- The screen shows results; server services enforce rules and repositories save data.

## Build the first screens
Requirements:
- [ ] Use packages/contracts for data rules and packages/api-client for server calls.
- [ ] Read the API address from NEXT_PUBLIC_API_URL for browser-side calls.
  This setting is public: never put passwords or secret keys in it.
- [ ] Show a project list, a form to create projects, and a project details page.
- [ ] Allow editing and deleting projects; ask for confirmation before deleting.
- [ ] Show subtasks and let users add, edit, complete, and delete them.
- [ ] When using PUT, send all editable fields, not just the changed field.
- [ ] Show a loading message while waiting and an empty message when no records exist.
- [ ] Show success messages and clear errors for invalid input or failed requests.
- [ ] Label form fields and make controls usable with a keyboard.
- [ ] Prevent repeated clicks from saving twice; refresh displayed data after saving.

Suggested pages:
```text
/                Project list and create action
/projects/[id]   One project and its subtasks; [id] is the project's ID
```
Example values from a create-project form:
```ts
const values = {
  name: 'Build project tracker',
  description: 'First working feature',
};
```
The server adds the new project's ID and creation date.

Acceptance criteria (how to check it works):
- [ ] Create a project, refresh the page, and confirm it still appears.
- [ ] Complete a subtask, reload the page, and confirm it stays complete.
- [ ] Invalid input explains what to fix; a failed request lets the user try again.
- [ ] Add a browser test that creates a project and completes a subtask.
- [ ] The production build serves the page and its JavaScript, styles, and images.

## Technical documentation — NO AI Allowed
- [ ] Write apps/web/README.md manually. Explain startup, settings, pages,
  how screens call the API, and how to run the browser tests.
