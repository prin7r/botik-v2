# Setup

This guide gets a fresh `botik-v2` checkout running on your laptop, then on
the production host.

## 1. Local development

### Prerequisites

- Node.js 24+ (the boilerplate requires it; we use Next 15)
- Postgres 16 (Docker is easiest)
- A wallet with a small amount of SOL and a few USDT for testing (only on prod)

### Steps

```bash
git clone <repo> botik-v2
cd botik-v2
npm install

cp .env.example .env
# Generate secrets:
openssl rand -base64 32   # SESSION_SECRET
openssl rand -base64 32   # BOTIK_VAULT_KEY

# Start Postgres
docker run --name botik-pg -e POSTGRES_PASSWORD=botik -e POSTGRES_USER=botik -e POSTGRES_DB=botik -p 5432:5432 -d postgres:16

# Apply the schema
npm run db:push

# Run the two services in two terminals
npm run dev          # web on :4321
npm run runtime:dev  # runtime supervisor on :18789
```

Visit `http://localhost:4321`. You can sign up with any email — the 7-day
trial is granted automatically. To exercise the full flow you also need a
real OpenRouter key and a real Telegram bot token.

### Smoke test

```bash
# 1. Landing
curl -sI http://localhost:4321 | head -1    # HTTP/1.1 200

# 2. Signup
curl -s -X POST http://localhost:4321/api/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"correcthorsebatterystaple"}' \
  -c cookies.txt
# expect: {"ok":true,"userId":1}

# 3. Validate an OpenRouter key (the cookie carries the session)
curl -s -X POST http://localhost:4321/api/keys/openrouter \
  -H 'content-type: application/json' \
  -b cookies.txt -c cookies.txt \
  -d '{"key":"sk-or-v1-…"}'
# expect: {"ok":true,"info":{"label":"My Key", …}}
```

## 2. Production (server 144)

### Pre-flight

```bash
# 1. Make sure Postgres is reachable from server 144 (Dev 2):
psql "postgresql://botik:<pw>@75.119.135.49:5432/botik" -c '\dt'

# 2. Make sure the Solana hot wallet is generated and funded (with ~0.05 SOL for fees):
solana-keygen new -o /etc/botik/solana.key --no-bip39-passphrase
solana-keygen pubkey /etc/botik/solana.key
# Send a small amount of SOL to that address from your treasury wallet.

# 3. Make sure Traefik is routing *.prin7r.com with Let's Encrypt wildcard:
# (Already set up on server 144.)
```

### Deploy

```bash
ssh server144
git clone <repo> /opt/botik && cd /opt/botik
cp .env.example .env
# Fill in real secrets. Critical:
#   DATABASE_URL=postgresql://botik:<pw>@75.119.135.49:5432/botik
#   SESSION_SECRET=…
#   BOTIK_VAULT_KEY=…
#   BOTIK_SOLANA_HOT_WALLET=<pubkey>
#   NEXT_PUBLIC_APP_URL=https://botik.prin7r.com
#   AGENT_RUNTIME_URL=http://runtime:18789

# Apply the schema:
docker run --rm --network=host -e DATABASE_URL=… node:24 npx drizzle-kit push

# Build and start:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
docker compose logs -f web
```

### Verify

```bash
# Landing
curl -sI https://botik.prin7r.com | head -1   # HTTP/2 200

# Runtime health
curl -s https://botik.prin7r.com/api/health   # {"ok":true,…}

# Cron (Vercel Cron or your scheduler) — see docs/operations.md
```

## 3. Telegram webhook

When a user connects a Telegram bot, we set the webhook to
`https://botik.prin7r.com/api/telegram/<userId>`. This URL is the public
entrypoint — it receives every Telegram update and forwards it to the right
agent container on loopback.

The webhook URL is namespaced by user id, so all users share a single
Telegram path. The handler validates that the agent container is running
before forwarding, and returns 200 in all other cases so Telegram does not
retry.

## 4. Solana payment detection

Two paths detect a payment:

1. **User-driven**: the user clicks *Check now* on the Billing page. This
   calls `POST /api/billing/check`, which polls the hot wallet's USDT-ATA
   for the last 24h and matches any incoming transfer by memo.
2. **Cron**: Vercel Cron (or `crond`) calls `GET /api/billing/poll` every
   30s. Same logic, no user session required. Protected by `CRON_SECRET`.

When a payment is detected:

1. The `payments` row is marked `confirmed` with the tx signature.
2. `users.subscriptionStatus` becomes `active` and `subscriptionRenewsAt` is
   set to now + 30 days.
3. The agent is auto-provisioned (if it isn't already).
