import { beforeEach, vi } from 'vitest';
import { resetDatabase } from './fixtures/database.js';

vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');

// Unit tests exercise HTTP handlers with fresh repository fixtures, never a live database.
vi.mock('@project-tracker/database', async () => (await import('./fixtures/database.js')).database);
beforeEach(resetDatabase);
