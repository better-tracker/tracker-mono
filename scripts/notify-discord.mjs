import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

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
      title: truncate(`#${pr.number}: ${pr.title}`, 256),
      url: pr.html_url,
      description: truncate(`Pull request ${action} by ${event.sender.login}.`, 4096),
      color: merged ? 0x8250df : event.action === 'closed' ? 0xcf222e : 0x2da44e,
      fields: [
        { name: 'Repository', value: truncate(event.repository.full_name, 1024) },
        { name: 'Author', value: truncate(pr.user.login, 1024), inline: true },
        { name: 'Branches', value: truncate(`${pr.head.ref} → ${pr.base.ref}`, 1024), inline: true },
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

  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
        redirect: 'error',
      });
    } catch {
      // Fetch errors can contain the secret URL; report a sanitized error only.
      throw new Error('Discord webhook request failed or timed out.');
    }
    if (response.ok) return true;

    if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
      let waitMs = 1000 * (attempt + 1);
      if (response.status === 429) {
        const body = await response.json().catch(() => ({}));
        const retryAfter = Number(body.retry_after);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          // Leave longer rate limits visible as failures instead of retrying too early.
          if (retryAfter > 60) throw new Error('Discord webhook rate limited for over 60 seconds. Rerun the workflow later.');
          waitMs = Math.ceil(retryAfter * 1000);
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
