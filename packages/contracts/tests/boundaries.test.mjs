import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as contracts from '@project-tracker/contracts';

const id = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-10-08T00:00:00.000Z';
const project = { id, name: 'Tracker', description: null, createdAt: timestamp };
const subtask = { id, description: 'Build tests', completed: false, createdAt: timestamp, updatedAt: timestamp };
const user = { id, user_name: 'alice', email: 'alice@example.com', profile_pic: null };

describe('text boundaries and normalization', () => {
  /** @type {Array<[string, import('zod').ZodType, number]>} */
  const cases = [
    ['project name', contracts.projectNameSchema, 255],
    ['subtask description', contracts.subtaskDescriptionSchema, 2000],
    ['username', contracts.userNameSchema, 25],
  ];
  for (const [label, schema, max] of cases) {
    it(`${label} trims surrounding whitespace`, () => {
      assert.equal(schema.parse('  valid text \n'), 'valid text');
    });
    it(`${label} accepts exactly ${max} characters`, () => {
      assert.equal(schema.parse('a'.repeat(max)), 'a'.repeat(max));
    });
    it(`${label} rejects ${max + 1} characters`, () => {
      assert.equal(schema.safeParse('a'.repeat(max + 1)).success, false);
    });
    it(`${label} rejects whitespace-only input`, () => {
      assert.equal(schema.safeParse(' \n\t ').success, false);
    });
    it(`${label} rejects null and non-text values`, () => {
      for (const value of [null, 123, true, {}, []]) {
        assert.equal(schema.safeParse(value).success, false);
      }
    });
  }

  it('project descriptions trim, accept null/empty text and enforce the 2000-character limit', () => {
    const schema = contracts.projectDescriptionSchema;
    assert.equal(schema.parse('  description  '), 'description');
    assert.equal(schema.parse('  '), '');
    assert.equal(schema.parse(null), null);
    assert.equal(schema.safeParse('a'.repeat(2000)).success, true);
    assert.equal(schema.safeParse('a'.repeat(2001)).success, false);
  });
});

describe('request defaults and required update fields', () => {
  it('allows project creation with an omitted or null description', () => {
    assert.deepEqual(contracts.projectCreateSchema.parse({ name: '  Tracker  ' }), { name: 'Tracker' });
    assert.deepEqual(contracts.projectCreateSchema.parse({ name: 'Tracker', description: null }), {
      name: 'Tracker', description: null,
    });
  });

  it('requires both project PUT fields while permitting a null description', () => {
    assert.equal(contracts.projectUpdateSchema.safeParse({ name: 'Tracker', description: null }).success, true);
    for (const input of [{}, { name: 'Tracker' }, { description: null }]) {
      assert.equal(contracts.projectUpdateSchema.safeParse(input).success, false);
    }
  });

  it('defaults subtask completion only when omitted and preserves explicit booleans', () => {
    assert.equal(contracts.subtaskCreateSchema.parse({ description: 'Do work' }).completed, false);
    for (const completed of [false, true]) {
      assert.equal(contracts.subtaskCreateSchema.parse({ description: 'Do work', completed }).completed, completed);
    }
    for (const completed of [null, 0, 'false']) {
      assert.equal(contracts.subtaskCreateSchema.safeParse({ description: 'Do work', completed }).success, false);
    }
  });

  it('requires both subtask PUT fields instead of applying create defaults', () => {
    for (const input of [{}, { description: 'Do work' }, { completed: false }]) {
      assert.equal(contracts.subtaskUpdateSchema.safeParse(input).success, false);
    }
  });
});

describe('response IDs, timestamps and collections', () => {
  /** @type {Array<[string, import('zod').ZodType]>} */
  const idCases = [
    ['project', contracts.projectIdSchema],
    ['subtask', contracts.subtaskIdSchema],
    ['user', contracts.userIdSchema],
  ];
  for (const [label, schema] of idCases) {
    it(`${label} IDs accept UUIDs and reject malformed values`, () => {
      assert.equal(schema.safeParse(id).success, true);
      for (const value of ['temporary-id', '11111111-1111-4111-8111-11111111111', 123, null]) {
        assert.equal(schema.safeParse(value).success, false);
      }
    });
  }

  it('accepts UTC dates in project and subtask responses', () => {
    assert.equal(contracts.projectResponseSchema.safeParse({ ...project, subtasks: [subtask] }).success, true);
    assert.equal(contracts.subtaskResponseSchema.safeParse(subtask).success, true);
  });

  for (const value of ['2026-10-08T10:00:00+10:00', '2026-10-08T00:00:00', '2026-10-08', 'not-a-date']) {
    it(`rejects non-UTC/invalid response timestamp ${value}`, () => {
      assert.equal(contracts.projectResponseSchema.safeParse({ ...project, subtasks: [], createdAt: value }).success, false);
      for (const field of ['createdAt', 'updatedAt']) {
        assert.equal(contracts.subtaskResponseSchema.safeParse({ ...subtask, [field]: value }).success, false);
      }
      assert.equal(contracts.projectResponseSchema.safeParse({
        ...project, subtasks: [{ ...subtask, updatedAt: value }],
      }).success, false);
    });
  }

  it('requires the project detail subtask array and validates its members', () => {
    assert.equal(contracts.projectResponseSchema.safeParse(project).success, false);
    assert.equal(contracts.projectResponseSchema.safeParse({ ...project, subtasks: [{ ...subtask, completed: 'yes' }] }).success, false);
  });

  /** @type {Array<[string, import('zod').ZodType, object]>} */
  const listCases = [
    ['projects', contracts.projectListResponseSchema, project],
    ['subtasks', contracts.subtaskListResponseSchema, subtask],
    ['users', contracts.userListResponseSchema, user],
  ];
  for (const [label, schema, valid] of listCases) {
    it(`${label} lists accept empty/valid arrays and reject an invalid member`, () => {
      assert.deepEqual(schema.parse([]), []);
      assert.equal(schema.safeParse([valid]).success, true);
      assert.equal(schema.safeParse([valid, { ...valid, id: 'bad-id' }]).success, false);
      assert.equal(schema.safeParse({ items: [valid] }).success, false);
    });
  }
});

describe('users and errors', () => {
  const createUser = { user_name: 'alice', email: 'alice@example.com', password: 'test-password' };

  it('validates each required user creation field independently', () => {
    for (const invalid of [{ user_name: ' ' }, { email: 'bad-email' }, { password: '' }]) {
      assert.equal(contracts.userCreateSchema.safeParse({ ...createUser, ...invalid }).success, false);
    }
    for (const field of ['user_name', 'email', 'password']) {
      /** @type {Record<string, unknown>} */
      const input = { ...createUser };
      delete input[field];
      assert.equal(contracts.userCreateSchema.safeParse(input).success, false);
    }
  });

  it('permits omitted/null/text profile pictures on creation', () => {
    assert.equal(contracts.userCreateSchema.safeParse(createUser).success, true);
    for (const profile_pic of [null, '/images/alice.png']) {
      assert.equal(contracts.userCreateSchema.safeParse({ ...createUser, profile_pic }).success, true);
    }
    assert.equal(contracts.userCreateSchema.safeParse({ ...createUser, profile_pic: 123 }).success, false);
  });

  it('requires username/email on user updates without requiring a password', () => {
    assert.equal(contracts.userUpdateSchema.safeParse({ user_name: 'alice', email: 'alice@example.com' }).success, true);
    assert.equal(contracts.userUpdateSchema.safeParse({ user_name: 'alice' }).success, false);
    assert.equal(contracts.userUpdateSchema.safeParse({ email: 'alice@example.com' }).success, false);
  });

  it('requires the nullable profile-picture response field and excludes passwords', () => {
    const result = contracts.userResponseSchema.parse({ ...user, password: 'must-not-be-returned' });
    assert.deepEqual(result, user);
    const withoutProfilePic = { id: user.id, user_name: user.user_name, email: user.email };
    assert.equal(contracts.userResponseSchema.safeParse(withoutProfilePic).success, false);
  });

  it('validates the nested error code and message independently', () => {
    assert.deepEqual(contracts.errorResponseSchema.parse({ error: { code: 'NOT_FOUND', message: 'Missing record' } }), {
      error: { code: 'NOT_FOUND', message: 'Missing record' },
    });
    for (const value of [{}, { code: 'NOT_FOUND', message: 'Missing record' }, { error: null },
      { error: { code: 'NOT_FOUND' } }, { error: { message: 'Missing record' } },
      { error: { code: 404, message: 'Missing record' } }, { error: { code: 'NOT_FOUND', message: 404 } }]) {
      assert.equal(contracts.errorResponseSchema.safeParse(value).success, false);
    }
  });
});

it('exports every shared runtime schema through the public package entry point', () => {
  /** @type {Array<keyof typeof contracts>} */
  const names = [
    'projectIdSchema', 'projectNameSchema', 'projectDescriptionSchema', 'projectCreateSchema',
    'projectUpdateSchema', 'projectSubtaskSchema', 'projectResponseSchema', 'projectListItemSchema',
    'projectListResponseSchema', 'subtaskIdSchema', 'subtaskDescriptionSchema', 'subtaskCreateSchema',
    'subtaskUpdateSchema', 'subtaskResponseSchema', 'subtaskListResponseSchema', 'userIdSchema',
    'userNameSchema', 'userEmailSchema', 'userPasswordSchema', 'userProfilePicSchema',
    'userCreateSchema', 'userUpdateSchema', 'userResponseSchema', 'userListResponseSchema', 'errorResponseSchema',
  ];
  for (const name of names) {
    assert.equal(typeof contracts[name]?.safeParse, 'function', `${name} must be exported`);
  }
});
