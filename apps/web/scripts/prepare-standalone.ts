import { cpSync, existsSync } from 'node:fs';

const output = '.next/standalone/apps/web';
cpSync('.next/static', `${output}/.next/static`, { recursive: true });
if (existsSync('public')) {
  cpSync('public', `${output}/public`, { recursive: true });
}
