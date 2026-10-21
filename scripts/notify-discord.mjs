import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import {
  DISCORD_EMBED_DESCRIPTION_MAX_LENGTH,
  DISCORD_EMBED_FIELD_VALUE_MAX_LENGTH,
  DISCORD_EMBED_TITLE_MAX_LENGTH,
  DISCORD_MAX_ATTEMPTS,
  DISCORD_MAX_RETRY_AFTER_SECONDS,
  DISCORD_REQUEST_TIMEOUT_MS,
  DISCORD_RETRY_DELAY_MS,
  MILLISECONDS_PER_SECOND,
} from './discord.constants.mjs';

const actions = {
  opened: 'opened',
  reopened: 'reopened',
  edited: 'edited',
  ready_for_review: 'ready for review',
  converted_to_draft: 'converted to draft',
  closed: 'closed',
};

function truncate(value, limit) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export function buildDiscordMessage(event) {
  const pr = event.pull_request;
  if (pr?.base?.ref !== 'main' || !Object.hasOwn(actions, event.action)) return null;

  const merged = event.action === 'closed' && pr.merged;
  const action = merged ? 'merged' : actions[event.action];

  return {
    username: 'GitHub PR notifications',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: truncate(`#${pr.number}: ${pr.title}`, DISCORD_EMBED_TITLE_MAX_LENGTH),
      url: pr.html_url,
      description: truncate(`Pull request ${action} by ${event.sender.login}.`, DISCORD_EMBED_DESCRIPTION_MAX_LENGTH),
      color: merged ? 0x8250df : event.action === 'closed' ? 0xcf222e : 0x2da44e,
      fields: [
        { name: 'Repository', value: truncate(event.repository.full_name, DISCORD_EMBED_FIELD_VALUE_MAX_LENGTH) },
        { name: 'Author', value: truncate(pr.user.login, DISCORD_EMBED_FIELD_VALUE_MAX_LENGTH), inline: true },
        { name: 'Branches', value: truncate(`${pr.head.ref} → ${pr.base.ref}`, DISCORD_EMBED_FIELD_VALUE_MAX_LENGTH), inline: true },
        { name: 'Status', value: merged ? 'Merged' : pr.state === 'closed' ? 'Closed' : pr.draft ? 'Draft' : 'Open', inline: true },
      ],
    }],
  };
}

export async function notifyDiscord(event, webhookUrl, { fetchImpl = fetch, sleep = delay } = {}) {
  const payload = buildDiscordMessage(event);
  if (!payload) return false;
  if (!webhookUrl) throw new Error('Set the DISCORD_WEBHOOK_URL repository Actions secret.');

  let url;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new Error('DISCORD_WEBHOOK_URL must be a Discord webhook URL.');
  }
  if (url.protocol !== 'https:' ||
      !['discord.com', 'canary.discord.com', 'ptb.discord.com', 'discordapp.com'].includes(url.hostname) ||
      !/^\/api(?:\/v\d+)?\/webhooks\/\d+\/[^/]+$/.test(url.pathname) ||
      url.username || url.password || url.port) {
    throw new Error('DISCORD_WEBHOOK_URL must be a Discord webhook URL.');
  }
  url.searchParams.set('wait', 'true');

  for (let attempt = 0; attempt < DISCORD_MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(DISCORD_REQUEST_TIMEOUT_MS),
        redirect: 'error',
      });
    } catch {
      // Fetch errors can contain the secret URL; report a sanitized error only.
      throw new Error('Discord webhook request failed or timed out.');
    }
    if (response.ok) return true;

    if (attempt < DISCORD_MAX_ATTEMPTS - 1 && (response.status === 429 || response.status >= 500)) {
      let waitMs = DISCORD_RETRY_DELAY_MS * (attempt + 1);
      if (response.status === 429) {
        const body = await response.json().catch(() => ({}));
        const retryAfter = Number(body.retry_after);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          // Leave longer rate limits visible as failures instead of retrying too early.
          if (retryAfter > DISCORD_MAX_RETRY_AFTER_SECONDS) {
            throw new Error(`Discord webhook rate limited for over ${DISCORD_MAX_RETRY_AFTER_SECONDS} seconds. Rerun the workflow later.`);
          }
          waitMs = Math.ceil(retryAfter * MILLISECONDS_PER_SECOND);
        }
      }
      await sleep(waitMs);
      continue;
    }
    throw new Error(`Discord webhook returned HTTP ${response.status}.`);
  }
}

if (import.meta.main) {
  try {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const sent = await notifyDiscord(event, process.env.DISCORD_WEBHOOK_URL);
    console.log(sent ? 'Discord pull request notification sent.' : 'Event does not notify Discord.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
