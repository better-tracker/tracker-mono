# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm TypeScript monorepo. The web app uses Vite, React, React Router and Tailwind; pages live in `apps/web/src/pages`, and routes are registered in `apps/web/src/App.tsx`. `apps/mobile/src/app` contains Expo Router screens, and `apps/api/src` contains the Fastify server and feature modules. Shared types belong in `packages/contracts`; cross-platform requests belong in `packages/api-client`; shared utilities belong in `packages/utils`; PostgreSQL code and numbered SQL migrations belong in `packages/database`. Keep database imports out of web, mobile, and client packages. `TODOs/` tracks planned work, and `.github/workflows/ci.yml` defines CI. Mobile files are tracked directly in this repository.

## Build, Test, and Development Commands

Use Node 24 (`nvm use`) and pnpm 12.5.1. Run `pnpm install --frozen-lockfile` after cloning. `pnpm dev` starts web and API together; `pnpm dev:web`, `pnpm dev:api`, and `pnpm dev:mobile` start one app. `pnpm lint` checks ESLint, `pnpm typecheck` checks TypeScript, and `pnpm build` builds packages, API, and web. Run `pnpm check` before a pull request; it runs lint, typecheck, build and tests in that order. For mobile bundle verification, run `pnpm --filter @project-tracker/mobile exec expo export --platform all`.

## Coding Style & Naming Conventions

Use strict TypeScript and follow the surrounding file's formatting; new TS/TSX code should use two-space indentation, single quotes, and semicolons. Name React components and web page files in PascalCase, such as `Tasks.tsx`, and functions and variables in camelCase. Follow framework file conventions such as Expo Router's `_layout.tsx` and Fastify's `*.routes.ts`. Number new migrations sequentially, for example `004_add_status.sql`. ESLint 9 and `typescript-eslint` provide the lint rules; no formatter is configured.

## Testing Guidelines

Use the existing test tooling: Vitest for web, API, API-client, utilities and database tests; React Testing Library for web components; Playwright for web browser tests; Jest for mobile; and Node's test runner for contracts and scripts. Add focused tests for new behavior alongside existing suites, using names such as `projects.service.test.ts` or `workflows.test.tsx`.

`pnpm test` runs the fast suites through `scripts/test.mjs`; `pnpm test:coverage` runs them with coverage. Run `pnpm test:e2e` for demo-mode web browser tests and `pnpm test:integration` for database tests, which require Docker for Testcontainers. Browser and database suites run separately from `pnpm check`. Manually verify affected web, API, or mobile flows as needed. CI runs lint, build, typecheck and fast-test coverage, plus separate browser and database coverage jobs.

## Commit & Pull Request Guidelines

Recent commits use short, informal subjects; no enforced commit format is evident. Write a concise, imperative subject that names the change, and reference an issue when relevant. Pull requests should explain the behavior changed, note verification commands and any remaining gaps, link related issues, and include screenshots for visible UI changes.

## Configuration & Secrets

Use `.env.example` as a template for local settings. Keep real credentials out of Git and out of `VITE_*` and `EXPO_PUBLIC_*` variables. The root `.env` supports local Docker Compose and database migration commands; web and mobile load their own app-local environment files.
