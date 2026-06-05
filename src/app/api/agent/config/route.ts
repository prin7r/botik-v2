import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { restartAgent } from '@/libs/Runtime';

export const runtime = 'nodejs';

const Body = z.object({ defaultModel: z.string().min(3).max(200) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  await db
    .update(users)
    .set({ defaultModel: parsed.data.defaultModel })
    .where(eq(users.id, user.id));
  // Bounce the agent so the new model takes effect immediately.
  await restartAgent(user.id);
  return NextResponse.json({ ok: true });
}
