import { globSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('coverage', { recursive: true });
const result = spawnSync(process.execPath, [
  '--test', '--experimental-test-coverage', '--test-coverage-include=dist/**',
  '--test-reporter=spec', '--test-reporter=lcov',
  '--test-reporter-destination=stdout', '--test-reporter-destination=coverage/lcov.info',
  ...globSync('tests/*.test.mjs').sort(),
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
