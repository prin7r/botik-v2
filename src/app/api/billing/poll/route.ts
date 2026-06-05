// Background poller — runs every 30s on Vercel cron (or via a tiny worker).
// Detects incoming USDT payments across all users and marks them confirmed.
// Protected by a static secret header so the public can't trigger it.
import { NextResponse } from 'next/server';
import { eq, and, inArray, lt } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { payments } from '@/models/Schema';
import { getHotWalletAddress, pollIncomingUsdt } from '@/libs/Solana';
import { activateSubscription } from '@/libs/Agents';
import { PublicKey } from '@solana/web3.js';
import { logger } from '@/libs/Logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET ?? '';

export async function GET(req: Request) {
  if (CRON_SECRET) {
    if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 401 });
    }
  }
  const hot = getHotWalletAddress();
  if (!hot) return NextResponse.json({ ok: false, error: 'no hot wallet' }, { status: 503 });

  // Expire stale pending rows.
  const now = new Date();
  await db
    .update(payments)
    .set({ status: 'expired' })
    .where(and(eq(payments.status, 'pending'), lt(payments.expiresAt, now)));

  const pending = await db.select().from(payments).where(eq(payments.status, 'pending'));
  if (pending.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const memos = new Set(pending.map((p) => p.expectedMemo));
  const pubkey = new PublicKey(hot);
  const incoming = await pollIncomingUsdt(pubkey, Date.now() - 1000 * 60 * 60 * 24);
  let confirmed = 0;
  for (const i of incoming) {
    if (!memos.has(i.memo)) continue;
    const p = pending.find((x) => x.expectedMemo === i.memo);
    if (!p) continue;
    await db
      .update(payments)
      .set({
        status: 'confirmed',
        txSignature: i.signature,
        amountReceived: i.amountUsd,
        confirmedAt: new Date(),
      })
      .where(eq(payments.id, p.id));
    await activateSubscription(p.userId, 30);
    confirmed++;
    logger.info('PAYMENT_CONFIRMED_CRON', 'Cron confirmed payment', { userId: p.userId, sig: i.signature });
  }
  return NextResponse.json({ ok: true, processed: confirmed });
}
