import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDiscordMessage, notifyDiscord } from '../notify-discord.mjs';

const webhookUrl = 'https://discord.com/api/webhooks/123/test-token';
function event(action = 'opened', overrides = {}) {
  return {
    action,
    repository: { full_name: 'better-tracker/tracker-mono' },
    sender: { login: 'maintainer' },
    pull_request: {
      number: 42,
      title: 'Add project tracking',
      html_url: 'https://github.com/better-tracker/tracker-mono/pull/42',
      user: { login: 'contributor' },
      base: { ref: 'main' },
      head: { ref: 'feature/projects' },
      state: 'open',
      draft: false,
      merged: false,
      ...overrides,
    },
  };
}

test('includes the PR link, repository, author, actor, and branches without allowing pings', () => {
  const payload = buildDiscordMessage(event('opened', { title: '@everyone "hello"\n$(echo test)' }));
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
  const embed = payload.embeds[0];
  assert.equal(embed.url, event().pull_request.html_url);
  assert.equal(embed.description, 'Pull request opened by maintainer.');
  assert.equal(embed.title, '#42: @everyone "hello"\n$(echo test)');
  assert.equal(embed.fields[0].value, 'better-tracker/tracker-mono');
  assert.equal(embed.fields[1].value, 'contributor');
  assert.equal(embed.fields[2].value, 'feature/projects → main');
});

test('supports every configured action and distinguishes merges, closures, and drafts', () => {
  for (const action of ['opened', 'reopened', 'synchronize', 'edited', 'ready_for_review', 'converted_to_draft', 'closed']) {
    assert.ok(buildDiscordMessage(event(action)));
  }
  assert.equal(buildDiscordMessage(event('closed', { merged: true, state: 'closed' })).embeds[0].description,
    'Pull request merged by maintainer.');
  assert.equal(buildDiscordMessage(event('closed', { state: 'closed' })).embeds[0].fields[3].value, 'Closed');
  assert.equal(buildDiscordMessage(event('opened', { draft: true })).embeds[0].fields[3].value, 'Draft');
});

test('ignores other target branches, unrelated events, and unsupported actions', async () => {
  const fetchImpl = () => { throw new Error('Must not send'); };
  for (const input of [event('opened', { base: { ref: 'develop' } }), event('labeled'), event('toString'), { action: 'ping' }]) {
    assert.equal(buildDiscordMessage(input), null);
    assert.equal(await notifyDiscord(input, undefined, { fetchImpl }), false);
  }
});

test('truncates user text to Discord embed limits', () => {
  const input = event('opened', { title: 'a'.repeat(1000), head: { ref: 'b'.repeat(2000) } });
  const embed = buildDiscordMessage(input).embeds[0];
  assert.equal(embed.title.length, 256);
  assert.equal(embed.fields[2].value.length, 1024);
});

test('requires a Discord webhook secret without exposing its value', async () => {
  await assert.rejects(notifyDiscord(event(), undefined), /repository Actions secret/);
  for (const url of ['secret-token', 'http://discord.com/api/webhooks/123/token', 'https://example.com/api/webhooks/123/token']) {
    await assert.rejects(notifyDiscord(event(), url), { message: 'DISCORD_WEBHOOK_URL must be a Discord webhook URL.' });
  }
});

test('posts JSON, waits for confirmation, preserves a thread, and disables redirects', async () => {
  let calls = 0;
  const sent = await notifyDiscord(event(), `${webhookUrl}?thread_id=456`, {
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url.searchParams.get('wait'), 'true');
      assert.equal(url.searchParams.get('thread_id'), '456');
      assert.equal(options.method, 'POST');
      assert.equal(options.redirect, 'error');
      assert.deepEqual(JSON.parse(options.body), buildDiscordMessage(event()));
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.ok(options.signal instanceof AbortSignal);
      return new Response('{}', { status: 200 });
    },
  });
  assert.equal(sent, true);
  assert.equal(calls, 1);
});

test('retries rate limits and server errors with bounded delays', async () => {
  const responses = [new Response('{"retry_after":0.5}', { status: 429 }), new Response('', { status: 503 }), new Response('{}')];
  const waits = [];
  assert.equal(await notifyDiscord(event(), webhookUrl, {
    fetchImpl: async () => responses.shift(),
    sleep: async (ms) => { waits.push(ms); },
  }), true);
  assert.deepEqual(waits, [500, 2000]);
});

test('fails after three attempts and does not retry permanent failures or long rate limits', async () => {
  for (const [status, body, expectedCalls] of [[503, '', 3], [401, '', 1], [429, '{"retry_after":120}', 1]]) {
    let calls = 0;
    await assert.rejects(notifyDiscord(event(), webhookUrl, {
      fetchImpl: async () => { calls++; return new Response(body, { status }); },
      sleep: async () => {},
    }), /Discord webhook/);
    assert.equal(calls, expectedCalls);
  }
});

test('sanitizes network errors that could contain the secret URL', async () => {
  await assert.rejects(notifyDiscord(event(), webhookUrl, {
    fetchImpl: async () => { throw new Error(`Failed to fetch ${webhookUrl}`); },
  }), { message: 'Discord webhook request failed or timed out.' });
});
