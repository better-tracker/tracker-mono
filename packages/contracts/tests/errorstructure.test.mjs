import test from 'node:test';
import assert from 'node:assert/strict';
import { errorResponseSchema } from '@project-tracker/contracts';

test('accepst a valid error response', () => {
    const result = errorResponseSchema.safeParse({
        error: {
            code: 'USER_NOT_FOUND',
            message: 'The requested user does not exist'
        }
    });

    assert.equal(result.success, true);
});

test('rejects an error response without a message', () => {
    const result = errorResponseSchema.safeParse({
        error: {
            code: 'USER_NOT_FOUND'
        }
    });

    assert.equal(result.success, false);
});