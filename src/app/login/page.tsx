import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import Link from 'next/link';
import { getCurrentUser } from '@/libs/Session';
import { LoginForm } from './form';

export const metadata = { title: 'Log in' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold text-ink-950">Welcome back</h1>
        <LoginForm />
        <p className="mt-6 text-sm text-ink-600">
          Don’t have an account? <Link href="/signup" className="underline">Start the trial</Link>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
