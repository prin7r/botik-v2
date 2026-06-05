// Server-Sent Events log stream. Polls the runtime tail endpoint and forwards
// lines to the client. The runtime is expected to keep the last ~1000 lines in
// memory; we don’t fetch from the agent container directly.
import { db } from '@/libs/DB';
import { agentLogs } from '@/models/Schema';
import { tailAgentLogs } from '@/libs/Runtime';
import { getCurrentUser } from '@/libs/Session';
import { desc, eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response('Not authenticated', { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastTs = 0;
      // Seed with the last 50 lines from the DB so the panel is never blank.
      const recent = await db
        .select()
        .from(agentLogs)
        .where(eq(agentLogs.userId, user.id))
        .orderBy(desc(agentLogs.createdAt))
        .limit(50);
      for (const r of recent.reverse()) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ ts: r.createdAt.getTime(), level: r.level, msg: r.message })}\n\n`,
          ),
        );
        lastTs = Math.max(lastTs, r.createdAt.getTime());
      }

      const tick = async () => {
        if (req.signal.aborted) return;
        try {
          const res = await tailAgentLogs(user.id, lastTs);
          if (res.ok) {
            for (const line of res.data.lines) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ ts: line.ts, level: line.level, msg: line.msg })}\n\n`,
                ),
              );
              lastTs = Math.max(lastTs, line.ts);
            }
          }
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ ts: Date.now(), level: 'error', msg: 'stream error: ' + String(err) })}\n\n`),
          );
        }
      };

      const interval = setInterval(tick, 3_000);
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
