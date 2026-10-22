#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo 'Usage: bash scripts/start-backend.sh'
  echo 'Install dependencies, start PostgreSQL, apply migrations, and run the API.'
  echo 'Requires Node.js 24, pnpm 12.5.1, and a running Docker engine with Compose.'
  exit 0
fi

if [[ $# -ne 0 ]]; then
  echo 'Unexpected argument. Use --help for usage.' >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."

for command in node pnpm docker; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing $command. Install the prerequisites listed in README.md." >&2
    exit 1
  fi
done

if [[ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]]; then
  echo 'Use Node.js 24: run nvm use from the project root.' >&2
  exit 1
fi

if [[ "$(pnpm --version)" != "12.5.1" ]]; then
  echo 'Use pnpm 12.5.1: run npm install --global pnpm@12.5.1.' >&2
  exit 1
fi

docker compose version >/dev/null
if ! docker info >/dev/null 2>&1; then
  echo 'Docker is not running or is unavailable. Start Docker Desktop or your Docker engine and retry.' >&2
  exit 1
fi

pnpm install --frozen-lockfile

if [[ ! -e .env ]]; then
  cp .env.example .env
  echo 'Created .env from .env.example.'
fi

docker compose up -d --wait postgres
pnpm --filter @project-tracker/database migrate
pnpm --filter @project-tracker/contracts --filter @project-tracker/utils build

echo 'Starting the API (default: http://localhost:3001). Press Ctrl+C to stop it.'
echo 'PostgreSQL stays running. Use docker compose down to stop it.'
exec pnpm dev:api
