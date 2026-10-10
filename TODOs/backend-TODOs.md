# Backend — apps/api

Purpose: receive requests from apps, work with stored data, and send responses.
Fastify is the library that runs this HTTP server.

## HBNB comparison: presentation and business logic
- [places.py](/Users/ben/holberton-bootcamp/holbertonschool-hbnb/app/api/v1/places.py) receives HTTP requests; our routes/controllers will do that presentation-layer work.
- HBnBFacade coordinates rules and repositories; projects.service.ts will serve a similar role.
- HBNB also puts rules in models; keep our business rules in server code, not only in forms.
- Fastify is the HTTP framework, like Flask; it is not itself the facade.

## 1. Keep the server easy to run and test
Requirements:
- [ ] Keep app.ts for setting up Fastify and server.ts for starting it.
- [ ] Keep existing JSON logs, 0.0.0.0 listening, and clean shutdown behaviour.
  0.0.0.0 lets devices reach the server; clean shutdown closes resources on exit.
- [ ] Add src/config/env.ts to check settings such as DATABASE_URL when needed.
- [ ] Use port 3001 by default; PORT=6969 selects the earlier example's port.
- [ ] If the browser calls the API directly, allow its address with CORS settings.
  CORS controls which other website addresses a browser can make calls from.
- [ ] Return helpful errors without exposing passwords or internal server details.

Acceptance criteria (how to check it works):
- [ ] Bad settings produce a clear error; tests can create the app without a live port.

## 2. Add URLs for projects and subtasks
Requirements:
- [ ] Register projects.routes.ts in app.ts and check input using shared schemas.
- [ ] Use repository functions to read/write the database; start with simple handlers.
- [ ] Use the controller and service files when separating the work helps readability.
- [ ] Check a subtask belongs to the project in the URL before reading or changing it.
- [ ] Set createdAt on creation; change a subtask's updatedAt whenever it is edited.

Proposed routes (:id and :projectId are replaced with real IDs):
```text
GET    /v1/projects                         List projects
POST   /v1/projects                         Create a project
GET    /v1/projects/:id                     Read one project
PUT    /v1/projects/:id                     Replace editable project fields
DELETE /v1/projects/:id                     Delete a project
GET    /v1/projects/:projectId/subtasks      List a project's subtasks
POST   /v1/projects/:projectId/subtasks      Create a subtask
GET    /v1/projects/:projectId/subtasks/:id   Read a subtask
PUT    /v1/projects/:projectId/subtasks/:id   Replace editable subtask fields
DELETE /v1/projects/:projectId/subtasks/:id   Delete a subtask
```
Acceptance criteria:
- [ ] Reading/updating returns 200 (success); creating returns 201 (created).
- [ ] Deleting returns 204 (success with no response body).
- [ ] Invalid input returns 400; missing records return 404; unexpected errors return 500.
- [ ] PUT requires all editable fields agreed in the contracts checklist.
- [ ] Use Fastify's inject() to test requests without starting a live server.
- [ ] Test valid requests, bad input, missing IDs, and subtasks under the wrong project.
- [ ] Test with a database and confirm saved changes remain after API restart.

## Technical documentation — NO AI Allowed
- [ ] Write apps/api/README.md manually: startup, settings, and how requests are handled.
- [ ] Write apps/api/docs/endpoints.md manually: URLs, input/output examples,
  response status codes, and instructions for trying requests locally.
