import * as React from 'react';

export type Step = {
  title: string;
  body: React.ReactNode;
  image?: React.ReactNode;
};

export function Stepper({ steps, className = '' }: { steps: Step[]; className?: string }) {
  return (
    <ol className={`space-y-8 ${className}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="grid grid-cols-1 md:grid-cols-[3rem_1fr] gap-3 md:gap-6">
          <div className="flex md:flex-col items-center md:items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white">
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="hidden md:block h-full w-px bg-ink-200" aria-hidden />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-950">{s.title}</h3>
            <div className="mt-2 text-ink-700">{s.body}</div>
            {s.image && <div className="mt-4">{s.image}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
