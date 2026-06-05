// Validates an OpenRouter API key and returns quota info.
const ENDPOINT = 'https://openrouter.ai/api/v1/auth/key';

export type OpenRouterKeyInfo = {
  valid: boolean;
  label?: string;
  limit?: number | null;
  usage?: number;
  freeTier?: boolean;
  error?: string;
};

export async function validateOpenRouterKey(key: string): Promise<OpenRouterKeyInfo> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      // 5s budget — fail fast on bad keys
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      return { valid: false, error: `OpenRouter returned ${res.status}` };
    }
    const json = (await res.json()) as {
      data?: {
        label?: string;
        limit?: number | null;
        usage?: number;
        is_free_tier?: boolean;
      };
    };
    const d = json.data ?? {};
    return {
      valid: true,
      label: d.label,
      limit: d.limit,
      usage: d.usage ?? 0,
      freeTier: d.is_free_tier ?? false,
    };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
