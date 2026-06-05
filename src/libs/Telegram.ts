// Validates a Telegram bot token via getMe and sets a webhook.
const API = 'https://api.telegram.org';

export type TelegramBotInfo = {
  valid: boolean;
  botId?: number;
  botUsername?: string;
  botName?: string;
  canJoinGroups?: boolean;
  readsMessages?: boolean;
  error?: string;
};

export async function getMe(token: string): Promise<TelegramBotInfo> {
  try {
    const res = await fetch(`${API}/bot${token}/getMe`, {
      signal: AbortSignal.timeout(5_000),
    });
    const json = (await res.json()) as {
      ok: boolean;
      result?: {
        id: number;
        username: string;
        first_name: string;
        can_join_groups?: boolean;
        reads_messages?: boolean;
      };
      description?: string;
    };
    if (!res.ok || !json.ok || !json.result) {
      return { valid: false, error: json.description ?? `Telegram returned ${res.status}` };
    }
    return {
      valid: true,
      botId: json.result.id,
      botUsername: json.result.username,
      botName: json.result.first_name,
      canJoinGroups: json.result.can_join_groups,
      readsMessages: json.result.reads_messages,
    };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

export async function setWebhook(
  token: string,
  url: string,
  secret?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, secret_token: secret, drop_pending_updates: true }),
      signal: AbortSignal.timeout(8_000),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    return { ok: json.ok, error: json.description };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

export async function deleteWebhook(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API}/bot${token}/deleteWebhook?drop_pending_updates=true`, {
      signal: AbortSignal.timeout(5_000),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    return { ok: json.ok, error: json.description };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
