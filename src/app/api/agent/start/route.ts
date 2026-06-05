// Provision + start the user’s agent. Idempotent.
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { agents, users } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { decrypt } from '@/libs/Vault';
import { provisionAgent } from '@/libs/Runtime';
import { evaluateAccess } from '@/libs/Agents';
import { logger } from '@/libs/Logger';

export const runtime = 'nodejs';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  const access = evaluateAccess(user);
  if (!access.canProvision) {
    return NextResponse.json({ ok: false, error: 'No active subscription or trial.' }, { status: 403 });
  }
  if (!user.openrouterApiKeyEnc || !user.openrouterKeyValid) {
    return NextResponse.json({ ok: false, error: 'Connect OpenRouter first.' }, { status: 400 });
  }
  if (!user.telegramBotTokenEnc) {
    return NextResponse.json({ ok: false, error: 'Connect Telegram first.' }, { status: 400 });
  }

  const [agent] = await db.select().from(agents).where(eq(agents.userId, user.id)).limit(1);
  if (!agent) {
    return NextResponse.json({ ok: false, error: 'No agent row found.' }, { status: 500 });
  }

  const port = 18790 + user.id; // 18790..20789 — fits 2,000 users comfortably
  const openrouterKey = decrypt(user.openrouterApiKeyEnc);
  const telegramToken = decrypt(user.telegramBotTokenEnc);

  const res = await provisionAgent({
    userId: user.id,
    port,
    openrouterKey,
    telegramBotToken: telegramToken,
    defaultModel: user.defaultModel,
    enabledSkills: agent.enabledSkills,
    enabledMcps: agent.enabledMcps,
    customMcps: agent.customMcps,
  });
  if (!res.ok) {
    logger.error('AGENT_PROVISION_FAILED', res.error, { userId: user.id });
    return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  }

  await db
    .update(agents)
    .set({
      status: 'running',
      health: 'ok',
      port,
      pid: res.data.pid,
      lastSeenAt: new Date(),
    })
    .where(eq(agents.userId, user.id));

  // Update default model if changed
  if (user.defaultModel) {
    // no-op, kept for symmetry
  }
  // (users table untouched on provision)
  await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
