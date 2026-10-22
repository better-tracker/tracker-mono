# Project Tracker

TypeScript workspace for a project tracker. The API has initial project, user,
and subtask routes; database repositories and migrations are available separately.

```text
apps/web          React + TypeScript with Vite (static production output)
apps/api          Fastify server
apps/mobile       Expo SDK 57 + Expo Router, iOS and Android
packages/contracts   Shared API schemas/types
packages/api-client  Cross-platform API client
packages/database    Server-only PostgreSQL repositories and migrations
packages/utils       Shared utility functions
```

## Local setup

Use Node.js 24 LTS (`nvm use`), pnpm 12.5.1, and Docker with Compose for optional
local PostgreSQL. Mobile device testing needs a compatible Expo Go installation,
an iOS simulator (macOS/Xcode), or an Android emulator (Android Studio).

```sh
nvm use
npm install --global pnpm@12.5.1
pnpm install --frozen-lockfile
```

Older Corepack versions may fail to launch pnpm 12. Update Corepack or use
`npx --yes pnpm@12.5.1` in place of `pnpm` without changing the pinned version.
TypeScript 6 and ESLint 9 are pinned for compatibility with the framework tooling.
All direct dependencies use stable releases. Babel transitively requires
`gensync@1.0.0-beta.2`; that upstream dependency is retained in the lockfile.

## Development

Build shared packages before starting the web and API together:

```sh
pnpm --filter @project-tracker/contracts --filter @project-tracker/api-client --filter @project-tracker/utils build
```

Prepare the root `.env` as described below before starting the API.

```sh
pnpm dev             # web and API concurrently
pnpm dev:web         # web only, localhost:3000
pnpm dev:api         # API only, localhost:3001
pnpm dev:mobile      # Expo / Metro, port 8081
```

The API binds to `0.0.0.0`; `PORT` overrides its listening port. It requires
`DATABASE_URL` at startup and closes on SIGINT/SIGTERM. The current routes return
placeholder responses and do not use the database repositories yet.
From `apps/mobile`, `pnpm ios` or `pnpm android` opens the selected platform.
The mobile project also supports native development builds through Expo; no native
projects or custom native modules are included.

`.env.example` documents local settings. Copy it to root `.env` if that file does
not already exist. Export `PORT` in your shell to override the API port. For web settings,
copy `apps/web/.env.example` to `apps/web/.env.local`; Vite loads app-local `.env`
and `.env.local`. Expo loads app-local `.env` in `apps/mobile`.
The API development command and database migration/seed commands load the root
`.env`. Web and mobile use their own app-local environment files. For a physical mobile device,
use your computer's LAN IP; for the Android emulator use `10.0.2.2` instead of
`localhost`. Never put secrets in `VITE_*` or `EXPO_PUBLIC_*` values. Web
code reads `import.meta.env.VITE_API_URL`; Vite embeds public values at build time,
so rebuild the web app when changing production settings.

The web dev and preview servers use port 3000 and fail if it is already occupied.

Web styling uses Tailwind CSS and shared components in `apps/web/src/components/ui`.
See the [styling guide](apps/web/src/components/ui/README.md) for component usage,
theme tokens, and responsive conventions.

Generic helpers live in `packages/utils`. Web workspace queries and stored-data
validation live in `apps/web/src/data`; `useWorkspaceForm` handles shared form
submission behavior in `apps/web/src/features`. API request-validation hooks stay
in `apps/api/src/lib/validation.ts`, and SQL update helpers stay in the server-only
database package.

## Run the backend

Start Docker Desktop (or your Docker engine), select Node.js 24 with `nvm use`,
and install pnpm 12.5.1 as shown in Local setup. From the project root, run:

```sh
bash scripts/start-backend.sh
```

The script installs dependencies using the frozen lockfile, creates `.env` from
`.env.example` only if it is missing, starts PostgreSQL and waits for it to become
healthy, applies pending migrations, builds the shared contracts and utils, and starts the
API with automatic reload. Existing `.env` settings are preserved. To see the
script's prerequisites, run `bash scripts/start-backend.sh --help`.

The API is available at `http://localhost:3001` by default. In another terminal:

```sh
curl http://localhost:3001/v1/projects
```

The current placeholder response is `[]`, even if the database contains projects.
Press Ctrl+C to stop the API. PostgreSQL stays running until you stop it separately.

To run the same steps manually after installing dependencies:

```sh
# First time only: preserve any existing local settings.
if [ ! -e .env ]; then cp .env.example .env; fi
docker compose up -d --wait postgres
pnpm --filter @project-tracker/database migrate
pnpm --filter @project-tracker/contracts --filter @project-tracker/utils build
pnpm dev:api
```

On subsequent runs, `pnpm dev:api` starts just the API. Run migrations again after
adding or pulling new SQL migration files. Applied migrations are skipped.

## PostgreSQL and Docker commands

Run these commands from the project root:

```sh
docker compose up -d --wait postgres  # Start PostgreSQL and wait until healthy
docker compose ps                    # Check container status
docker compose logs -f postgres      # Follow database logs (Ctrl+C to exit)
docker compose stop postgres         # Stop PostgreSQL without removing its container
docker compose down                  # Stop and remove containers; keep saved data
```

Database commands load `DATABASE_URL` from the root `.env`:

```sh
pnpm --filter @project-tracker/database migrate  # Create/update tables
pnpm --filter @project-tracker/database seed     # Optional: insert sample data
```

Seeding adds a sample user, project, and subtasks. Run it once on a fresh database;
it is not repeatable because the sample user's email must be unique.

PostgreSQL 18 listens only on `127.0.0.1:5432`. Its named volume persists across
container restarts and `docker compose down`. Credentials are local examples only;
changing initialization credentials requires an appropriately migrated or fresh
volume. Keep `DATABASE_URL` consistent with `POSTGRES_USER`, `POSTGRES_PASSWORD`,
and `POSTGRES_DB` in `.env`. The API does not connect to the database yet.

## Redis Bloom filters

The API includes a shared typed `redis` client in `apps/api/src/lib/redis.ts` and a
generic `createBloomFilter` helper in `apps/api/src/lib/bloom-filter.ts`. User
registration does not use the helper yet. PostgreSQL's unique constraints remain
authoritative for username and email uniqueness.

Start the local Redis 8 service (includes Bloom commands):

```sh
docker compose --profile redis up -d --wait redis
```

Add `REDIS_URL=redis://127.0.0.1:6379` to the root `.env`, then restart the API.
When `REDIS_URL` is absent or empty, the API does not connect to Redis. When enabled,
it connects once at startup and closes the client during shutdown. Connection failures
are logged without stopping the API. Offline commands reject rather than queue,
and connection attempts and commands have a two-second timeout;
restart the API after restoring Redis because automatic reconnect is disabled.
Use `rediss://` for a remote Redis deployment requiring TLS.

Provision each filter once, choosing a capacity and false-positive rate for that field:

```sh
docker compose exec redis redis-cli BF.RESERVE bloom:users:user_name:v1 0.001 1000000
docker compose exec redis redis-cli BF.RESERVE bloom:users:email:v1 0.001 1000000
```

These commands fail if the filter already exists; do not run them on every request.
The helper also exposes `reserve(namespace, capacity, errorRate = 0.001)` for provisioning.
Redis data persists in the `redis_data` Compose volume.

Services can import the shared client and inject it into the helper:

```ts
import { createBloomFilter } from './lib/bloom-filter.js';
import { redis } from './lib/redis.js';

const bloom = createBloomFilter(redis);

// Each namespace has an independent filter. Values are used exactly as supplied.
const usernameMightExist = await bloom.mightContain('users:user_name', userName);
const emailMightExist = await bloom.mightContain('users:email', email);

// Add identifiers only after the database transaction commits successfully.
await bloom.add('users:user_name', userName);
await bloom.add('users:email', email);
```

A `true` result is only a hint: confirm it with an exact database query. A `false`
result means the value was not added to that filter, which may be missing or
incomplete. Backfill every existing value and keep creates, updates, seeds, and
other writers synchronized before using negative results to skip database lookups.
Provisioning an empty filter alone does not make it ready. On Redis errors or while
backfilling/rebuilding, fall back to database checks. Catch membership errors in
the calling service; after a committed write, log and retry failed filter updates
without turning the successful registration into an error. Always keep database
uniqueness constraints to handle concurrent registrations and stale filters.

Apply the same normalization policy in database writes, queries, and filter values.
The current username/email unique constraints are case-sensitive. Old identifiers
can remain after updates or deletion; database confirmation handles those positives,
and a coordinated rebuild into a new version can remove stale entries.

Run the focused tests without a Redis server:

```sh
pnpm --filter @project-tracker/api test
```

## Checks and builds

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm check           # lint, typecheck, build, then tests
```

Build runs the API, shared packages, and web in workspace dependency order. Shared
packages emit JavaScript and declarations into `dist/`; build them before using
imports in an app, and rebuild after changing them. Mobile is checked by
lint and TypeScript; native binaries require the platform toolchains. To verify
mobile JavaScript bundles separately:

```sh
pnpm --filter @project-tracker/mobile exec expo export --platform all
```

After building, supply `DATABASE_URL` and any other settings in the environment,
then run `pnpm --filter @project-tracker/api start` for the compiled API. Unlike
the development command, `start` does not automatically load the root `.env`.
`pnpm --filter @project-tracker/web preview` serves the built web app locally at
`http://localhost:3000`; `start` is an alias for that local preview.
The web build produces static files in `apps/web/dist`. Deploy that directory
with a static host; Vite preview is only for local verification.

The database package is reserved for server code; lint disallows importing it
from web, mobile, or shared client packages. GitHub Actions installs with the
frozen root lockfile and runs lint, build, typecheck, coverage, web browser tests,
and database integration tests.
