// Manually triggered (or cron'd) payment check. Polls the hot wallet for
// incoming USDT transfers with a memo matching any pending payment.
import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { payments } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { getHotWalletAddress, pollIncomingUsdt } from '@/libs/Solana';
import { activateSubscription } from '@/libs/Agents';
import { logger } from '@/libs/Logger';

export const runtime = 'nodejs';
// Allow up to 60s polling
export const maxDuration = 60;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  const hot = getHotWalletAddress();
  if (!hot) return NextResponse.json({ ok: false, error: 'Hot wallet not configured.' }, { status: 503 });

  const pending = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, user.id), eq(payments.status, 'pending')));
  if (pending.length === 0) return NextResponse.json({ ok: true, confirmed: false });

  try {
    const pubkey = new PublicKey(hot);
    const incoming = await pollIncomingUsdt(pubkey, Date.now() - 1000 * 60 * 60 * 24);
    for (const p of pending) {
      const match = incoming.find((i) => i.memo === p.expectedMemo);
      if (!match) continue;
      await db
        .update(payments)
        .set({
          status: 'confirmed',
          txSignature: match.signature,
          amountReceived: match.amountUsd,
          confirmedAt: new Date(),
        })
        .where(eq(payments.id, p.id));
      await activateSubscription(user.id, 30);
      logger.info('PAYMENT_CONFIRMED', 'Payment confirmed', { userId: user.id, sig: match.signature, memo: match.memo });
      return NextResponse.json({ ok: true, confirmed: true });
    }
    return NextResponse.json({ ok: true, confirmed: false });
  } catch (err) {
    logger.error('PAYMENT_CHECK_FAILED', String(err), { userId: user.id });
    return NextResponse.json({ ok: false, error: 'Polling failed.' }, { status: 502 });
  }
}
