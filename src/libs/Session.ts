// Session-cookie based auth. Cookie holds an opaque session id; data lives in DB.
// Argon2id for password hashing (memory=64MB, time=3, parallelism=1).
import argon2 from 'argon2';
import { cookies, headers } from 'next/headers';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '@/libs/DB';
import { sessions, users } from '@/models/Schema';

export const SESSION_COOKIE = 'botik_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 64 * 1024, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export async function createSession(userId: number): Promise<string> {
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const h = await headers();
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt,
    userAgent: h.get('user-agent')?.slice(0, 256) ?? null,
    ip: (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '').slice(0, 64) || null,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return id;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.delete(sessions).where(eq(sessions.id, id));
    jar.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const rows = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0]?.user ?? null;
}

/** Strict variant — throws Next.js notFound() style redirect to /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // Lazy import to avoid edge issues
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }
  return user;
}
