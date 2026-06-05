import { NextResponse } from 'next/server';
import { destroyCurrentSession } from '@/libs/Session';

export const runtime = 'nodejs';

export async function POST() {
  await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}
