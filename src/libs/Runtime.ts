// Provisioner client — talks to the agent-runtime supervisor over HTTP.
// In v1 the runtime is colocated with the Next.js server (single host). Scaling
// beyond ~1k agents adds a second host; the supervisor is the only thing that
// moves.
//
// HMAC: every payload is signed with PROVISIONER_HMAC_SECRET; the supervisor
// rejects unsigned requests.

import { createHmac } from 'node:crypto';
import { Env } from '@/libs/Env';

function sign(body: string): string {
  return createHmac('sha256', Env.PROVISIONER_HMAC_SECRET).update(body).digest('hex');
}

type RuntimeResp<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, init: RequestInit): Promise<RuntimeResp<T>> {
  const url = `${Env.AGENT_RUNTIME_URL.replace(/\/$/, '')}${path}`;
  const body = typeof init.body === 'string' ? init.body : '';
  const sig = sign(body);
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-botik-signature': sig,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!res.ok) {
    return { ok: false, error: `runtime ${res.status}` };
  }
  try {
    return (await res.json()) as RuntimeResp<T>;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'invalid json' };
  }
}

export type ProvisionSpec = {
  userId: number;
  port: number;
  openrouterKey: string;
  telegramBotToken?: string | null;
  defaultModel: string;
  enabledSkills: string[];
  enabledMcps: string[];
  customMcps: Array<{ name: string; url: string; transport: 'sse' | 'http' }>;
};

export async function provisionAgent(spec: ProvisionSpec) {
  return call<{ pid: number; port: number }>('/provision', {
    method: 'POST',
    body: JSON.stringify(spec),
  });
}

export async function pauseAgent(userId: number) {
  return call<{ ok: true }>(`/agents/${userId}/pause`, { method: 'POST', body: '{}' });
}

export async function resumeAgent(userId: number) {
  return call<{ ok: true }>(`/agents/${userId}/resume`, { method: 'POST', body: '{}' });
}

export async function restartAgent(userId: number) {
  return call<{ ok: true }>(`/agents/${userId}/restart`, { method: 'POST', body: '{}' });
}

export async function destroyAgent(userId: number) {
  return call<{ ok: true }>(`/agents/${userId}`, { method: 'DELETE', body: '{}' });
}

export type AgentStatus = {
  userId: number;
  status: 'running' | 'paused' | 'down' | 'unknown';
  health: 'ok' | 'warn' | 'down' | 'unknown';
  pid?: number;
  port?: number;
  uptimeSec?: number;
  rssMb?: number;
  cpuPct?: number;
};

export async function getAgentStatus(userId: number) {
  return call<AgentStatus>(`/agents/${userId}/status`, { method: 'GET', body: '' });
}

export async function tailAgentLogs(userId: number, sinceMs = 0) {
  return call<{ lines: Array<{ ts: number; level: string; msg: string }> }>(
    `/agents/${userId}/logs?since=${sinceMs}`,
    { method: 'GET', body: '' },
  );
}
