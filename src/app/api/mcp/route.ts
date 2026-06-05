import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { agents } from '@/models/Schema';
import { getCurrentUser } from '@/libs/Session';
import { restartAgent } from '@/libs/Runtime';
import { MCPS } from '@/libs/Skills';

export const runtime = 'nodejs';

const Custom = z.object({
  name: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/),
  url: z.string().url().refine((u) => {
    try {
      const h = new URL(u).hostname;
      return !/^(127\.|10\.|192\.168\.|169\.254\.|::1$|localhost$)/.test(h);
    } catch {
      return false;
    }
  }, 'SSRF: internal addresses are blocked'),
  transport: z.enum(['sse', 'http']),
});

const Body = z.object({
  enabledMcps: z.array(z.string()).max(20),
  customMcps: z.array(Custom).max(10),
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
  const validIds = new Set(MCPS.map((m) => m.id));
  for (const id of parsed.data.enabledMcps) {
    if (!validIds.has(id)) return NextResponse.json({ ok: false, error: `Unknown MCP: ${id}` }, { status: 400 });
  }
  await db
    .update(agents)
    .set({
      enabledMcps: parsed.data.enabledMcps,
      customMcps: parsed.data.customMcps,
    })
    .where(eq(agents.userId, user.id));
  await restartAgent(user.id);
  return NextResponse.json({ ok: true });
}
