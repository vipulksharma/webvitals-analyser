import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-tiket-border bg-tiket-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-tiket-blue to-tiket-blue-dark shadow-tiket-glow"
            aria-hidden="true"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-tiket-text">
              EagleEye
            </span>
            <span className="ml-2 hidden text-xs font-medium text-tiket-muted sm:inline">
              Web Vitals
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-tiket-green/30 bg-tiket-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-tiket-green sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tiket-green" aria-hidden="true" />
            Live
          </span>
          <div
            className="hidden h-8 w-px bg-tiket-border sm:block"
            aria-hidden="true"
          />
          <span className="hidden text-xs font-medium text-tiket-muted sm:inline">
            Powered by Lighthouse
          </span>
        </div>
      </div>
      <div
        className="h-0.5 w-full bg-gradient-to-r from-tiket-blue via-tiket-blue-dark to-tiket-orange opacity-80"
        aria-hidden="true"
      />
    </header>
  );
}
