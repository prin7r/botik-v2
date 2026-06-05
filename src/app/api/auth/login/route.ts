import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { LoginSchema } from '@/libs/Validations';
import { createSession, verifyPassword } from '@/libs/Session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
  }
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true, userId: user.id });
}
