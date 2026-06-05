-- Initial schema for Botik. Generated from src/models/Schema.ts via drizzle-kit.
-- Apply with:  npm run db:push   (or  psql … < migrations/0001_init.sql)

CREATE TABLE IF NOT EXISTS users (
  id                        SERIAL PRIMARY KEY,
  email                     VARCHAR(255) NOT NULL UNIQUE,
  password_hash             TEXT         NOT NULL,
  trial_started_at          TIMESTAMP,
  trial_ends_at             TIMESTAMP,
  subscription_status       VARCHAR(32)  NOT NULL DEFAULT 'trial',
  subscription_renews_at    TIMESTAMP,
  openrouter_api_key_enc    TEXT,
  openrouter_key_label      VARCHAR(64),
  openrouter_key_valid      BOOLEAN      NOT NULL DEFAULT false,
  telegram_bot_token_enc    TEXT,
  telegram_bot_username     VARCHAR(64),
  telegram_webhook_set      BOOLEAN      NOT NULL DEFAULT false,
  default_model             VARCHAR(128) NOT NULL DEFAULT 'nvidia/nemotron-3-ultra-550b-a55b:free',
  created_at                TIMESTAMP    NOT NULL DEFAULT now(),
  updated_at                TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMP NOT NULL,
  user_agent  TEXT,
  ip          VARCHAR(64),
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS agents (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status             VARCHAR(32)  NOT NULL DEFAULT 'pending',
  health             VARCHAR(16)  NOT NULL DEFAULT 'unknown',
  port               INTEGER,
  pid                INTEGER,
  image              VARCHAR(128) NOT NULL DEFAULT 'botik/agent-runtime:latest',
  enabled_skills     JSONB        NOT NULL DEFAULT '[]',
  enabled_mcps       JSONB        NOT NULL DEFAULT '[]',
  custom_mcps        JSONB        NOT NULL DEFAULT '[]',
  last_seen_at       TIMESTAMP,
  created_at         TIMESTAMP    NOT NULL DEFAULT now(),
  updated_at         TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expected_amount_usd   INTEGER NOT NULL DEFAULT 1,
  expected_memo         VARCHAR(64) NOT NULL,
  tx_signature          VARCHAR(128),
  amount_received       BIGINT,
  status                VARCHAR(32)  NOT NULL DEFAULT 'pending',
  network               VARCHAR(32)  NOT NULL DEFAULT 'solana-mainnet',
  expires_at            TIMESTAMP    NOT NULL,
  confirmed_at          TIMESTAMP,
  created_at            TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS payments_tx_sig_idx ON payments (tx_signature);
CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);

CREATE TABLE IF NOT EXISTS agent_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level       VARCHAR(16) NOT NULL DEFAULT 'info',
  message     TEXT        NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_logs_user_idx ON agent_logs (user_id, created_at);
