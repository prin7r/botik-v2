export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 py-10 mt-20">
      <div className="mx-auto max-w-6xl px-4 text-sm text-ink-500 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="font-semibold text-ink-900">Botik</div>
          <div>Personal AI agents, $1/month.</div>
        </div>
        <div className="flex gap-6">
          <a href="/docs/openrouter" className="hover:text-ink-900">OpenRouter guide</a>
          <a href="/docs/telegram" className="hover:text-ink-900">Telegram guide</a>
          <a href="/pricing" className="hover:text-ink-900">Pricing</a>
        </div>
      </div>
    </footer>
  );
}
