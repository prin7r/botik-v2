'use client';

import { useState, useTransition } from 'react';

export function ConnectTelegramForm({
  initialBotUsername,
  initialConnected,
}: {
  initialBotUsername: string | null;
  initialConnected: boolean;
}) {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ botUsername?: string; botName?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch('/api/keys/telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        info?: { botUsername?: string; botName?: string };
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not validate the token.');
        return;
      }
      setInfo(json.info ?? null);
      setToken('');
    });
  }

  function onDisconnect() {
    startTransition(async () => {
      const res = await fetch('/api/keys/telegram', { method: 'DELETE' });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) {
        setInfo(null);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {initialConnected ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Connected as <strong>@{initialBotUsername}</strong>.
          <button type="button" onClick={onDisconnect} className="ml-3 underline">
            Disconnect
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-700">
          Not connected yet.
        </div>
      )}

      <div>
        <label className="label" htmlFor="token">Bot token</label>
        <input
          id="token"
          type="password"
          required
          autoComplete="off"
          className="input font-mono"
          placeholder="123456789:AAH-..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <p className="mt-1 text-xs text-ink-500">From @BotFather → /newbot → “Use this token to access the bot”.</p>
      </div>

      {info && (
        <div className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-800">
          ✓ Webhook set for <strong>@{info.botUsername}</strong> ({info.botName}).
        </div>
      )}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      <button type="submit" className="btn-primary" disabled={isPending || !token}>
        {isPending ? 'Validating…' : 'Save and validate'}
      </button>
    </form>
  );
}
