import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand-700">EagleEye</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            Lighthouse
          </span>
        </Link>
      </div>
    </header>
  );
}
