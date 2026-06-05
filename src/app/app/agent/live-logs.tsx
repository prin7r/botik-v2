'use client';

import { useEffect, useRef, useState } from 'react';

type LogLine = { ts: number; level: string; msg: string };

export function LiveLogs({ userId, ready }: { userId: number; ready: boolean }) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!ready) return;
    const url = `/api/agent/logs/stream?userId=${userId}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as LogLine;
        setLines((prev) => [...prev.slice(-199), data]);
      } catch {
        // ignore non-JSON
      }
    };
    return () => {
      es.close();
    };
  }, [userId, ready]);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span className={`size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-ink-300'}`} />
        {ready ? (connected ? 'Streaming' : 'Reconnecting…') : 'Start the agent to see logs'}
      </div>
      <pre className="mt-3 max-h-96 overflow-y-auto rounded-md border border-ink-200 bg-ink-950 px-3 py-2 text-xs leading-relaxed text-ink-100 font-mono">
        {lines.length === 0 ? (
          <span className="text-ink-500">No log lines yet.</span>
        ) : (
          lines.map((l, i) => (
            <div key={i}>
              <span className="text-ink-500">{new Date(l.ts).toISOString()}</span>{' '}
              <span
                className={
                  l.level === 'error'
                    ? 'text-red-400'
                    : l.level === 'warn'
                    ? 'text-amber-300'
                    : 'text-ink-300'
                }
              >
                {l.level.toUpperCase()}
              </span>{' '}
              {l.msg}
            </div>
          ))
        )}
      </pre>
    </div>
  );
}
