'use client';

import { useEffect, useState, useTransition } from 'react';
import { CopyButton } from '@/components/CopyButton';

type Props = {
  status: string;
  trialEndsAt: string | null;
  renewsAt: string | null;
  hotWallet: string | null;
  amountUsd: number;
  memoPrefix: string;
  rpcUrl: string;
};

export function PaymentPanel({ status, trialEndsAt, renewsAt, hotWallet, amountUsd, memoPrefix, rpcUrl }: Props) {
  const [pending, setPending] = useState<{
    id: number;
    address: string;
    memo: string;
    amountUsd: number;
    expiresAt: string;
  } | null>(null);
  const [status_msg, setStatusMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const res = await fetch('/api/billing/status');
    const json = (await res.json()) as { ok: boolean; pending?: typeof pending };
    if (json.ok) setPending(json.pending ?? null);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startPayment() {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await fetch('/api/billing/address', { method: 'POST' });
      const json = (await res.json()) as { ok: boolean; error?: string; pending?: typeof pending };
      if (!res.ok || !json.ok) {
        setStatusMsg(json.error ?? 'Could not create payment.');
        return;
      }
      setPending(json.pending ?? null);
    });
  }

  function checkNow() {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await fetch('/api/billing/check', { method: 'POST' });
      const json = (await res.json()) as { ok: boolean; error?: string; confirmed?: boolean };
      if (!res.ok || !json.ok) {
        setStatusMsg(json.error ?? 'Could not check payment.');
        return;
      }
      setStatusMsg(json.confirmed ? 'Payment confirmed — agent unlocked.' : 'No matching payment detected yet.');
      refresh();
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-md border border-ink-200 bg-ink-50 p-4 text-sm">
        <div className="font-medium text-ink-900">
          {status === 'active'
            ? `Active. Renews ${renewsAt ? new Date(renewsAt).toLocaleDateString() : 'soon'}.`
            : status === 'trial' && trialEndsAt
            ? `Trial ends ${new Date(trialEndsAt).toLocaleDateString()}.`
            : status === 'past_due'
            ? 'Past due — your agent is paused.'
            : status === 'expired' || status === 'cancelled'
            ? 'Subscription ended.'
            : 'No active subscription.'}
        </div>
      </div>

      {!hotWallet ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Platform hot wallet is not configured. Set <code>BOTIK_SOLANA_HOT_WALLET</code> in <code>.env</code> and restart.
        </div>
      ) : pending ? (
        <div className="rounded-md border border-ink-200 bg-white p-4 space-y-3">
          <div className="text-sm text-ink-700">
            Send exactly <strong>${pending.amountUsd} USDT (SPL)</strong> to:
          </div>
          <div className="flex items-center gap-2">
            <code className="block w-full break-all rounded bg-ink-50 px-2 py-1 text-xs">{pending.address}</code>
            <CopyButton value={pending.address} />
          </div>
          <div className="text-sm text-ink-700">
            With memo: <code className="rounded bg-ink-50 px-1">{pending.memo}</code>
            <span className="ml-2 inline-block align-middle"><CopyButton value={pending.memo} /></span>
          </div>
          <div className="text-xs text-ink-500">
            This payment request expires {new Date(pending.expiresAt).toLocaleTimeString()}. After that, click
            <em> Start a new payment</em>.
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={checkNow} disabled={isPending}>Check now</button>
            <a className="btn-ghost" href={`https://solscan.io/?cluster=mainnet`} target="_blank" rel="noreferrer">Open Solscan ↗</a>
          </div>
        </div>
      ) : (
        <button className="btn-primary" onClick={startPayment} disabled={isPending}>
          {isPending ? 'Creating…' : `Generate $${amountUsd} payment request`}
        </button>
      )}

      {status_msg && (
        <div className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-700">{status_msg}</div>
      )}

      <p className="text-xs text-ink-500">
        Network: <code>{rpcUrl.replace(/^https?:\/\//, '')}</code>. Memo prefix: <code>{memoPrefix}</code>.
      </p>
    </div>
  );
}
