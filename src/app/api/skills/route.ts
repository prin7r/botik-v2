import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { agents } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { restartAgent } from '@/libs/Runtime';
import { SKILLS } from '@/libs/Skills';

export const runtime = 'nodejs';

const Body = z.object({
  enabledSkills: z.array(z.string()).max(50),
});

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
  const validIds = new Set(SKILLS.map((s) => s.id));
  for (const id of parsed.data.enabledSkills) {
    if (!validIds.has(id)) {
      return NextResponse.json({ ok: false, error: `Unknown skill: ${id}` }, { status: 400 });
    }
  }
  await db
    .update(agents)
    .set({ enabledSkills: parsed.data.enabledSkills })
    .where(eq(agents.userId, user.id));
  // Bounce so the change takes effect.
  await restartAgent(user.id);
  return NextResponse.json({ ok: true });
}
