import { vi } from 'vitest';

vi.stubEnv(
    'DATABASE_URL',
    'postgresql://test:test@localhost:5432/test_db'
);