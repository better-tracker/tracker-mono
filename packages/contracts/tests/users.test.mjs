import test from 'node:test';
import assert from 'node:assert/strict';
import { userCreateSchema } from '@project-tracker/contracts';

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