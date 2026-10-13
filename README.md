# Project Tracker

Minimal TypeScript workspace. No product functionality is implemented.

```text
apps/web          React + TypeScript with Vite (static production output)
apps/api          Fastify server (no routes)
apps/mobile       Expo SDK 57 + Expo Router, iOS and Android
packages/contracts   Empty shared API schemas/types boundary
packages/api-client  Empty cross-platform client boundary
packages/database    Empty server-only PostgreSQL boundary
```

## Local setup

Use Node.js 24 LTS (`nvm use`), pnpm 12.5.1, and Docker with Compose for optional
local PostgreSQL. Mobile device testing needs a compatible Expo Go installation,
an iOS simulator (macOS/Xcode), or an Android emulator (Android Studio).

```sh
npm install --global pnpm@12.5.1
pnpm install --frozen-lockfile
```

Older Corepack versions may fail to launch pnpm 12. Update Corepack or use
`npx --yes pnpm@12.5.1` in place of `pnpm` without changing the pinned version.
TypeScript 6 and ESLint 9 are pinned for compatibility with the framework tooling.
All direct dependencies use stable releases. Babel transitively requires
`gensync@1.0.0-beta.2`; that upstream dependency is retained in the lockfile.

## Development

```sh
pnpm dev             # web and API concurrently
pnpm dev:web         # web only, localhost:3000
pnpm dev:api         # API only, localhost:3001
pnpm dev:mobile      # Expo / Metro, port 8081
```

The API binds to `0.0.0.0` and returns 404 for every path. `PORT` overrides its
listening port. It starts independently of PostgreSQL and closes on SIGINT/SIGTERM.
From `apps/mobile`, `pnpm ios` or `pnpm android` opens the selected platform.
The mobile project also supports native development builds through Expo; no native
projects or custom native modules are included.

`.env.example` documents the future integration settings. For Compose, copy it to
root `.env`. Export `PORT` in your shell to override the API port. For web settings,
copy `apps/web/.env.example` to `apps/web/.env.local`; Vite loads app-local `.env`
and `.env.local`. Expo loads app-local `.env` in `apps/mobile`.
The application commands do not automatically load the root `.env`.
Public API URLs are reserved and currently unused. For a physical mobile device,
use your computer's LAN IP; for the Android emulator use `10.0.2.2` instead of
`localhost`. Never put secrets in `VITE_*` or `EXPO_PUBLIC_*` values. Future web
code reads `import.meta.env.VITE_API_URL`; Vite embeds public values at build time,
so rebuild the web app when changing production settings.

The web dev and preview servers use port 3000 and fail if it is already occupied.

```sh
cp .env.example .env
docker compose up -d postgres
docker compose ps
docker compose down
```

PostgreSQL 18 listens only on `127.0.0.1:5432`. Its named volume persists across
container restarts and `docker compose down`. Credentials are local examples only;
changing initialization credentials requires an appropriately migrated or fresh
volume. The API does not connect to the database yet.

## Checks and builds

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm check           # lint, typecheck, then build
```

Build runs the API, shared packages, and web in workspace dependency order. Shared
packages emit JavaScript and declarations into `dist/`; build them before using
future imports in an app, and rebuild after changing them. Mobile is checked by
lint and TypeScript; native binaries require the platform toolchains. To verify
mobile JavaScript bundles separately:

```sh
pnpm --filter @project-tracker/mobile exec expo export --platform all
```

After building, `pnpm --filter @project-tracker/api start` runs the compiled API.
`pnpm --filter @project-tracker/web preview` serves the built web app locally at
`http://localhost:3000`; `start` is an alias for that local preview.
The web build produces static files in `apps/web/dist`. Deploy that directory
with a static host; Vite preview is only for local verification.

Contracts, API client, database integration, and API routes are intentionally
empty. The database package is reserved for server code; lint disallows importing
it from web, mobile, or shared client packages. No ORM, authentication, tables,
placeholder tests, deployment configuration, or cloud resources are included.
GitHub Actions installs with the frozen root lockfile and runs all three checks.