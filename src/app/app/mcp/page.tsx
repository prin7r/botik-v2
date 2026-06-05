import { requireUser } from '@/libs/Session';
import { db } from '@/libs/DB';
import { agents } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { MCPS } from '@/libs/Skills';
import { McpManager } from './manager';
import { Env } from '@/libs/Env';

export const metadata = { title: 'MCP servers' };
export const dynamic = 'force-dynamic';

export default async function McpPage() {
  const user = await requireUser();
  const [agent] = await db.select().from(agents).where(eq(agents.userId, user.id)).limit(1);
  const enabled = new Set(agent?.enabledMcps ?? []);
  const custom = agent?.customMcps ?? [];
  return (
    <div className="card">
      <h1 className="text-2xl font-semibold text-ink-950">MCP servers</h1>
      <p className="mt-1 text-ink-600">
        6 preinstalled MCP servers. Toggle the ones you want enabled, or add your own below.
      </p>
      <McpManager
        mcps={MCPS}
        initialEnabled={[...enabled]}
        initialCustom={custom}
        searxngUrl={Env.SEARXNG_URL}
        firecrawlUrl={Env.FIRECRAWL_URL}
      />
    </div>
  );
}
