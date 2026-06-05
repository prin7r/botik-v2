import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Stepper, Step } from '@/components/Stepper';
import Link from 'next/link';
import { getCurrentUser } from '@/libs/Session';

export const metadata = { title: 'Connect Telegram' };

const steps: Step[] = [
  {
    title: 'Open @BotFather in Telegram',
    body: (
      <p>
        In Telegram, search for <strong>@BotFather</strong> and start a chat. Make sure the username has the
        official blue checkmark — there are imposters.
      </p>
    ),
    image: <FakeWindow title="@BotFather">A Telegram chat list with @BotFather highlighted.</FakeWindow>,
  },
  {
    title: 'Send /newbot',
    body: (
      <p>
        Type <code>/newbot</code> and hit send. BotFather will ask for a <strong>name</strong> (the
        display name) and a <strong>username</strong> (must end in <code>bot</code> and be unique).
      </p>
    ),
    image: <FakeWindow title="@BotFather">Chat showing /newbot, then prompts for “name” and “username”.</FakeWindow>,
  },
  {
    title: 'Copy the bot token',
    body: (
      <p>
        BotFather replies with an HTTP API token that looks like{' '}
        <code>123456789:AAH-...-long_string</code>. Tap the token to copy it. This is the secret
        that lets your agent read and reply to messages in your chat.
      </p>
    ),
    image: <FakeWindow title="@BotFather">A reply with the new bot token and a “Use this token to access the bot” note.</FakeWindow>,
  },
  {
    title: 'Optional: set a picture and description',
    body: (
      <p>
        In the same BotFather chat, send <code>/setuserpic</code> to upload a profile picture and{' '}
        <code>/setdescription</code> to set the “what can this bot do?” text users see before they hit Start.
      </p>
    ),
    image: <FakeWindow title="@BotFather">/setuserpic prompt and an avatar preview.</FakeWindow>,
  },
  {
    title: 'Start your bot, then paste the token in Botik',
    body: (
      <p>
        Open the new bot in Telegram and press <strong>Start</strong> (this registers your user as a
        subscriber). Then go to{' '}
        <Link className="underline" href="/app/connect/telegram">Connect → Telegram</Link> in the
        control panel and paste the token. We validate it with <code>getMe</code>, set the webhook,
        and you’re done.
      </p>
    ),
    image: <FakeWindow title="botik.prin7r.com/app/connect/telegram">A form with a single “Bot token” field.</FakeWindow>,
  },
];

export default async function TelegramDocs() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-900">← Home</Link>
        <h1 className="mt-3 text-3xl font-semibold text-ink-950">Connect Telegram</h1>
        <p className="mt-3 text-ink-600">
          You create the bot in Telegram, then paste its token in Botik. Your agent uses that bot
          to talk to you — you keep the bot forever, even if you cancel your subscription.
        </p>
        <Stepper steps={steps} className="mt-10" />
        <div className="mt-12 card">
          <div className="font-medium text-ink-950">Done?</div>
          <p className="mt-1 text-sm text-ink-600">
            Head back to the control panel and finish the rest of the setup.
          </p>
          <Link href="/app/connect/telegram" className="btn-primary mt-4 inline-block">Open the connect form</Link>
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
