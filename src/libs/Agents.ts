// Helpers for trial / subscription timing.
import { Env } from '@/libs/Env';
import { db } from '@/libs/DB';
import { users, type User } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export type AgentAccessState = {
  canProvision: boolean;
  reason: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'no_payment';
  trialEndsAt: Date | null;
  renewsAt: Date | null;
  daysLeft: number | null;
};

export function evaluateAccess(user: User): AgentAccessState {
  const now = new Date();
  if (user.subscriptionStatus === 'active' && user.subscriptionRenewsAt) {
    return {
      canProvision: now < user.subscriptionRenewsAt,
      reason: 'active',
      trialEndsAt: null,
      renewsAt: user.subscriptionRenewsAt,
      daysLeft: daysBetween(now, user.subscriptionRenewsAt),
    };
  }
  if (user.trialEndsAt) {
    return {
      canProvision: now < user.trialEndsAt,
      reason: 'trial',
      trialEndsAt: user.trialEndsAt,
      renewsAt: null,
      daysLeft: daysBetween(now, user.trialEndsAt),
    };
  }
  return {
    canProvision: false,
    reason: 'no_payment',
    trialEndsAt: null,
    renewsAt: null,
    daysLeft: null,
  };
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Grant a 7-day trial to a freshly signed-up user. */
export async function grantTrial(userId: number) {
  const now = new Date();
  const ends = new Date(now.getTime() + Env.BOTIK_TRIAL_DAYS * 86_400_000);
  await db
    .update(users)
    .set({
      trialStartedAt: now,
      trialEndsAt: ends,
      subscriptionStatus: 'trial',
    })
    .where(eq(users.id, userId));
}

/** Mark a payment as confirmed and extend subscription. */
export async function activateSubscription(userId: number, days = 30) {
  const now = new Date();
  const renews = new Date(now.getTime() + days * 86_400_000);
  await db
    .update(users)
    .set({
      subscriptionStatus: 'active',
      subscriptionRenewsAt: renews,
      trialEndsAt: null,
    })
    .where(eq(users.id, userId));
}
