import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.expo/**', '**/node_modules/**', '**/expo-env.d.ts', '**/coverage/**', '**/.vitest/**', '**/playwright-report/**', '**/test-results/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['apps/api/**', 'packages/database/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@project-tracker/database', '@project-tracker/database/*', '**/database', '**/database/**'], message: 'The database package is server-only.' }],
      }],
    },
  },
);
