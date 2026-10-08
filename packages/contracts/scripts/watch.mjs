import { watch } from 'node:fs';
import { spawn } from 'node:child_process';

// Rebuild before each run so schema edits cannot be tested against stale dist files.
let running = false;
let pending = false;

function run() {
  if (running) { pending = true; return; }
  running = true;
  const child = spawn('pnpm', ['run', 'test'], { stdio: 'inherit' });
  child.on('error', (error) => { console.error(error); process.exit(1); });
  child.on('exit', () => {
    running = false;
    if (pending) { pending = false; run(); }
  });
}

watch('src', { recursive: true }, run);
watch('tests', { recursive: true }, run);
run();
