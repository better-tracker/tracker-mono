/*
Created file to automate tests for users contracct
- these tests use node.js's built-in test runner
- to ensure that zod schemas validate user info correctly

tests currently check:
- valid user data is accepted
- invalid user data rejected

run tests using:
pnpm --filter @project-tracker/contracts test
*/

import test from 'node:test';
import assert from 'node:assert/strict';
import { userCreateSchema } from '../dist/users.js';

test('accepts valid user data', () => {
    const result = userCreateSchema.safeParse({
        user_name: 'zac',
        email: 'zac@example.com',
        password: 'test123'
    });

    assert.equal(result.success, true);
});

test('rejects invalid user data', () => {
    const result = userCreateSchema.safeParse({
        user_name: '',
        email: 'invalid-email',
        password: ''
    });

    assert.equal(result.success, false);
});