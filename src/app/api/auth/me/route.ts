import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/libs/Session';
import { evaluateAccess } from '@/libs/Agents';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, user: null }, { status: 200 });
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      defaultModel: user.defaultModel,
      openrouterConnected: Boolean(user.openrouterApiKeyEnc) && user.openrouterKeyValid,
      telegramConnected: Boolean(user.telegramBotTokenEnc),
      access: evaluateAccess(user),
    },
  });
}
