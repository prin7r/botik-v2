import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { OpenRouterKeySchema } from '@/libs/Validations';
import { validateOpenRouterKey } from '@/libs/OpenRouter';
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
  const parsed = OpenRouterKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid key' },
      { status: 400 },
    );
  }
  const { key } = parsed.data;

  const info = await validateOpenRouterKey(key);
  if (!info.valid) {
    logger.warn('OPENROUTER_KEY_INVALID', 'Key validation failed', { userId: user.id, reason: info.error });
    return NextResponse.json({ ok: false, error: info.error ?? 'Key is not valid.' }, { status: 400 });
  }

  const enc = encrypt(key);
  await db
    .update(users)
    .set({
      openrouterApiKeyEnc: enc,
      openrouterKeyLabel: info.label ?? null,
      openrouterKeyValid: true,
    })
    .where(eq(users.id, user.id));

  logger.info('OPENROUTER_KEY_CONNECTED', 'User connected OpenRouter', { userId: user.id, label: info.label });
  return NextResponse.json({ ok: true, info });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  await db
    .update(users)
    .set({ openrouterApiKeyEnc: null, openrouterKeyLabel: null, openrouterKeyValid: false })
    .where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
