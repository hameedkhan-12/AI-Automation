import { ArrowRightIcon, WorkflowIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "./constants";

const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#solutions", label: "Solutions" },
  { href: "#pricing", label: "Pricing" },
  { href: GITHUB_URL, label: "Resources", external: true },
];

export function Nav({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header
      id="top"
      className="brand-dark-band bg-background sticky top-0 z-30 border-b border-white/10 text-white"
    >
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <Link href="#top" className="flex items-center gap-2">
          <span className="brand-logo-mark flex size-7 items-center justify-center rounded-lg shadow-sm">
            <WorkflowIcon className="size-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[22px] font-medium tracking-tight">FLUX</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 text-sm text-white/70 md:flex">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          {isAuthenticated ? (
            <Button
              size="sm"
              asChild
              className="rounded-full bg-white text-[var(--brand-violet-900)] hover:bg-white/90"
            >
              <Link href="/workflows">
                Dashboard
                <ArrowRightIcon />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="rounded-full bg-white text-[var(--brand-violet-900)] hover:bg-white/90"
              >
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}