import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/libs/Session';
import { evaluateAccess } from '@/libs/Agents';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const access = evaluateAccess(user);

  return (
    <div className="min-h-screen bg-ink-50/30">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/app" className="font-semibold text-ink-950">Botik</Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm text-ink-600">
              <Link href="/app" className="rounded-md px-3 py-1.5 hover:bg-ink-100">Overview</Link>
              <Link href="/app/agent" className="rounded-md px-3 py-1.5 hover:bg-ink-100">Agent</Link>
              <Link href="/app/skills" className="rounded-md px-3 py-1.5 hover:bg-ink-100">Skills</Link>
              <Link href="/app/mcp" className="rounded-md px-3 py-1.5 hover:bg-ink-100">MCP</Link>
              <Link href="/app/billing" className="rounded-md px-3 py-1.5 hover:bg-ink-100">Billing</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-ink-500">{user.email}</span>
            <AccessBadge access={access} />
            <form action="/api/auth/logout" method="post">
              <button className="btn-ghost" type="submit">Log out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}

function AccessBadge({ access }: { access: ReturnType<typeof evaluateAccess> }) {
  const map: Record<string, { label: string; tone: string }> = {
    trial: { label: access.daysLeft != null ? `Trial · ${access.daysLeft}d left` : 'Trial', tone: 'bg-amber-100 text-amber-900' },
    active: { label: access.daysLeft != null ? `Active · ${access.daysLeft}d to renew` : 'Active', tone: 'bg-emerald-100 text-emerald-900' },
    past_due: { label: 'Past due', tone: 'bg-red-100 text-red-900' },
    cancelled: { label: 'Cancelled', tone: 'bg-ink-200 text-ink-800' },
    expired: { label: 'Expired', tone: 'bg-ink-200 text-ink-800' },
    no_payment: { label: 'No payment', tone: 'bg-ink-200 text-ink-800' },
  };
  const item = map[access.reason] ?? map.no_payment;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.tone}`}>{item.label}</span>;
}
