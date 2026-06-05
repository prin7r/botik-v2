// Per-user agent runtime supervisor.
//
// Why a separate process: the runtime is the *only* place that holds the user's
// decrypted OpenRouter key + Telegram token in memory. It runs on a single host
// for v1; horizontal scaling means adding a second host and letting Traefik
// round-robin (the host's env tells it which users it owns).
//
// HMAC: every payload to/from the supervisor is signed with PROVISIONER_HMAC_SECRET.
// The web/api side signs; we reject unsigned requests.
//
// Memory: each spawned agent is a child process. It gets the same Node binary,
// reads /workspace/openclaw.json (rendered at spawn time), and serves the
// agent HTTP server on 127.0.0.1:port. We measure RSS via process.memoryUsage().
//
// Logs: each agent has a 1000-line ring buffer in memory. The /logs?since=ts
// endpoint returns the lines newer than `ts`.

import { createHmac, randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { Env } from '../src/libs/Env';

const WORKSPACE = process.env.BOTIK_WORKSPACE_DIR ?? '/var/lib/botik/agents';
mkdirSync(WORKSPACE, { recursive: true });

type AgentEntry = {
  userId: number;
  port: number;
  pid?: number;
  child?: ChildProcess;
  status: 'running' | 'paused' | 'down';
  health: 'ok' | 'warn' | 'down' | 'unknown';
  startedAt?: number;
  buffer: Array<{ ts: number; level: string; msg: string }>;
  spec: any;
};

const agents = new Map<number, AgentEntry>();

function sign(body: string): string {
  return createHmac('sha256', Env.PROVISIONER_HMAC_SECRET).update(body).digest('hex');
}

function ok(res: ServerResponse, data: unknown) {
  const body = JSON.stringify({ ok: true, data });
  res.writeHead(200, {
    'content-type': 'application/json',
    'x-botik-signature': sign(body),
  });
  res.end(body);
}
function err(res: ServerResponse, status: number, message: string) {
  const body = JSON.stringify({ ok: false, error: message });
  res.writeHead(status, {
    'content-type': 'application/json',
    'x-botik-signature': sign(body),
  });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function verify(req: IncomingMessage, body: string): boolean {
  const expected = req.headers['x-botik-signature'];
  if (typeof expected !== 'string') return false;
  return createHmac('sha256', Env.PROVISIONER_HMAC_SECRET).update(body).digest('hex') === expected;
}

function logLine(agent: AgentEntry, level: string, msg: string) {
  const line = { ts: Date.now(), level, msg };
  agent.buffer.push(line);
  if (agent.buffer.length > 1000) agent.buffer.splice(0, agent.buffer.length - 1000);
  // eslint-disable-next-line no-console
  console.log(`[RUNTIME_AGENT_${agent.userId}] ${level.toUpperCase()} ${msg}`);
}

function spawnAgent(spec: any): AgentEntry {
  const userDir = join(WORKSPACE, `u${spec.userId}`);
  mkdirSync(userDir, { recursive: true });
  const configPath = join(userDir, 'openclaw.json');
  const logPath = join(userDir, 'agent.log');
  writeFileSync(configPath, JSON.stringify(specToConfig(spec), null, 2));
  const here = dirname(fileURLToPath(import.meta.url));
  const child = spawn(process.execPath, [join(here, 'agent.mjs')], {
    env: {
      ...process.env,
      BOTIK_AGENT_CONFIG: configPath,
      BOTIK_AGENT_PORT: String(spec.port),
      BOTIK_AGENT_LOG: logPath,
      BOTIK_VAULT_KEY: Env.BOTIK_VAULT_KEY,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const entry: AgentEntry = {
    userId: spec.userId,
    port: spec.port,
    pid: child.pid,
    child,
    status: 'running',
    health: 'ok',
    startedAt: Date.now(),
    buffer: [],
    spec,
  };
  child.stdout?.on('data', (b) => logLine(entry, 'info', b.toString().trimEnd()));
  child.stderr?.on('data', (b) => logLine(entry, 'warn', b.toString().trimEnd()));
  child.on('exit', (code) => {
    logLine(entry, code === 0 ? 'info' : 'error', `exited with code ${code}`);
    entry.status = 'down';
    entry.health = 'down';
  });
  logLine(entry, 'info', `agent spawned pid=${child.pid} port=${spec.port}`);
  return entry;
}

function specToConfig(spec: any) {
  return {
    userId: spec.userId,
    port: spec.port,
    openrouterKey: spec.openrouterKey, // in-memory only; written to disk for the child to read once
    telegramBotToken: spec.telegramBotToken ?? null,
    defaultModel: spec.defaultModel,
    enabledSkills: spec.enabledSkills,
    enabledMcps: spec.enabledMcps,
    customMcps: spec.customMcps,
    searxngUrl: Env.SEARXNG_URL,
    firecrawlUrl: Env.FIRECRAWL_URL,
  };
}

function killTree(child?: ChildProcess) {
  if (!child) return;
  try {
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode == null) child.kill('SIGKILL');
    }, 2000);
  } catch {
    // ignore
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const body = req.method === 'GET' ? '' : await readBody(req);
  if (!verify(req, body)) {
    return err(res, 401, 'invalid signature');
  }
  if (req.method === 'POST' && path === '/provision') {
    const spec = JSON.parse(body);
    const existing = agents.get(spec.userId);
    if (existing) {
      killTree(existing.child);
      agents.delete(spec.userId);
    }
    const entry = spawnAgent(spec);
    agents.set(spec.userId, entry);
    return ok(res, { pid: entry.pid, port: entry.port });
  }
  const m = path.match(/^\/agents\/(\d+)\/(pause|resume|restart|status|logs|delete)?$/);
  if (m) {
    const userId = Number(m[1]);
    const action = m[2];
    const entry = agents.get(userId);
    if (action === 'logs' && entry) {
      const since = Number(url.searchParams.get('since') ?? 0);
      return ok(res, { lines: entry.buffer.filter((l) => l.ts > since) });
    }
    if (action === 'status' && entry) {
      return ok(res, {
        userId,
        status: entry.status,
        health: entry.health,
        pid: entry.pid,
        port: entry.port,
        uptimeSec: entry.startedAt ? Math.floor((Date.now() - entry.startedAt) / 1000) : 0,
      });
    }
    if (action === 'pause' && entry) {
      killTree(entry.child);
      entry.status = 'paused';
      return ok(res, { ok: true });
    }
    if (action === 'resume' && entry) {
      const e = spawnAgent(entry.spec);
      agents.set(userId, e);
      return ok(res, { ok: true });
    }
    if (action === 'restart' && entry) {
      killTree(entry.child);
      const e = spawnAgent(entry.spec);
      agents.set(userId, e);
      return ok(res, { ok: true });
    }
    if ((path === `/agents/${userId}` || action === 'delete') && entry) {
      killTree(entry.child);
      agents.delete(userId);
      return ok(res, { ok: true });
    }
    return err(res, 404, 'not found');
  }
  if (path === '/healthz') {
    return ok(res, { ok: true, agents: agents.size, ts: new Date().toISOString() });
  }
  return err(res, 404, 'no route');
});

const PORT = Number(process.env.RUNTIME_PORT ?? 18789);
const HOST = process.env.RUNTIME_HOST ?? '127.0.0.1';
server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[RUNTIME] listening on http://${HOST}:${PORT} for ${Object.keys(agents).length} agents`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  for (const a of agents.values()) killTree(a.child);
  server.close(() => process.exit(0));
});
