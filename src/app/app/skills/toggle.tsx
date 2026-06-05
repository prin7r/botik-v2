'use client';

import { useState, useTransition } from 'react';
import type { SkillDef } from '@/libs/Skills';

export function SkillsToggle({ skills, initialEnabled }: { skills: SkillDef[]; initialEnabled: string[] }) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(initialEnabled));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setError(null);
    setSavedAt(null);
    const next = new Set(enabled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEnabled(next);
    startTransition(async () => {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabledSkills: [...next] }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) setError(json.error ?? 'Could not save');
      else setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {skills.map((s) => {
          const on = enabled.has(s.id);
          return (
            <label key={s.id} className={`card flex items-start gap-3 cursor-pointer ${on ? 'ring-1 ring-ink-900' : ''}`}>
              <input type="checkbox" className="mt-1" checked={on} onChange={() => toggle(s.id)} />
              <div className="flex-1">
                <div className="font-medium text-ink-900">{s.name}</div>
                <div className="text-sm text-ink-600">{s.description}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-ink-400">{s.category}</div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-ink-500">
        {isPending ? 'Saving…' : savedAt ? `Saved at ${savedAt}` : 'Changes save automatically.'}
        {error && <span className="ml-3 text-red-700">{error}</span>}
      </div>
    </div>
  );
}
