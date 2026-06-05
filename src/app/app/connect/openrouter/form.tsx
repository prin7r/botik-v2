'use client';

import { useState, useTransition } from 'react';

export function ConnectOpenRouterForm({
  initialKeyLabel,
  initialConnected,
}: {
  initialKeyLabel: string | null;
  initialConnected: boolean;
}) {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ label?: string; usage?: number; limit?: number | null; freeTier?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch('/api/keys/openrouter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        info?: { label?: string; usage?: number; limit?: number | null; freeTier?: boolean };
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not validate the key.');
        return;
      }
      setInfo(json.info ?? null);
      setKey('');
    });
  }

  function onDisconnect() {
    startTransition(async () => {
      const res = await fetch('/api/keys/openrouter', { method: 'DELETE' });
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
          Connected{initialKeyLabel ? ` as “${initialKeyLabel}”` : ''}.
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
        <label className="label" htmlFor="key">OpenRouter API key</label>
        <input
          id="key"
          type="password"
          required
          autoComplete="off"
          className="input font-mono"
          placeholder="sk-or-v1-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <p className="mt-1 text-xs text-ink-500">Starts with <code>sk-or-v1-</code>. We only ever see the encrypted form.</p>
      </div>

      {info && (
        <div className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-800">
          <div><span className="text-ink-500">Label:</span> {info.label ?? '(none)'}</div>
          {typeof info.limit === 'number' && <div><span className="text-ink-500">Limit:</span> ${info.limit}</div>}
          {info.freeTier && <div><span className="text-ink-500">Tier:</span> Free (good — default model is free)</div>}
        </div>
      )}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      <button type="submit" className="btn-primary" disabled={isPending || !key}>
        {isPending ? 'Validating…' : 'Save and validate'}
      </button>
    </form>
  );
}
