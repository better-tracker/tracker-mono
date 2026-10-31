// Run from the repository root after building contracts, database, and API:
// node --env-file=.env apps/api/scripts/check-auth0-routes.mjs
// Uses the configured PostgreSQL database inside a rolled-back transaction.
// Only external Auth0 token verification and /userinfo responses are stubbed.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPool } from '@project-tracker/database';
import { buildApp } from '../dist/app.js';

const pool = createPool(process.env.DATABASE_URL);
let client;
let app;
const originalFetch = globalThis.fetch;
const marker = randomUUID();
const subjects = { alice: `auth0|route-check-alice-${marker}`, bob: `auth0|route-check-bob-${marker}` };
let failProfile = false;
let checks = 0;

async function check(name, action) {
  await action();
  checks += 1;
  console.log(`PASS ${name}`);
}

try {
  client = await pool.connect();
  await client.query('BEGIN');
  app = buildApp({ database: client });
  await app.ready();
  assert.ok(app.auth0Client, 'Auth0 SDK was registered');
  Object.defineProperty(app.auth0Client, 'verifyAccessToken', {
    value: async ({ accessToken }) => {
      assert.ok(subjects[accessToken], 'Unknown test identity');
      return { sub: subjects[accessToken] };
    },
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/userinfo');
    if (failProfile) return new Response(null, { status: 503 });
    const identity = options.headers.Authorization.replace(/^Bearer /, '');
    assert.ok(subjects[identity]);
    return new Response(JSON.stringify({
      sub: subjects[identity], name: identity,
      email: `${identity}-${marker}@example.invalid`,
    }));
  };
  async function request(method, identity = 'alice', payload) {
    return app.inject({ method, url: '/v1/users/me',
      headers: { authorization: `Bearer ${identity}` },
      ...(payload === undefined ? {} : { payload }),
    });
  }
  let alice;
  let bob;
  await check('POST creates a real PostgreSQL user', async () => {
    const response = await request('POST');
    assert.equal(response.statusCode, 200, response.body);
    alice = response.json();
    assert.equal(alice.auth0_user_id, subjects.alice);
    const result = await client.query('SELECT id FROM users WHERE auth0_user_id = $1', [subjects.alice]);
    assert.equal(result.rows[0].id, alice.id);
  });
  await check('repeated POST returns the same UUID without duplicating the user', async () => {
    assert.equal((await request('POST')).json().id, alice.id);
    const result = await client.query('SELECT COUNT(*)::int AS count FROM users WHERE auth0_user_id = $1', [subjects.alice]);
    assert.equal(result.rows[0].count, 1);
  });
  await check('GET returns the authenticated local user', async () => {
    const response = await request('GET');
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json(), alice);
    assert.equal('password' in response.json(), false);
  });
  await check('PATCH updates the name and picture in PostgreSQL', async () => {
    const update = { user_name: 'Updated Alice', profile_pic: 'https://example.invalid/avatar.png' };
    const response = await request('PATCH', 'alice', update);
    assert.equal(response.statusCode, 200, response.body);
    const { rows } = await client.query('SELECT user_name, profile_pic FROM users WHERE id = $1', [alice.id]);
    assert.deepEqual(rows[0], update);
  });
  await check('PATCH can clear the picture while preserving the name', async () => {
    const response = await request('PATCH', 'alice', { profile_pic: null });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().profile_pic, null);
    assert.equal(response.json().user_name, 'Updated Alice');
  });
  await check('POST preserves an existing locally edited profile', async () => {
    const response = await request('POST');
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().user_name, 'Updated Alice');
  });
  await check('PATCH rejects empty, invalid, and identity-changing updates', async () => {
    for (const payload of [{}, { user_name: '' }, { user_name: 'x'.repeat(26) }, { email: 'other@example.invalid' }, { auth0_user_id: subjects.bob }, { id: randomUUID() }]) {
      const response = await request('PATCH', 'alice', payload);
      assert.equal(response.statusCode, 400, response.body);
    }
    assert.equal((await request('GET')).json().user_name, 'Updated Alice');
  });
  await check('a second identity gets a separate local account', async () => {
    const response = await request('POST', 'bob');
    assert.equal(response.statusCode, 200, response.body);
    bob = response.json();
    assert.notEqual(bob.id, alice.id);
    assert.equal(bob.auth0_user_id, subjects.bob);
  });
  await check('current-user updates do not modify another account', async () => {
    assert.equal((await request('PATCH', 'bob', { user_name: 'Updated Bob' })).statusCode, 200);
    assert.equal((await request('GET', 'alice')).json().user_name, 'Updated Alice');
  });
  await check('all four routes reject missing authorization', async () => {
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
      const response = await app.inject({ method, url: '/v1/users/me',
        ...(method === 'PATCH' ? { payload: { user_name: 'New' } } : {}),
      });
      assert.equal(response.statusCode, 400, response.body); // Actual SDK behavior.
    }
  });
  await check('browser CORS preflight permits PATCH', async () => {
    const response = await app.inject({ method: 'OPTIONS', url: '/v1/users/me', headers: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      'access-control-request-method': 'PATCH',
      'access-control-request-headers': 'authorization,content-type',
    } });
    assert.equal(response.statusCode, 204, response.body);
    assert.match(response.headers['access-control-allow-methods'], /PATCH/);
  });
  await check('DELETE removes only the authenticated local account', async () => {
    const response = await request('DELETE');
    assert.equal(response.statusCode, 204, response.body);
    assert.equal(response.body, '');
    const result = await client.query('SELECT id FROM users WHERE id = $1', [alice.id]);
    assert.equal(result.rowCount, 0);
    assert.equal((await request('GET', 'bob')).json().id, bob.id);
  });
  await check('GET, PATCH, and DELETE return 404 after local deletion', async () => {
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      const response = await request(method, 'alice', method === 'PATCH' ? { user_name: 'Missing' } : undefined);
      assert.equal(response.statusCode, 404, response.body);
    }
  });
  await check('failed Auth0 profile retrieval leaves no new local user', async () => {
    failProfile = true;
    const response = await request('POST');
    assert.equal(response.statusCode, 502, response.body);
    const result = await client.query('SELECT id FROM users WHERE auth0_user_id = $1', [subjects.alice]);
    assert.equal(result.rowCount, 0);
    failProfile = false;
  });
  await check('POST recreates the local user after deletion', async () => {
    const response = await request('POST');
    assert.equal(response.statusCode, 200, response.body);
    assert.notEqual(response.json().id, alice.id);
  });
} finally {
  globalThis.fetch = originalFetch;
  try {
    if (client) await client.query('ROLLBACK');
  } finally {
    if (app) await app.close();
    client?.release();
    await pool.end();
  }
}
console.log(`${checks} checks passed; all test data rolled back.`);
