// Telegram webhook receiver. Forwards the update to the user’s running agent
// container over loopback HTTP. Falls back to a 200 (Telegram retries if we
// 4xx, which we don’t want for unknown updates).
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users, agents } from '@/models/Schema';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId: userIdStr } = await params;
  const userId = Number(userIdStr);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ ok: false, error: 'bad userId' }, { status: 400 });
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [agent] = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
  if (!user || !agent) {
    logger.warn('TELEGRAM_WEBHOOK_NO_USER', 'No user/agent for this webhook', { userId });
    return NextResponse.json({ ok: true }); // 200 so Telegram doesn’t retry
  }
  if (agent.status !== 'running' || !agent.port) {
    logger.warn('TELEGRAM_WEBHOOK_AGENT_DOWN', 'Agent not running', { userId, status: agent.status });
    return NextResponse.json({ ok: true });
  }

  const body = await req.text();
  try {
    await fetch(`http://127.0.0.1:${agent.port}/telegram/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-botik-secret': Env.PROVISIONER_HMAC_SECRET },
      body,
      signal: AbortSignal.timeout(8_000),
    });
  } catch (err) {
    logger.error('TELEGRAM_FORWARD_FAILED', String(err), { userId });
  }
  return NextResponse.json({ ok: true });
}
