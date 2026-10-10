# Start here

Goal: create a project, see it in a list, and manage its smaller jobs (subtasks).
These checklists describe work still to do. Examples are suggestions, not working code.
Requirements means what to build. Acceptance criteria means how to check it works.
The original TODOs.md at the project root has not been changed.

## How this matches our HBNB project
These are planned equivalents; most Project Tracker features are still empty.
- Presentation (screens): HBNB client/ becomes apps/web and apps/mobile.
- Presentation (HTTP): HBNB app/api/v1/ becomes Fastify routes and controllers.
- Business logic: [HBnBFacade](/Users/ben/holberton-bootcamp/holbertonschool-hbnb/app/services/facade.py) coordinates rules and repositories; our services will do similar work.
- Persistence (saving/loading): HBNB app/persistence/ becomes packages/database.
- Request path: screen → API client → route/controller → service → repository → database.

## 1. Agree on what we are building
Requirements:
- [ ] Decide which details a project and a subtask need.
- [ ] Decide whether projects belong to one person or are shared.
- [ ] Decide what happens to subtasks when their project is deleted.
- [ ] Confirm the name Project; this replaces Thing from the earlier examples.

Acceptance criteria:
- [ ] Everyone can explain what users should be able to do.

## 2. Work through these files in order
1. [Database](database-TODOs.md): store projects and subtasks.
2. [Contracts](contracts-TODOs.md): agree on the data sent between apps and server.
3. [Backend](backend-TODOs.md): receive requests and read or save data.
4. [API client](api-client-TODOs.md): write reusable functions that call the server.
5. [Web](web-TODOs.md): build the browser screens.
6. [Mobile](mobile-TODOs.md): build the phone screens using the same server.
Plan the database fields and contracts together before writing their code.

## What the names mean
- Route: a URL and an action, such as GET /v1/projects.
- Controller: reads a request and sends a response.
- Service: applies rules, such as which changes are allowed.
- Repository: contains functions that read and write database records.
- DTO: the agreed shape of data sent in a request or response.
- ORM: a library that helps work with database records; we are not adding one yet.
- CI: automated checks that GitHub runs when code is pushed or reviewed.
Simple route handlers can do the controller work until separate files are useful.

## 3. Check our work
Requirements:
- [ ] Add tests for each feature and make GitHub run them.
- [ ] Run pnpm check to check code style, TypeScript types, and builds.
- [ ] Before private multi-user use, add login and checks for who may access each project.
- [ ] Before launch, plan live-server settings, database updates, backups, and health checks.
- [ ] Write the technical documents listed in each file manually: NO AI Allowed.
  That rule covers the future technical documents, not these planning checklists.

Acceptance criteria:
- [ ] Saved projects and subtask changes remain after refreshing or restarting the API.
- [ ] Tests and pnpm check pass; a person reviews the technical documents.

Local addresses: API http://localhost:3001; PostgreSQL localhost:5432.
To use port 6969 instead: PORT=6969 pnpm dev:api. Update client URLs to match.
