import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Stepper, Step } from '@/components/Stepper';
import Link from 'next/link';
import { getCurrentUser } from '@/libs/Session';

export const metadata = { title: 'Connect OpenRouter' };

const steps: Step[] = [
  {
    title: 'Open OpenRouter',
    body: (
      <p>
        Go to <a className="underline" href="https://openrouter.ai" target="_blank" rel="noreferrer">openrouter.ai</a>{' '}
        and create an account. You can sign up with Google, GitHub, or email.
      </p>
    ),
    image: <FakeWindow title="openrouter.ai">A sign-up form with Google / GitHub / Email buttons.</FakeWindow>,
  },
  {
    title: 'Open the Keys page',
    body: (
      <p>
        After signing in, click your avatar in the top-right, then choose{' '}
        <strong>Keys</strong> from the menu.
      </p>
    ),
    image: <FakeWindow title="openrouter.ai/keys">A menu with “Keys” highlighted in the account dropdown.</FakeWindow>,
  },
  {
    title: 'Create a new key',
    body: (
      <p>
        Click <strong>Create Key</strong>. Give it a memorable name (e.g. <code>botik</code>) and an optional
        monthly credit limit. Botik does not need a high limit — the default model is free.
      </p>
    ),
    image: <FakeWindow title="Create key">Modal with “Name” field and a “Create” button.</FakeWindow>,
  },
  {
    title: 'Copy the key',
    body: (
      <p>
        OpenRouter shows the key <strong>only once</strong>. Click the copy icon, then return to Botik
        and paste it in the control panel.
      </p>
    ),
    image: <FakeWindow title="••••• shown once">A success screen with a copy button next to sk-or-v1-…</FakeWindow>,
  },
  {
    title: 'Paste the key in Botik',
    body: (
      <p>
        In your Botik control panel, open <Link className="underline" href="/app/connect/openrouter">Connect → OpenRouter</Link>{' '}
        and paste the key. We validate it with OpenRouter and store it encrypted (AES-256-GCM).
      </p>
    ),
    image: <FakeWindow title="botik.prin7r.com/app/connect/openrouter">A form with a single “OpenRouter API key” field.</FakeWindow>,
  },
];

export default async function OpenRouterDocs() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-900">← Home</Link>
        <h1 className="mt-3 text-3xl font-semibold text-ink-950">Connect OpenRouter</h1>
        <p className="mt-3 text-ink-600">
          OpenRouter is what runs the language model. Botik never sees your key in plaintext — it’s
          encrypted before it touches our database, and only your agent reads it. The default model
          is the free <strong>NVIDIA Nemotron 3 Ultra 550B</strong> tier, so you can run a personal agent
          for the cost of the $1/mo subscription alone.
        </p>
        <Stepper steps={steps} className="mt-10" />
        <div className="mt-12 card">
          <div className="font-medium text-ink-950">Done?</div>
          <p className="mt-1 text-sm text-ink-600">
            Head back to the control panel and finish the rest of the setup.
          </p>
          <Link href="/app/connect/openrouter" className="btn-primary mt-4 inline-block">Open the connect form</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function FakeWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50 shadow-sm overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-ink-200 bg-white px-3 py-1.5 text-[11px] text-ink-500">
        <span className="size-2 rounded-full bg-ink-300" />
        <span className="size-2 rounded-full bg-ink-300" />
        <span className="size-2 rounded-full bg-ink-300" />
        <span className="ml-2 font-mono">{title}</span>
      </div>
      <div className="px-4 py-6 text-sm text-ink-600">{children}</div>
    </div>
  );
}
