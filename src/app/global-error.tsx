'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-ink-950">Something went wrong</h1>
          <p className="mt-2 text-ink-600">{error.message ?? 'An unexpected error occurred.'}</p>
          <button onClick={reset} className="btn-primary mt-6">Try again</button>
        </div>
      </body>
    </html>
  );
}
