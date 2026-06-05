import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import Link from 'next/link';
import { getCurrentUser } from '@/libs/Session';
import { SignupForm } from './form';

export const metadata = { title: 'Sign up' };

export default async function SignupPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold text-ink-950">Create your account</h1>
        <p className="mt-2 text-sm text-ink-600">
          7-day free trial, no card required. We’ll start your agent as soon as you connect OpenRouter and Telegram.
        </p>
        <SignupForm />
        <p className="mt-6 text-sm text-ink-600">
          Already have an account? <Link href="/login" className="underline">Log in</Link>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
