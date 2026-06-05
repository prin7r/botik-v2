# Botik — Personal AI agents for $1/month

> A self-service platform where anyone can sign up, pay $1 USDT, and walk
> away with a personal AI agent connected to their Telegram. OpenRouter-powered,
> ~80MB-RSS per agent, no orchestration framework.

## Highlights

- **$1 USDT/month** on Solana (sub-cent fees).
- **OpenRouter-powered** — uses your own API key, default model is `nvidia/nemotron-3-ultra-550b-a55b:free`.
- **Telegram-native** — your agent lives in a Telegram bot you control.
- **20 preinstalled skills + 6 MCP servers**, all toggleable.
- **Built on the Next.js Boilerplate** by ixartz: Drizzle ORM, Postgres, type-safe.

## Stack

| Layer       | Tech                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| Web         | Next.js 15 App Router, TypeScript, Tailwind v3, React 19                              |
| API         | Next.js route handlers (`/api/...`), Node runtime                                       |
| Database    | Postgres 16 + Drizzle ORM                                                               |
| Auth        | Argon2id passwords + opaque session cookies + DB-backed sessions                       |
| Vault       | AES-256-GCM at rest (12-byte IV, 16-byte tag)                                          |
| Payments    | Solana mainnet, USDT-SPL, single hot wallet, memo-tagged payments                      |
| Runtime     | Node/TypeScript-based supervisor (per-user child processes), HMAC-signed RPC            |
| Agent image | OpenClaw gateway on Alpine + Node 22, ~60–90MB RSS, 0.25 vCPU cap (see `agent-runtime/`) |
| Traefik     | Wildcard `*.prin7r.com` from server 144, auto-LE cert                                  |

## Layout

```
botik-v2/
├─ apps/web/                 This app (Next.js 15) — see src/app/, src/libs/
├─ runtime/                  The agent supervisor (HMAC-signed child-process manager)
├─ agent-runtime/            Production Docker image (alpine + OpenClaw)
├─ docs/                     setup.md, scaling.md, operations.md
├─ docker-compose.yml        web + runtime on server 144, Traefik labels
├─ drizzle.config.ts
└─ .env / .env.example
```

## Quickstart (local)

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL, SESSION_SECRET, BOTIK_VAULT_KEY
docker run --name botik-pg -e POSTGRES_PASSWORD=botik -e POSTGRES_USER=botik \
  -e POSTGRES_DB=botik -p 5432:5432 -d postgres:16
npm run db:push
npm run dev             # web on :4321
npm run runtime:dev     # runtime supervisor on :18789
```

Open `http://localhost:4321`.

## Production (server 144)

```bash
docker compose -f docker-compose.yml up -d --build
docker compose logs -f web
```

See `docs/setup.md`, `docs/scaling.md`, `docs/operations.md`.
