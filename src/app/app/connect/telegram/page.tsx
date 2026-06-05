import Link from 'next/link';
import { requireUser } from '@/libs/Session';
import { ConnectTelegramForm } from './form';

export const metadata = { title: 'Connect Telegram' };
export const dynamic = 'force-dynamic';

export default async function TelegramPage() {
  const user = await requireUser();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      <div className="card">
        <h1 className="text-2xl font-semibold text-ink-950">Connect Telegram</h1>
        <p className="mt-1 text-ink-600">
          Paste the token you got from @BotFather. We validate it with <code>getMe</code> and set the webhook.
        </p>
        <ConnectTelegramForm
          initialBotUsername={user.telegramBotUsername}
          initialConnected={Boolean(user.telegramBotTokenEnc) && user.telegramWebhookSet}
        />
        <p className="mt-6 text-sm text-ink-600">
          Need help? <Link href="/docs/telegram" className="underline">Read the step-by-step guide</Link>.
        </p>
      </div>
      <aside className="card">
        <h2 className="text-lg font-semibold text-ink-950">How the webhook works</h2>
        <p className="mt-2 text-sm text-ink-700">
          When you message your bot, Telegram POSTs the message to{' '}
          <code>botik.prin7r.com/api/telegram/&lt;userId&gt;</code>. Your agent container receives it,
          runs the model with the system prompt, and replies. The same webhook is reused for every
          user — the URL is namespaced by your user id.
        </p>
        <h3 className="mt-6 font-semibold text-ink-950">We never see</h3>
        <ul className="mt-2 space-y-1 text-sm text-ink-700">
          <li>· Your Telegram password or 2FA</li>
          <li>· Other Telegram chats you have</li>
          <li>· The bot token in plaintext (AES-256-GCM)</li>
        </ul>
      </aside>
    </div>
  );
}
