/*
automated tests for projects contract
- tests use node.js built-in runner to check
- that the zod schemas validate project info correctly

tests currently check:
- valid porject data is accepted
- empty project names are rejected
- project names longer than 255 char are rejected
- projects can be created without description
- project response dates must user UTC format
- nested subtassks cannot have empty descriptions
- valid project updates are accepted
- project updates requireboth name and description
- valid project responses are accepted
- project responses reject invalid uuids
- valid project lists are ccepted
- project lists containing invalid data are rejected

run tests using:
pnpm --filter @project-tracker/contracts test
*/

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
    projectCreateSchema,
    projectResponseSchema,
    projectUpdateSchema,
    projectListResponseSchema
} from '@project-tracker/contracts';

test('accepts valid project data', () => {
    const result = projectCreateSchema.safeParse({
        name: 'Tracker App',
        description: 'Our group project'
    });

    assert.equal(result.success, true);
});

test('rejects an empty project name', () => {
    const result = projectCreateSchema.safeParse({
        name: '',
        description: 'Our group project'
    });

    assert.equal(result.success, false);
});

test('rejects a project name over 255 characters', () => {
    const result = projectCreateSchema.safeParse({
        name: 'A'.repeat(256),
        description: 'Our group project'
    });

    assert.equal(result.success, false);
});

test('accepts a project without a description', () => {
    const result = projectCreateSchema.safeParse({
        name: 'Tracker App'
    });

    assert.equal(result.success, true);
});

test('rejects project dates with timezone offsets', () => {
    const result = projectResponseSchema.safeParse({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Tracker App',
        description: null,
        subtasks: [],
        createdAt: '2026-10-07T10:00:00+10:00'
    });

    assert.equal(result.success, false);
});

test('rejects nested subtasks with empty desciriptions', () => {
    const result = projectResponseSchema.safeParse({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Tracker App',
        description: null,
        subtasks: [
            {
                id: '22222222-2222-4222-8222-222222222222',
                completed: false,
                description: '',
                createdAt: '2026-10-07T00:00:00.000Z',
                updatedAt: '2026-10-07T00:00:00.000Z'
            }
        ],
        createdAt: '2026-10-07T00:00:00.000Z'
    });

    assert.equal(result.success, false);
});

test('accepts a valid project update', () => {
    const result = projectUpdateSchema.safeParse({
        name: 'Updated Tracker App',
        description: 'Updated project description'
    });

    assert.equal(result.success, true);
});

test('rejects a project update without a name', () => {
    const result = projectUpdateSchema.safeParse({
        description: 'Updated project description'
    });

    assert.equal(result.success, false);
});

test('rejects a project update without a description', () => {
    const result = projectUpdateSchema.safeParse({
        name: 'Updated Tracker App'
    });

    assert.equal(result.success, false);
});

test('accepts a valid project response', () => {
    const result = projectResponseSchema.safeParse({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Tracker App',
        description: null,
        subtasks: [],
        createdAt: '2026-10-07T00:00:00.000Z'
    });

    assert.equal(result.success, true);
});

test('rejects a prokect response with an invalid id', () => {
    const result = projectResponseSchema.safeParse({
        id: 'invalid-id',
        name: 'Tracker App',
        description: null,
        subtasks: [],
        createdAt: '2026-10-07T00:00:00.000Z'
    });

    assert.equal(result.success, false);
});

test('accepts a valid project list', () => {
    const result = projectListResponseSchema.safeParse([
        {
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Tracker App',
            description: null,
            createdAt: '2026-10-07T00:00:00.000Z'
        }
    ]);

    assert.equal(result.success, true);
});

test('rejects a project list containing an invalid project', () => {
    const result = projectListResponseSchema.safeParse([
        {
            id: 'invalid-id',
            name: 'Tracker App',
            description: null,
            createdAt: '2026=10-07T00:00:00.000Z'
        }
    ]);

    assert.equal(result.success, false);
});