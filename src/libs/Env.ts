import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    DATABASE_URL: z.string().url().or(z.string().startsWith('postgres://')),
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be 32+ chars'),
    BOTIK_VAULT_KEY: z.string().min(32),
    SOLANA_RPC_URL: z.string().url().default('https://api.mainnet-beta.solana.com'),
    SOLANA_USDT_MINT: z
      .string()
      .default('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    BOTIK_SOLANA_HOT_WALLET: z.string().optional().default(''),
    BOTIK_PAYMENT_MEMO_PREFIX: z.string().default('botik-'),
    PROVISIONER_HMAC_SECRET: z.string().min(16).optional().default('dev-hmac-secret-aaaaaaaaaaaaa'),
    AGENT_RUNTIME_URL: z.string().url().default('http://127.0.0.1:18790'),
    SEARXNG_URL: z.string().url().default('http://75.119.135.49:8888'),
    FIRECRAWL_URL: z.string().url().default('http://75.119.135.49:3002'),
    BOTIK_TRIAL_DAYS: z.coerce.number().int().min(0).max(60).default(7),
    BOTIK_DEFAULT_MODEL: z
      .string()
      .default('nvidia/nemotron-3-ultra-550b-a55b:free'),
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:4321'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    BOTIK_VAULT_KEY: process.env.BOTIK_VAULT_KEY,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    SOLANA_USDT_MINT: process.env.SOLANA_USDT_MINT,
    BOTIK_SOLANA_HOT_WALLET: process.env.BOTIK_SOLANA_HOT_WALLET,
    BOTIK_PAYMENT_MEMO_PREFIX: process.env.BOTIK_PAYMENT_MEMO_PREFIX,
    PROVISIONER_HMAC_SECRET: process.env.PROVISIONER_HMAC_SECRET,
    AGENT_RUNTIME_URL: process.env.AGENT_RUNTIME_URL,
    SEARXNG_URL: process.env.SEARXNG_URL,
    FIRECRAWL_URL: process.env.FIRECRAWL_URL,
    BOTIK_TRIAL_DAYS: process.env.BOTIK_TRIAL_DAYS,
    BOTIK_DEFAULT_MODEL: process.env.BOTIK_DEFAULT_MODEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  // Empty values are fine in dev — we set defaults for prod-required keys.
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
});
