import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { payments } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { getHotWalletAddress } from '@/libs/Solana';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  const [pending] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, user.id), eq(payments.status, 'pending')))
    .limit(1);
  const hot = getHotWalletAddress();
  if (!pending) return NextResponse.json({ ok: true, pending: null });
  return NextResponse.json({
    ok: true,
    pending: {
      id: pending.id,
      address: hot,
      memo: pending.expectedMemo,
      amountUsd: pending.expectedAmountUsd,
      expiresAt: pending.expiresAt.toISOString(),
    },
  });
}
