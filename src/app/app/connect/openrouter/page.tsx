import Link from 'next/link';
import { requireUser } from '@/libs/Session';
import { ConnectOpenRouterForm } from './form';

export const metadata = { title: 'Connect OpenRouter' };
export const dynamic = 'force-dynamic';

export default async function OpenRouterPage() {
  const user = await requireUser();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      <div className="card">
        <h1 className="text-2xl font-semibold text-ink-950">Connect OpenRouter</h1>
        <p className="mt-1 text-ink-600">
          Paste your OpenRouter key. We validate it, then encrypt it with AES-256-GCM before storage.
        </p>
        <ConnectOpenRouterForm
          initialKeyLabel={user.openrouterKeyLabel}
          initialConnected={Boolean(user.openrouterApiKeyEnc) && user.openrouterKeyValid}
        />
        <p className="mt-6 text-sm text-ink-600">
          Need help? <Link href="/docs/openrouter" className="underline">Read the step-by-step guide</Link>.
        </p>
      </div>
      <aside className="card">
        <h2 className="text-lg font-semibold text-ink-950">What we store</h2>
        <ul className="mt-2 space-y-1 text-sm text-ink-700">
          <li>· Your key, AES-256-GCM encrypted at rest.</li>
          <li>· The label you gave it (plaintext, so you recognise it).</li>
          <li>· A boolean that says whether we successfully validated it.</li>
        </ul>
        <h3 className="mt-6 font-semibold text-ink-950">Default model</h3>
        <p className="mt-1 text-sm text-ink-700">
          <code>{user.defaultModel}</code>
        </p>
        <p className="mt-1 text-xs text-ink-500">
          You can change this any time in the Agent tab.
        </p>
      </aside>
    </div>
  );
}
