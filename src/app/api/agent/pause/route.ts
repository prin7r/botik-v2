import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { agents } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { pauseAgent } from '@/libs/Runtime';

export const runtime = 'nodejs';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  const res = await pauseAgent(user.id);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  await db.update(agents).set({ status: 'paused' }).where(eq(agents.userId, user.id));
  return NextResponse.json({ ok: true });
}
