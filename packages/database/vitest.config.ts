import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    env: { DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db' },
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    coverage: { provider: 'v8', reporter: ['text', 'lcov'], include: ['src/**/*.ts'] },
  },
});
