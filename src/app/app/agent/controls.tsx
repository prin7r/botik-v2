'use client';

import { useState, useTransition } from 'react';

export function AgentControls({
  ready,
  status,
  defaultModel,
}: {
  ready: boolean;
  status: string;
  defaultModel: string;
}) {
  const [model, setModel] = useState(defaultModel);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function call(path: string, body: unknown = {}) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) setError(json.error ?? 'Action failed');
      else setInfo('Done');
    });
  }

  function saveModel() {
    call('/api/agent/config', { defaultModel: model });
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button disabled={!ready || isPending} className="btn-primary" onClick={() => call('/api/agent/start')}>
          Start
        </button>
        <button disabled={!ready || isPending} className="btn" onClick={() => call('/api/agent/pause')}>
          Pause
        </button>
        <button disabled={!ready || isPending} className="btn" onClick={() => call('/api/agent/restart')}>
          Restart
        </button>
        <span className="ml-auto text-sm text-ink-500 self-center">Current state: <code>{status}</code></span>
      </div>

      <div className="rounded-md border border-ink-200 p-4">
        <div className="text-sm font-medium text-ink-900">Default model</div>
        <p className="text-xs text-ink-500">What the agent calls when you don’t specify a model. Free-tier options keep your OpenRouter bill at $0.</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input className="input font-mono" value={model} onChange={(e) => setModel(e.target.value)} />
          <button className="btn" onClick={saveModel} disabled={isPending || model === defaultModel}>Save</button>
        </div>
        <details className="mt-3">
          <summary className="text-xs text-ink-500 cursor-pointer">Suggested free models</summary>
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs font-mono text-ink-700">
            <li>nvidia/nemotron-3-ultra-550b-a55b:free</li>
            <li>qwen/qwen-2.5-coder-32b-instruct:free</li>
            <li>meta-llama/llama-3.3-70b-instruct:free</li>
            <li>google/gemini-2.0-flash-exp:free</li>
          </ul>
        </details>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      {info && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{info}</div>}
    </div>
  );
}
