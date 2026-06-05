import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users, agents } from '@/models/Schema';
import { SignupSchema } from '@/libs/Validations';
import { createSession, hashPassword } from '@/libs/Session';
import { grantTrial } from '@/libs/Agents';
import { DEFAULT_ENABLED_SKILLS, DEFAULT_ENABLED_MCPS } from '@/libs/Skills';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    return NextResponse.json({ ok: false, error: 'An account with that email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id });
  if (!created) {
    return NextResponse.json({ ok: false, error: 'Failed to create user' }, { status: 500 });
  }

  await grantTrial(created.id);

  // Pre-create an empty agent row that the provisioner will fill in.
  await db
    .insert(agents)
    .values({
      userId: created.id,
      status: 'pending',
      health: 'unknown',
      enabledSkills: DEFAULT_ENABLED_SKILLS,
      enabledMcps: DEFAULT_ENABLED_MCPS,
    })
    .onConflictDoNothing();

  await createSession(created.id);
  return NextResponse.json({ ok: true, userId: created.id });
}
