# Operations

## Backups

The agent workspace is a per-user folder at `/var/lib/botik/agents/u<id>/`.
Daily snapshots go to the same S3-compatible bucket that backs the rest of
the platform:

```bash
# /etc/cron.daily/botik-snapshot
tar -C /var/lib/botik -czf /tmp/agents-$(date +%F).tgz agents
aws s3 cp /tmp/agents-$(date +%F).tgz s3://prin7r-backups/botik/agents/
```

DB backups: `pg_dump` of the `botik` database, encrypted with the same
vault key, daily.

## Migrations

```bash
# 1. Edit src/models/Schema.ts
# 2. Generate the migration
npm run db:generate
# 3. Inspect the SQL in migrations/
# 4. Apply (CI does this in the deploy step)
npm run db:push
```

We use `drizzle-kit push` rather than migrate files for v1 — there are no
ad-hoc production migrations yet, and push is fine while schema and code
ship in the same release.

## Monitoring

- `/api/health` — LB target
- `/api/health/runtime` — runtime supervisor
- Postgres: `pg_stat_activity` query in `/etc/grafana/dashboards/botik.json`
- Logs: stdout from the web + runtime containers, scraped by Vector into
  Better Stack (or any log sink — change the vector config).

## Rotation

To rotate the vault key:

1. Generate a new key: `openssl rand -base64 32`.
2. Set `BOTIK_VAULT_KEY_NEW` in env and deploy.
3. Run a one-shot script (in `scripts/rotate-vault.ts`) that reads every
   `openrouterApiKeyEnc` / `telegramBotTokenEnc` with the old key, re-encrypts
   with the new one, writes back, and unsets the old env.
4. Remove the old key from env and redeploy.

## What to do when…

**The supervisor crashes mid-provision.** Restart it. The next reconcile
loop will compare Postgres (the source of truth) with the running container
set and respawn anything missing.

**A user can't connect their OpenRouter key.** It's almost always a
malformed key (we require `sk-or-…`). Tell them to copy the *whole* key
from openrouter.ai, not just the visible prefix.

**A Telegram webhook returns 5xx.** Check the runtime supervisor first
(`/api/health/runtime`). If the agent container is down, restart it from
the control panel (Agent → Restart) or via the supervisor: the next
reconcile will respawn it.

**A payment isn't being detected.** The memo is the only thing that ties
a transfer to a user. Ask the sender to copy the memo *exactly* — they
must include the prefix (`botik-`) and the user id (`u123-…`). If the
amount is right and the memo matches, the issue is likely RPC lag; click
*Check now* on the billing page.

**A user wants to cancel.** Set `users.subscriptionStatus = 'cancelled'`
in the DB (no UI in v1). The supervisor pauses the agent on the next
reconcile. The user's data is kept for 7 days, then a `purge` cron deletes
the workspace folder and the `users` row.
