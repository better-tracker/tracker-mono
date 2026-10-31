import { vi } from 'vitest';

vi.stubEnv(
    'DATABASE_URL',
    'postgresql://test:test@localhost:5432/test_db'
);
vi.stubEnv('AUTH0_DOMAIN', 'tenant.auth0.com');
vi.stubEnv('AUTH0_AUDIENCE', 'https://tracker.example.test');
