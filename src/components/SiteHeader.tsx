import Link from 'next/link';

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink-950">
          <BotikLogo />
          <span>Botik</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link href="/pricing" className="btn-ghost">Pricing</Link>
          <Link href="/docs/openrouter" className="btn-ghost hidden sm:inline-flex">Docs</Link>
          {signedIn ? (
            <Link href="/app" className="btn-primary">Open app</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/signup" className="btn-primary">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function BotikLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="11" r="1.4" fill="currentColor" />
      <circle cx="15" cy="11" r="1.4" fill="currentColor" />
      <path d="M9 18l3 2 3-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
