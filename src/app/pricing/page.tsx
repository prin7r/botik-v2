import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import Link from 'next/link';
import { getCurrentUser } from '@/libs/Session';

export const metadata = { title: 'Pricing' };

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold text-ink-950">Pricing</h1>
        <p className="mt-3 text-ink-600">One plan, one price, one agent. No surprises.</p>

        <div className="mt-8 card">
          <div className="flex items-baseline gap-2">
            <div className="text-5xl font-semibold text-ink-950">$1</div>
            <div className="text-ink-500">/month</div>
          </div>
          <div className="mt-1 text-sm text-ink-600">USDT on Solana mainnet</div>
          <hr className="my-4 border-ink-200" />
          <ul className="text-sm text-ink-700 space-y-1.5">
            <li>· 1 personal agent container (~80MB RSS)</li>
            <li>· 1 Telegram bot with webhook</li>
            <li>· 20 preinstalled skills</li>
            <li>· 6 preinstalled MCP servers (SearXNG, Firecrawl, …)</li>
            <li>· Daily backups of your agent workspace</li>
            <li>· Live status + tailing logs in the control panel</li>
            <li>· Cancel any time — data kept 7 days after expiry</li>
          </ul>
          <Link href="/signup" className="btn-primary mt-6 w-full">Start the 7-day trial</Link>
        </div>

        <h2 className="mt-12 text-xl font-semibold text-ink-950">How payment works</h2>
        <ol className="mt-4 space-y-2 text-sm text-ink-700 list-decimal pl-5">
          <li>Open the control panel and click <strong>Billing</strong>.</li>
          <li>Copy the USDT payment address and memo shown.</li>
          <li>Send exactly $1 USDT (SPL) from any Solana wallet (Phantom, Solflare, Coinbase, …).</li>
          <li>Botik detects the transfer within 60 seconds and unlocks the agent.</li>
          <li>On the renewal date, the same memo/address is reused.</li>
        </ol>

        <h2 className="mt-12 text-xl font-semibold text-ink-950">FAQ</h2>
        <div className="mt-4 space-y-3 text-sm text-ink-700">
          <p><strong>Why USDT?</strong> Because $1 in fiat is broken for monthly subscriptions — Stripe/PayPal take 30c+ in fees. Stablecoins on Solana cost $0.0005.</p>
          <p><strong>What if my payment is late?</strong> On the renewal date, the agent pauses. You have a 7-day grace window to pay before data is deleted.</p>
          <p><strong>Do you store my card?</strong> No. We don’t touch cards. You send USDT directly to our hot wallet.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
