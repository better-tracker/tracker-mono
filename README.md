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
pnpm --filter @project-tracker/contracts --filter @project-tracker/api-client build
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

## Run the backend

Start Docker Desktop (or your Docker engine), select Node.js 24 with `nvm use`,
and install pnpm 12.5.1 as shown in Local setup. From the project root, run:

```sh
bash scripts/start-backend.sh
```

The script installs dependencies using the frozen lockfile, creates `.env` from
`.env.example` only if it is missing, starts PostgreSQL and waits for it to become
healthy, applies pending migrations, builds the shared contracts, and starts the
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
pnpm --filter @project-tracker/contracts build
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
