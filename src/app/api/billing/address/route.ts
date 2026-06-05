// Create a pending payment row. The user sends USDT to BOTIK_SOLANA_HOT_WALLET
// with the returned memo; the polling worker (api/billing/check or the cron)
// will detect the transfer and mark it confirmed.
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { payments } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { expectedMemo, getHotWalletAddress } from '@/libs/Solana';
import { logger } from '@/libs/Logger';

export const runtime = 'nodejs';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  const hot = getHotWalletAddress();
  if (!hot) {
    return NextResponse.json({ ok: false, error: 'Hot wallet not configured.' }, { status: 503 });
  }

  // Reuse an existing pending row if it's not expired.
  const existing = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, user.id), eq(payments.status, 'pending')))
    .limit(1);
  const now = new Date();
  const expMs = 1000 * 60 * 60; // 1h
  if (existing[0] && existing[0].expiresAt > now) {
    const p = existing[0];
    return NextResponse.json({
      ok: true,
      pending: {
        id: p.id,
        address: hot,
        memo: p.expectedMemo,
        amountUsd: p.expectedAmountUsd,
        expiresAt: p.expiresAt.toISOString(),
      },
    });
  }

  const expiresAt = new Date(now.getTime() + expMs);
  const memo = expectedMemo(user.id);
  const [created] = await db
    .insert(payments)
    .values({
      userId: user.id,
      expectedAmountUsd: 1,
      expectedMemo: memo,
      status: 'pending',
      expiresAt,
    })
    .returning();
  if (!created) return NextResponse.json({ ok: false, error: 'Could not create payment.' }, { status: 500 });
  logger.info('PAYMENT_CREATED', 'Pending payment created', { userId: user.id, memo, id: created.id });
  return NextResponse.json({
    ok: true,
    pending: {
      id: created.id,
      address: hot,
      memo: created.expectedMemo,
      amountUsd: created.expectedAmountUsd,
      expiresAt: created.expiresAt.toISOString(),
    },
  });
}
