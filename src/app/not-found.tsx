import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md text-center">
        <h1 className="text-5xl font-semibold text-ink-950">404</h1>
        <p className="mt-2 text-ink-600">That page doesn’t exist (or has wandered off to find an API key).</p>
        <Link href="/" className="btn-primary mt-6 inline-block">Back to home</Link>
      </div>
    </main>
  );
}
