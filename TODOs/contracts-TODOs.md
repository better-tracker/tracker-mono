# Shared data rules — packages/contracts

Purpose: make the API, web, and mobile agree on what data looks like.
A schema checks actual values. A DTO type tells TypeScript the expected shape.

## HBNB comparison: request and response schemas
- [schemas/place.py](/Users/ben/holberton-bootcamp/holbertonschool-hbnb/app/api/v1/schemas/place.py) defines fields received and returned by the HBNB API.
- Our shared schemas will do similar checks and provide TypeScript types to both apps.
- These are API data shapes, not database models like HBNB app/models/place.py.
- Example: check a name is text here; check who may edit a project in server business logic.
- HBNB's PUT allows partial fields; our proposed PUT requires all editable fields instead.

## Define request and response data
Requirements:
- [ ] Add src/projects.ts and src/subtasks.ts, and export their schemas and types.
- [ ] Choose a validation tool; derive TypeScript types from its schemas if possible.
- [ ] Define data for creating, reading, updating, and listing projects and subtasks.
- [ ] Require a project name and subtask description; reject blank or overly long text.
- [ ] Check that IDs are valid UUIDs; use UTC date strings as shown below.
- [ ] Let the server create IDs and dates; do not ask users to supply them.
- [ ] List the editable fields. For PUT, require all fields used to replace that data.
- [ ] Use one error shape, such as { error: { code, message } }.
- [ ] Keep database and screen code out of this package.

Acceptance criteria (how to check it works):
- [ ] Tests accept valid data and reject wrong values, such as an empty name.
- [ ] Apps reuse these definitions instead of writing their own copies.
- [ ] It is clear which fields each request needs and each response returns.

Example response when reading a project (proposed):
```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "name": "Build project tracker",
  "description": "First working feature",
  "subtasks": [
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "completed": false,
      "description": "Create database tables",
      "createdAt": "2024-06-01T00:00:00.000Z",
      "updatedAt": "2024-06-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-06-01T00:00:00.000Z"
}
```
Example request to add a subtask; the project ID goes in the URL:
```json
{ "completed": false, "description": "Create database tables" }
```
The Z at the end of a date means UTC, a shared time reference.

## Technical documentation — NO AI Allowed
- [ ] Write packages/contracts/README.md manually. Explain each request and response,
  required fields, data checks, error messages, and date format.
