# API client — packages/api-client

Purpose: reusable functions that let web and mobile call the Fastify server.
This is different from a database client: it sends HTTP requests, not SQL.

## HBNB comparison: calling the server from a screen
- [places-api.js](/Users/ben/holberton-bootcamp/holbertonschool-hbnb/client/js/core/api/places-api.js) has getPlace(id); our client will have getProjectById(...).
- HBNB client/js/core/api/client.js sends fetch requests and handles errors.
- This package will share that kind of code between web and mobile.
- It is not HBnBFacade: the client calls the server; the facade runs inside the server.

## Build functions that call the API
Requirements:
- [ ] Add @project-tracker/contracts as a workspace:* dependency in package.json.
  workspace:* means use the package from this repository.
- [ ] Accept the server address from the app, such as http://localhost:3001.
- [ ] Add functions to list, create, read, update, and delete projects and subtasks.
- [ ] Encode IDs in URLs and set Content-Type: application/json when sending JSON.
- [ ] Check response status and data shape; return helpful errors when calls fail.
- [ ] Do not read JSON from a 204 response because that response has no body.
- [ ] Allow an app to cancel a request it no longer needs.
- [ ] Keep database and platform-specific code out so both apps can use this package.

Example function (a guide, not ready-to-run code):
```ts
import { ProjectSchema, type Project } from '@project-tracker/contracts';

async function getProjectById(baseUrl: string, id: string): Promise<Project> {
  const url = new URL(`/v1/projects/${encodeURIComponent(id)}`, baseUrl);
  const response = await fetch(url); // Send a GET request to Fastify.
  if (!response.ok) {
    throw new Error(`Could not load project: HTTP ${response.status}`);
  }
  const data = await response.json(); // Read the response data.
  return ProjectSchema.parse(data); // Check its shape before returning it.
}
```
Project and ProjectSchema must first be created in packages/contracts.
The parse method is an example; use the method from our chosen validation tool.
Promise<Project> means the function eventually returns project data or throws an error.

Example call, using a real project ID saved in the database:
```ts
const project = await getProjectById('http://localhost:3001', id);
```

Acceptance criteria (how to check it works):
- [ ] Web and mobile use the same functions, each supplying its server address.
- [ ] Tests cover successful calls, wrong response data, server errors, and failed connections.
- [ ] A delete returning 204 succeeds without trying to read JSON.
- [ ] Cancelled requests stop and are handled without crashing the app.

## Technical documentation — NO AI Allowed
- [ ] Write packages/api-client/README.md manually. Explain setup, function inputs,
  returned data, errors, cancellation, and examples for web and mobile.
