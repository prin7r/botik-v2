import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { TelegramTokenSchema } from '@/libs/Validations';
import { getMe, setWebhook, deleteWebhook } from '@/libs/Telegram';
import { encrypt } from '@/libs/Vault';
import { getCurrentUser } from '@/libs/Session';
import { logger } from '@/libs/Logger';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = TelegramTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid token' },
      { status: 400 },
    );
  }
  const { token } = parsed.data;

  const me = await getMe(token);
  if (!me.valid) {
    logger.warn('TELEGRAM_TOKEN_INVALID', 'getMe failed', { userId: user.id, reason: me.error });
    return NextResponse.json({ ok: false, error: me.error ?? 'Token is not valid.' }, { status: 400 });
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4321'}/api/telegram/${user.id}`;
  const wh = await setWebhook(token, webhookUrl);
  if (!wh.ok) {
    return NextResponse.json({ ok: false, error: `Webhook failed: ${wh.error}` }, { status: 502 });
  }

  const enc = encrypt(token);
  await db
    .update(users)
    .set({
      telegramBotTokenEnc: enc,
      telegramBotUsername: me.botUsername ?? null,
      telegramWebhookSet: true,
    })
    .where(eq(users.id, user.id));

  logger.info('TELEGRAM_CONNECTED', 'User connected Telegram', { userId: user.id, bot: me.botUsername });
  return NextResponse.json({ ok: true, info: { botUsername: me.botUsername, botName: me.botName } });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

  // Best-effort: delete the webhook so Telegram stops sending updates.
  if (user.telegramBotTokenEnc) {
    try {
      const { decrypt } = await import('@/libs/Vault');
      const token = decrypt(user.telegramBotTokenEnc);
      await deleteWebhook(token);
    } catch (err) {
      logger.warn('TELEGRAM_DISCONNECT', 'Could not delete webhook', { err: String(err) });
    }
  }
  await db
    .update(users)
    .set({ telegramBotTokenEnc: null, telegramBotUsername: null, telegramWebhookSet: false })
    .where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
