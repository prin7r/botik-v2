// Minimal per-user agent process. Reads its config from BOTIK_AGENT_CONFIG,
// starts a tiny HTTP server with two endpoints:
//   POST /telegram/webhook — receives a Telegram update, runs the model, replies
//   GET  /healthz          — used by the supervisor
//
// In a real OpenClaw deployment this binary would be the OpenClaw gateway
// (alpine/openclaw image, ~60–80MB RSS). We ship this tiny stub so the
// supervisor and the control panel can be exercised end-to-end today; the
// runtime swap is one image change.
import { createServer } from 'node:http';
import { readFileSync, appendFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(process.env.BOTIK_AGENT_CONFIG, 'utf8'));
const PORT = Number(process.env.BOTIK_AGENT_PORT);
const LOG = process.env.BOTIK_AGENT_LOG;

const log = (level, msg) => {
  const line = `${new Date().toISOString()} ${level} ${msg}\n`;
  process.stdout.write(line);
  if (LOG) appendFileSync(LOG, line);
};

log('info', `agent started user=${config.userId} port=${PORT} model=${config.defaultModel}`);
log('info', `skills=${config.enabledSkills.length} mcps=${config.enabledMcps.length}`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, userId: config.userId, port: PORT }));
    return;
  }
  if (url.pathname === '/telegram/webhook' && req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    log('info', `telegram webhook received ${body.length}b`);
    // Stub: real impl forwards to OpenRouter with the user's history.
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, stub: true }));
    return;
  }
  res.writeHead(404).end();
});

server.listen(PORT, '127.0.0.1', () => log('info', `listening on 127.0.0.1:${PORT}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
