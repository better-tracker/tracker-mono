# Database — packages/database

Purpose: permanently store projects and subtasks using PostgreSQL.

## HBNB comparison: persistence layer
- [PlaceRepository](/Users/ben/holberton-bootcamp/holbertonschool-hbnb/app/persistence/place_repository.py) reads/writes places; our project repository will read/write projects.
- HBNB app/models/place.py defines SQLAlchemy columns and relationships.
- Our SQL migrations will define tables and relationships; no ORM is chosen yet.
- HBNB app/seeds/ supplies example records, just as our seed script will.
- Services call repositories; repositories handle storage, not HTTP responses.

## 1. Start the database and create tables
Requirements:
- [ ] Start PostgreSQL using the existing compose.yml (command below).
- [ ] Create a projects table and a subtasks table. A table stores rows of data.
- [ ] Give every row a UUID: a unique ID such as the ones in the contracts example.
- [ ] Give each subtask a project_id that points to an existing project.
- [ ] Decide which fields are required and what their default values should be.
- [ ] Decide whether deleting a project also deletes its subtasks or is blocked.
- [ ] Add indexes (database lookup helpers) where needed, such as on project_id.
- [ ] Store dates with time zones so the API can return unambiguous dates.
- [ ] Add migrations: numbered SQL files that create or change tables.
- [ ] Add a command that applies new migrations and remembers which have already run.
- [ ] Keep the ORM decision for later; begin with SQL.

Suggested fields (this is a plan, not executable SQL):
```text
projects: id, name, description, created_at
subtasks: id, project_id, completed, description, created_at, updated_at
completed is true or false; its default is false.
```
Start PostgreSQL from the project root:
```sh
docker compose up -d postgres
```
Acceptance criteria (how to check it works):
- [ ] PostgreSQL is healthy and reachable on localhost:5432.
- [ ] Migrations create tables in a new database without repeating finished changes.
- [ ] A subtask cannot refer to a missing project; project deletion follows our agreed rule.

## 2. Connect to the database and add example data
Requirements:
- [ ] Add src/client.ts to open reusable connections using the DATABASE_URL setting.
- [ ] Add src/repositories/projects.repository.ts and subtasks.repository.ts.
- [ ] Put functions for creating, reading, updating, and deleting records there.
- [ ] Pass user values as SQL parameters; never join user text into SQL commands.
- [ ] Use a transaction when several writes must all succeed or all be undone.
- [ ] Add src/seed.ts: a script that inserts one project and two example subtasks.
- [ ] Make one example subtask complete and the other incomplete.
- [ ] Only server code may use this package; web and mobile must call the API.

Acceptance criteria:
- [ ] Running the seed script twice does not create duplicate example records.
- [ ] Tests use a test database to check saving, reading, and table relationships.
- [ ] Database connections close when the API shuts down.

## Technical documentation — NO AI Allowed
- [ ] Write packages/database/README.md manually. Explain tables, relationships,
  setup, migration and seed commands, and how to reset local data.
