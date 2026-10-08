import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    coverage: { provider: 'v8', reporter: ['text', 'lcov'], include: ['src/**/*.ts'] },
  },
});
