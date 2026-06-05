import { requireUser } from '@/libs/Session';
import { db } from '@/libs/DB';
import { agents } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { evaluateAccess } from '@/libs/Agents';
import { AgentControls } from './controls';
import { LiveLogs } from './live-logs';

export const metadata = { title: 'Agent' };
export const dynamic = 'force-dynamic';

export default async function AgentPage() {
  const user = await requireUser();
  const [agent] = await db.select().from(agents).where(eq(agents.userId, user.id)).limit(1);
  const access = evaluateAccess(user);
  const ready = Boolean(user.openrouterApiKeyEnc) && user.openrouterKeyValid && Boolean(user.telegramBotTokenEnc) && user.telegramWebhookSet && access.canProvision;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink-950">Agent</h1>
            <p className="mt-1 text-ink-600">
              {ready
                ? 'Your agent is wired up. Use the controls below to manage it.'
                : 'Finish the onboarding steps to provision your agent.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`pulse-dot ${agent?.health === 'ok' ? '' : 'opacity-30'}`} />
            <span className="text-sm text-ink-700">{agent?.health ?? 'unknown'}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Stat label="Status" value={agent?.status ?? 'pending'} />
          <Stat label="Health" value={agent?.health ?? 'unknown'} />
          <Stat label="Port" value={agent?.port ? String(agent.port) : '—'} />
          <Stat label="Last seen" value={agent?.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString() : 'never'} />
        </div>

        <AgentControls
          ready={ready}
          status={agent?.status ?? 'pending'}
          defaultModel={user.defaultModel}
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-950">Live logs</h2>
          <span className="text-xs text-ink-500">Last 200 lines, refreshed every 3s</span>
        </div>
        <LiveLogs userId={user.id} ready={ready} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-0.5 font-mono text-ink-900">{value}</div>
    </div>
  );
}
