# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm TypeScript monorepo. `apps/web/src/app` contains Next.js routes, `apps/mobile/src/app` contains Expo Router screens, and `apps/api/src` contains the Fastify server and feature modules. Shared types belong in `packages/contracts`; cross-platform requests belong in `packages/api-client`; PostgreSQL code and numbered SQL migrations belong in `packages/database`. Keep database imports out of web, mobile, and client packages. `TODOs/` tracks planned work, and `.github/workflows/ci.yml` defines CI. `apps/mobile` is a Git link; check its nested repository status when changing mobile code.

## Build, Test, and Development Commands

Use Node 24 (`nvm use`) and pnpm 12.5.1. Run `pnpm install --frozen-lockfile` after cloning. `pnpm dev` starts web and API together; `pnpm dev:web`, `pnpm dev:api`, and `pnpm dev:mobile` start one app. `pnpm lint` checks ESLint, `pnpm typecheck` checks TypeScript, and `pnpm build` builds packages, API, and web. Run `pnpm check` before a pull request; it runs all three in order. For mobile bundle verification, run `pnpm --filter @project-tracker/mobile exec expo export --platform all`.

## Coding Style & Naming Conventions

Use strict TypeScript and follow the surrounding file's formatting; new TS/TSX code should use two-space indentation, single quotes, and semicolons. Name React components in PascalCase and functions and variables in camelCase. Follow framework file conventions such as `page.tsx`, `_layout.tsx`, and `*.routes.ts`. Number new migrations sequentially, for example `003_add_status.sql`. ESLint 9 and `typescript-eslint` provide the lint rules; no formatter is configured.

## Testing Guidelines

No test framework, `test` script, or coverage target is configured. For new behavior, add focused tests when introducing a test runner, using names such as `projects.service.test.ts`, and document how to run them. Until then, run `pnpm check` and manually verify affected web, API, or mobile flows. CI currently runs lint, typecheck, and build.

## Commit & Pull Request Guidelines

Recent commits use short, informal subjects; no enforced commit format is evident. Write a concise, imperative subject that names the change, and reference an issue when relevant. Pull requests should explain the behavior changed, note verification commands and any remaining gaps, link related issues, and include screenshots for visible UI changes.

## Configuration & Secrets

Use `.env.example` as a template for local settings. Keep real credentials out of Git and out of `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` variables. The root `.env` supports local Docker Compose and database migration commands; web and mobile load their own app-local environment files.
