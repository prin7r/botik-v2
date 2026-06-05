import Link from 'next/link';
import { requireUser } from '@/libs/Session';
import { evaluateAccess } from '@/libs/Agents';
import { db } from '@/libs/DB';
import { agents } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

export default async function AppHome() {
  const user = await requireUser();
  const access = evaluateAccess(user);
  const [agent] = await db.select().from(agents).where(eq(agents.userId, user.id)).limit(1);
  const checklist = [
    { id: 'openrouter', label: 'Connect OpenRouter', done: Boolean(user.openrouterApiKeyEnc) && user.openrouterKeyValid, href: '/app/connect/openrouter' },
    { id: 'telegram', label: 'Connect Telegram', done: Boolean(user.telegramBotTokenEnc) && user.telegramWebhookSet, href: '/app/connect/telegram' },
    { id: 'pay', label: 'Pay $1 USDT (after trial)', done: user.subscriptionStatus === 'active', href: '/app/billing' },
  ];
  const allDone = checklist.every((c) => c.done);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-6">
        <div className="card">
          <h1 className="text-2xl font-semibold text-ink-950">Welcome, {user.email.split('@')[0]}.</h1>
          <p className="mt-1 text-ink-600">
            {allDone
              ? 'Your agent is configured. Head over to the Agent tab to see live status and logs.'
              : 'Finish the three steps below to bring your agent online.'}
          </p>
          <ol className="mt-6 space-y-3">
            {checklist.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${c.done ? 'bg-emerald-100 text-emerald-900' : 'bg-ink-100 text-ink-700'}`}>
                  {c.done ? '✓' : i + 1}
                </span>
                <span className="flex-1 text-sm text-ink-900">{c.label}</span>
                <Link href={c.href} className="btn">{c.done ? 'Manage' : 'Connect'}</Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-ink-950">Agent status</h2>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat label="State" value={agent?.status ?? 'pending'} />
            <Stat label="Health" value={agent?.health ?? 'unknown'} />
            <Stat label="Port" value={agent?.port ? String(agent.port) : '—'} />
            <Stat label="Skills" value={String(agent?.enabledSkills.length ?? 0)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/agent" className="btn">Open agent</Link>
            <Link href="/app/skills" className="btn">Manage skills</Link>
            <Link href="/app/mcp" className="btn">Manage MCPs</Link>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-ink-950">Subscription</h3>
          <p className="mt-1 text-sm text-ink-600">
            {access.reason === 'trial' && access.trialEndsAt
              ? `Trial ends ${access.trialEndsAt.toLocaleDateString()}.`
              : access.reason === 'active' && access.renewsAt
              ? `Renews on ${access.renewsAt.toLocaleDateString()}.`
              : 'No active subscription.'}
          </p>
          <Link href="/app/billing" className="btn-primary mt-4 w-full">
            {access.reason === 'active' ? 'Manage billing' : 'Pay $1 USDT'}
          </Link>
        </div>

        <div className="card">
          <h3 className="font-semibold text-ink-950">Need help?</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-700">
            <li>· <Link className="underline" href="/docs/openrouter">OpenRouter setup</Link></li>
            <li>· <Link className="underline" href="/docs/telegram">Telegram setup</Link></li>
            <li>· <Link className="underline" href="/pricing">Pricing</Link></li>
          </ul>
        </div>
      </aside>
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
