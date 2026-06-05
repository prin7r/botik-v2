import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
  bigint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    // Trial
    trialStartedAt: timestamp('trial_started_at', { mode: 'date' }),
    trialEndsAt: timestamp('trial_ends_at', { mode: 'date' }),
    // Subscription
    subscriptionStatus: varchar('subscription_status', { length: 32 })
      .notNull()
      .default('trial')
      .$type<'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'>(),
    subscriptionRenewsAt: timestamp('subscription_renews_at', { mode: 'date' }),
    // Encrypted at rest via Vault (AES-256-GCM). Stored as base64 ciphertext.
    openrouterApiKeyEnc: text('openrouter_api_key_enc'),
    openrouterKeyLabel: varchar('openrouter_key_label', { length: 64 }),
    openrouterKeyValid: boolean('openrouter_key_valid').notNull().default(false),
    telegramBotTokenEnc: text('telegram_bot_token_enc'),
    telegramBotUsername: varchar('telegram_bot_username', { length: 64 }),
    telegramWebhookSet: boolean('telegram_webhook_set').notNull().default(false),
    // Selected model
    defaultModel: varchar('default_model', { length: 128 })
      .notNull()
      .default('nvidia/nemotron-3-ultra-550b-a55b:free'),
    // Misc
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
);

// ─────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(), // random 32-byte hex
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 64 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

// ─────────────────────────────────────────────────────────────────
// AGENTS
// ─────────────────────────────────────────────────────────────────
export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  // Provisioning
  status: varchar('status', { length: 32 })
    .notNull()
    .default('pending')
    .$type<'pending' | 'provisioning' | 'running' | 'paused' | 'down' | 'deleted'>(),
  health: varchar('health', { length: 16 })
    .notNull()
    .default('unknown')
    .$type<'unknown' | 'ok' | 'warn' | 'down'>(),
  // Runtime details
  port: integer('port'), // 18790 + offset
  pid: integer('pid'),
  image: varchar('image', { length: 128 }).notNull().default('botik/agent-runtime:latest'),
  // Skills/MCP JSON state (merged with defaults)
  enabledSkills: jsonb('enabled_skills')
    .$type<string[]>()
    .notNull()
    .default([]),
  enabledMcps: jsonb('enabled_mcps')
    .$type<string[]>()
    .notNull()
    .default([]),
  customMcps: jsonb('custom_mcps')
    .$type<Array<{ name: string; url: string; transport: 'sse' | 'http' }>>()
    .notNull()
    .default([]),
  // Last health check
  lastSeenAt: timestamp('last_seen_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────
export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // USDT on Solana
    expectedAmountUsd: integer('expected_amount_usd').notNull().default(1), // $1
    expectedMemo: varchar('expected_memo', { length: 64 }).notNull(),
    txSignature: varchar('tx_signature', { length: 128 }),
    amountReceived: bigint('amount_received', { mode: 'number' }), // lamports or token-units
    status: varchar('status', { length: 32 })
      .notNull()
      .default('pending')
      .$type<'pending' | 'confirmed' | 'failed' | 'expired'>(),
    network: varchar('network', { length: 32 }).notNull().default('solana-mainnet'),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('payments_tx_sig_idx').on(t.txSignature),
    index('payments_user_idx').on(t.userId),
    index('payments_status_idx').on(t.status),
  ],
);

// ─────────────────────────────────────────────────────────────────
// AGENT LOGS (last 1000 lines per agent for fast in-DB log viewer)
// ─────────────────────────────────────────────────────────────────
export const agentLogs = pgTable(
  'agent_logs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    level: varchar('level', { length: 16 }).notNull().default('info'),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('agent_logs_user_idx').on(t.userId, t.createdAt)],
);

// ─────────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  agent: one(agents),
  payments: many(payments),
  sessions: many(sessions),
  logs: many(agentLogs),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
  user: one(users, { fields: [agents.userId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type Session = typeof sessions.$inferSelect;
