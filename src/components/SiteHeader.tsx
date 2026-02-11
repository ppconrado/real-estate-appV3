import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          RealEstate
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-600">
          <Link href="/properties" className="hover:text-zinc-900">
            Properties
          </Link>
          <Link href="/about" className="hover:text-zinc-900">
            About
          </Link>
          <Link href="/contact" className="hover:text-zinc-900">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
