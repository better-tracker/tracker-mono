/*
automated tests for subtasks contract
- tests use node.js's built in test runner to
- make sure zod schemas validate subtask info correctly

tests currently check:
- valid subtasks data is accepted
- empty descriptions are rejected
- descriptions longer than 2000 characters are rejected
- the completed field defaults to false
- invalid completed values are rejected
- valid subtasks updates are accepted
- subtask updates require both completed and description
- valid subtask responses are accepted
- subtask responses reject invalid uuids
- valid subtask lists are accepted
- subtask lists containing invalid data are rejected

run tests using:
pnpm --filter @project-tracker/contracts test
*/

import test from 'node:test';
import assert from 'node:assert/strict';
import {
    subtaskCreateSchema,
    subtaskUpdateSchema,
    subtaskResponseSchema,
    subtaskListResponseSchema
} from '../dist/subtasks.js';

test('accepts valid subtask data', () => {
    const result = subtaskCreateSchema.safeParse({
        completed: false,
        description: 'Create database tables'
    });

    assert.equal(result.success, true);
});

test('rejects an empty subtask description', () => {
    const result = subtaskCreateSchema.safeParse({
        completed: false,
        description: ''
    });

    assert.equal(result.success, false);
});

test('rejects a subtask description over 2--- characters', () => {
    const result = subtaskCreateSchema.safeParse({
        completed: false,
        description: 'A'.repeat(2001)
    });

    assert.equal(result.success, false);
});

test('defaults completed to false', () => {
    const result = subtaskCreateSchema.safeParse({
        description: 'Create database tables'
    });

    assert.equal(result.success, true);

    if (result.success) {
        assert.equal(result.data.completed, false);
    }
});

test('rejects an invalid completed value', () => {
    const result = subtaskCreateSchema.safeParse({
        completed: 'yes',
        description: 'Create database tables'
    });

    assert.equal(result.success, false);
});

test('accepst a valid subtask update', () => {
    const result = subtaskUpdateSchema.safeParse({
        completed: true,
        description: 'Update database tables'
    });

    assert.equal(result.success, true);
});

test('rejects a subtask update without completed', () => {
    const result = subtaskUpdateSchema.safeParse({
        description: 'Update database tables'
    });

    assert.equal(result.success, false);
});

test('rejects a subtask update without description', () => {
    const result = subtaskUpdateSchema.safeParse({
        completed: true
    });

    assert.equal(result.success, false);
});

test('accepts a valid subtask response', () => {
    const result = subtaskResponseSchema.safeParse({
        id: '22222222-2222-4222-8222-222222222222',
        completed: false,
        description: 'Created database tables',
        createdAt: '2026-10-07T00:00:00.000Z',
        updatedAt: '2026-10-07T00:00:00.000Z'
    });

    assert.equal(result.success, true);
});

test('rejects a subtask respose with an invalid ID', () => {
    const result = subtaskResponseSchema.safeParse({
        id: 'invalid-id',
        completed: false,
        description: 'Created database tables',
        createdAt: '2026-10-07T00:00:00.000Z',
        updatedAt: '2026-10-07T00:00:00.000Z'
    });

    assert.equal(result.success, false);
});

test('accepts a valid subtask list', () => {
    const result = subtaskListResponseSchema.safeParse([
        {
            id: '22222222-2222-4222-8222-222222222222',
            completed: false,
            description: 'Create database tables',
            createdAt: '2026-10-07T00:00:00.000Z',
            updatedAt: '2026-10-07T00:00:00.000Z'
        }
    ]);

    assert.equal(result.success, true);
});

test('rejects a subtask list containing invalid data', () => {
    const result = subtaskListResponseSchema.safeParse([
        {
            id: 'invalid-id',
            completed: false,
            description: 'Create database tables',
            createdAt: '2026-10-07T00:00:00.000Z',
            updatedAt: '2026-10-07T00:00:00.000Z'
        }
    ]);

    assert.equal(result.success, false);
});