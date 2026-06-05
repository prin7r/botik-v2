'use client';

import { useState, useTransition } from 'react';
import type { McpDef } from '@/libs/Skills';
import { CopyButton } from '@/components/CopyButton';

type Custom = { name: string; url: string; transport: 'sse' | 'http' };

export function McpManager({
  mcps,
  initialEnabled,
  initialCustom,
  searxngUrl,
  firecrawlUrl,
}: {
  mcps: McpDef[];
  initialEnabled: string[];
  initialCustom: Custom[];
  searxngUrl: string;
  firecrawlUrl: string;
}) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(initialEnabled));
  const [custom, setCustom] = useState<Custom[]>(initialCustom);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [transport, setTransport] = useState<'sse' | 'http'>('sse');

  function resolvedUrl(m: McpDef): string {
    return typeof m.defaultUrl === 'string' ? m.defaultUrl : m.defaultUrl.envKey === 'SEARXNG_URL' ? searxngUrl : m.defaultUrl.envKey === 'FIRECRAWL_URL' ? firecrawlUrl : m.defaultUrl.envKey;
  }

  function persist(nextEnabled: Set<string>, nextCustom: Custom[]) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabledMcps: [...nextEnabled], customMcps: nextCustom }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) setError(json.error ?? 'Could not save');
      else setInfo('Saved.');
    });
  }

  function toggle(id: string) {
    const next = new Set(enabled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEnabled(next);
    persist(next, custom);
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^https?:\/\//.test(url)) {
      setError('URL must start with http:// or https://');
      return;
    }
    if (custom.some((c) => c.name === name)) {
      setError('A custom MCP with that name already exists.');
      return;
    }
    if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(new URL(url).hostname)) {
      setError('Internal addresses are blocked (SSRF).');
      return;
    }
    const next = [...custom, { name, url, transport }];
    setCustom(next);
    setName('');
    setUrl('');
    setTransport('sse');
    persist(enabled, next);
  }

  function removeCustom(n: string) {
    const next = custom.filter((c) => c.name !== n);
    setCustom(next);
    persist(enabled, next);
  }

  return (
    <div className="mt-6 space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-950">Preinstalled</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mcps.map((m) => {
            const on = enabled.has(m.id);
            const url = resolvedUrl(m);
            return (
              <div key={m.id} className={`card flex items-start gap-3 ${on ? 'ring-1 ring-ink-900' : ''}`}>
                <input type="checkbox" className="mt-1" checked={on} onChange={() => toggle(m.id)} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-900">{m.name}</div>
                  <div className="text-sm text-ink-600">{m.description}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                    <code className="truncate">{url}</code>
                    <CopyButton value={url} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink-950">Add your own</h2>
        <form onSubmit={addCustom} className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_2fr_140px_auto] gap-2">
          <input className="input" placeholder="name (kebab-case)" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <select className="input" value={transport} onChange={(e) => setTransport(e.target.value as 'sse' | 'http')}>
            <option value="sse">SSE</option>
            <option value="http">HTTP</option>
          </select>
          <button className="btn-primary" type="submit" disabled={isPending}>Add</button>
        </form>
        <p className="mt-2 text-xs text-ink-500">SSRF blocklist: localhost, 127.x, 10.x, 192.168.x, 169.254.x.</p>
      </div>

      {custom.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-ink-950">Your MCPs</h2>
          <ul className="mt-3 divide-y divide-ink-200 rounded-md border border-ink-200">
            {custom.map((c) => (
              <li key={c.name} className="flex items-center gap-3 px-4 py-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-900">{c.name}</div>
                  <div className="text-xs text-ink-500 truncate"><code>{c.url}</code> · {c.transport}</div>
                </div>
                <button className="btn-ghost" onClick={() => removeCustom(c.name)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-ink-500">
        {isPending ? 'Saving…' : info ? info : error ? <span className="text-red-700">{error}</span> : 'Changes save automatically.'}
      </div>
    </div>
  );
}
