import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getCurrentUser } from '@/libs/Session';

export const metadata = {
  title: 'Personal AI agents for $1/month — Botik',
  description:
    'A personal AI agent connected to your Telegram. OpenRouter-powered. Deploys in under 3 minutes.',
};

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main>
        <Hero />
        <Steps />
        <Features />
        <PricingTeaser />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-ink-200">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-600">
          <span className="pulse-dot" aria-hidden />
          <span>Now in public beta</span>
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink-950 sm:text-6xl">
          Your personal AI agent.
          <br className="hidden sm:block" />
          <span className="text-ink-500">$1/month, in your Telegram.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
          Botik deploys a private AI agent that lives in your Telegram chat. It runs on
          OpenRouter (use your own key), ships with 20 ready-to-use skills, and pays for
          itself in a single saved hour.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-5 py-2.5 text-base">
            Get a 7-day free trial
          </Link>
          <Link href="/pricing" className="btn px-5 py-2.5 text-base">
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink-500">
          No card required for the trial. Pay $1 USDT on Solana to keep it running.
        </p>
        <HeroDiagram />
      </div>
    </section>
  );
}

function HeroDiagram() {
  return (
    <div className="mx-auto mt-14 max-w-4xl rounded-xl border border-ink-200 bg-ink-50/50 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <Node title="You" sub="Telegram chat" icon="💬" />
        <Node title="Botik" sub="Personal agent" icon="🤖" highlight />
        <Node title="OpenRouter" sub="Your API key" icon="🔑" />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs text-ink-500">
        <div>↳ forwards messages via webhook</div>
        <div>↳ thinks, calls skills, replies</div>
        <div>↳ runs the chosen LLM</div>
      </div>
    </div>
  );
}

function Node({ title, sub, icon, highlight }: { title: string; sub: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border ${highlight ? 'border-ink-900 bg-white shadow' : 'border-ink-200 bg-white'} p-4`}>
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 font-semibold text-ink-900">{title}</div>
      <div className="text-sm text-ink-500">{sub}</div>
    </div>
  );
}

function Steps() {
  const steps = [
    { n: 1, t: 'Sign up', d: 'Email and a password. We start a 7-day free trial — no card needed.' },
    { n: 2, t: 'Connect OpenRouter', d: 'Paste your own OpenRouter key (BYOK). It’s encrypted at rest.' },
    { n: 3, t: 'Connect Telegram', d: 'Create a bot with @BotFather, paste the token. We set the webhook for you.' },
    { n: 4, t: 'Agent goes live', d: 'We provision a lightweight container, run a healthcheck, and message you in Telegram.' },
  ];
  return (
    <section className="border-b border-ink-200">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-ink-950 sm:text-3xl">How it works</h2>
        <p className="mt-2 max-w-2xl text-ink-600">From sign-up to a working agent in your Telegram, in under 3 minutes.</p>
        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <li key={s.n} className="card">
              <div className="text-sm text-ink-500">Step {s.n}</div>
              <div className="mt-1 font-semibold text-ink-950">{s.t}</div>
              <div className="mt-2 text-sm text-ink-600">{s.d}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { t: '20 preinstalled skills', d: 'Web search, code execution, file ops, email drafts, summarisation, and more.' },
    { t: '6 MCP servers ready', d: 'SearXNG and Firecrawl (our hosted instances) plus filesystem, git, fetch, and your Telegram bot.' },
    { t: 'Bring your own OpenRouter key', d: 'Use any model you like. Default is NVIDIA Animatron Ultra (Nemotron 3 Ultra 550B, free tier).' },
    { t: 'Extremely lightweight', d: 'Each agent runs in its own ~80MB-RSS container. We can host 2,000 of them on a single host.' },
    { t: 'Full control panel', d: 'Live status, tailing logs, restart, pause, edit config, and toggle skills and MCPs.' },
    { t: '$1/month in USDT', d: 'Pay on Solana. Fees are sub-cent. Subscription renews monthly — cancel anytime.' },
  ];
  return (
    <section className="border-b border-ink-200">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-ink-950 sm:text-3xl">Everything a personal agent needs.</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((i) => (
            <div key={i.t} className="card">
              <div className="font-semibold text-ink-950">{i.t}</div>
              <div className="mt-1 text-sm text-ink-600">{i.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="border-b border-ink-200 bg-ink-50/50">
      <div className="mx-auto max-w-6xl px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-semibold text-ink-950 sm:text-3xl">$1/month keeps the lights on.</h2>
          <p className="mt-3 text-ink-600 max-w-xl">
            We pass through the only meaningful cost — the model you choose — via your own OpenRouter key. Our
            $1 covers the container, the storage, the Telegram webhook, the Firecrawl calls, and the coffee.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink-700">
            <li>· 7-day free trial, no card required</li>
            <li>· Pay with USDT on Solana (sub-cent fees)</li>
            <li>· Cancel any time — your agent pauses and your data stays exportable</li>
          </ul>
        </div>
        <div className="card">
          <div className="text-sm text-ink-500">After trial</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-4xl font-semibold text-ink-950">$1</div>
            <div className="text-ink-500">/month</div>
          </div>
          <div className="mt-1 text-sm text-ink-600">USDT on Solana mainnet</div>
          <hr className="my-4 border-ink-200" />
          <div className="text-sm text-ink-700 space-y-1">
            <div>· 1 personal agent</div>
            <div>· 1 Telegram bot</div>
            <div>· 20 skills, 6 MCP servers</div>
            <div>· Daily backups of your workspace</div>
          </div>
          <Link href="/signup" className="btn-primary mt-6 w-full">Start the trial</Link>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    { q: 'Why is the trial free and the paid plan $1?', a: 'A 7-day trial lets you wire everything up risk-free. After that, $1/month is the smallest unit of recurring value we can charge — it covers the per-agent container, the public Telegram webhook, and the Firecrawl credits we use on your behalf.' },
    { q: 'Do I need my own OpenRouter key?', a: 'Yes. Your key is encrypted with AES-256-GCM at rest and only the agent you provisioned reads it. We don’t see your usage or your prompts.' },
    { q: 'Why USDT on Solana?', a: 'Transaction fees on Solana are typically $0.0005 — well under the $0.50 threshold you asked for. We may add more networks later.' },
    { q: 'What happens if I stop paying?', a: 'On the renewal date, your agent is paused. Your data is kept for 7 days. After that, it’s deleted.' },
    { q: 'Can I run more than one agent?', a: 'Not in v1. One personal agent per account keeps the platform simple and the price honest.' },
  ];
  return (
    <section className="border-b border-ink-200">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-ink-950 sm:text-3xl">Questions, answered.</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card group">
              <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-ink-950">
                {f.q}
                <span className="text-ink-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-3xl font-semibold text-ink-950">Spin up your agent in 3 minutes.</h2>
        <p className="mt-3 text-ink-600">No card. No contract. Bring your own OpenRouter key.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary px-5 py-2.5">Start the trial</Link>
          <Link href="/docs/openrouter" className="btn px-5 py-2.5">Read the docs</Link>
        </div>
      </div>
    </section>
  );
}
