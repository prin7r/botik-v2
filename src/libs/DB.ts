import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/models/Schema';
import { Env } from '@/libs/Env';

declare global {
  // eslint-disable-next-line no-var
  var __botikPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __botikDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const pool =
  globalThis.__botikPool ??
  new Pool({
    connectionString: Env.DATABASE_URL,
    max: 10,
  });

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[DB_POOL_ERROR]', err);
});

const db = globalThis.__botikDb ?? drizzle(pool, { schema });

if (Env.NODE_ENV !== 'production') {
  globalThis.__botikPool = pool;
  globalThis.__botikDb = db;
}

export { db, pool };
export * as schema from '@/models/Schema';
