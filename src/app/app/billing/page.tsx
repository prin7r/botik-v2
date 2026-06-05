import { requireUser } from '@/libs/Session';
import { evaluateAccess } from '@/libs/Agents';
import { db } from '@/libs/DB';
import { payments } from '@/models/Schema';
import { desc, eq } from 'drizzle-orm';
import { getHotWalletAddress } from '@/libs/Solana';
import { Env } from '@/libs/Env';
import { PaymentPanel } from './panel';

export const metadata = { title: 'Billing' };
export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const user = await requireUser();
  const access = evaluateAccess(user);
  const recent = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt))
    .limit(5);

  const hot = getHotWalletAddress();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      <div className="card">
        <h1 className="text-2xl font-semibold text-ink-950">Billing</h1>
        <p className="mt-1 text-ink-600">
          $1 USDT on Solana. The same address is reused on every renewal.
        </p>

        <PaymentPanel
          status={user.subscriptionStatus}
          trialEndsAt={user.trialEndsAt?.toISOString() ?? null}
          renewsAt={user.subscriptionRenewsAt?.toISOString() ?? null}
          hotWallet={hot}
          amountUsd={1}
          memoPrefix={Env.BOTIK_PAYMENT_MEMO_PREFIX}
          rpcUrl={Env.SOLANA_RPC_URL}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-ink-950">Recent payments</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">No payments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-200">
            {recent.map((p) => (
              <li key={p.id} className="py-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-ink-500">{p.network}</div>
                  <div>{p.expectedMemo}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono">${p.expectedAmountUsd}</div>
                  <div className={`text-xs ${p.status === 'confirmed' ? 'text-emerald-700' : p.status === 'failed' || p.status === 'expired' ? 'text-red-700' : 'text-amber-700'}`}>
                    {p.status}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-ink-500">
          Payments are detected within 60 seconds of confirmation. If you don’t see yours after 5 minutes,
          open a ticket with the transaction signature.
        </p>
      </div>
    </div>
  );
}
