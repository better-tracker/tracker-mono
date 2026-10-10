import { globSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const coverage = process.argv.includes('--coverage');
const suites = [
  { name: 'contracts', path: 'packages/contracts', pattern: 'tests/*.test.mjs', deferred: false },
  { name: 'api', path: 'apps/api', pattern: 'tests/unit/**/*.test.ts', deferred: false },
  { name: 'api-client', path: 'packages/api-client', pattern: 'tests/unit/**/*.test.ts', deferred: true },
  { name: 'web', path: 'apps/web', pattern: 'tests/unit/**/*.test.{ts,tsx}', deferred: true },
  { name: 'mobile', path: 'apps/mobile', pattern: 'tests/unit/**/*.test.{ts,tsx,js,jsx}', deferred: true },
];

/** @param {string[]} args */
function run(args, command = 'pnpm') {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['--test', 'scripts/tests/notify-discord.test.mjs'], process.execPath);

run(['--filter', '@project-tracker/contracts', '--filter', '@project-tracker/api-client', 'run', 'build']);

for (const suite of suites) {
  const files = globSync(`${suite.path}/${suite.pattern}`, { cwd: root });
  if (files.length === 0) {
    if (!suite.deferred) throw new Error(`Required ${suite.name} suite has no test files`);
    console.log(`DEFERRED: ${suite.name} — configured; feature tests have not been added yet.`);
    continue;
  }
  run(['--filter', `@project-tracker/${suite.name}`, 'run', coverage ? 'test:coverage' : 'test']);
}

console.log('Database integration tests run separately with pnpm test:integration.');
console.log('Web browser tests are deferred until product workflows exist (pnpm test:e2e).');
