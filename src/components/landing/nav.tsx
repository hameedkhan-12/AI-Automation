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
      className="fixed inset-x-0 top-0 z-40 text-white"
    >
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <Link href="#top" className="flex items-center gap-2.5">
          <span className="brand-logo-mark flex size-7 items-center justify-center rounded-lg shadow-sm">
            <WorkflowIcon className="size-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[22px] font-medium tracking-tight">FLUX</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 text-sm text-white/70 backdrop-blur-sm md:flex">
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

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              size="sm"
              asChild
              className="rounded-full bg-[var(--brand-surface-2)] text-white shadow-sm hover:bg-[var(--brand-surface-4)]"
            >
              <Link href="/workflows">
                Dashboard
                <ArrowRightIcon />
              </Link>
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-white/70 transition-colors hover:text-white sm:inline-block"
              >
                Sign in
              </Link>
              <Button
                size="sm"
                asChild
                className="rounded-full bg-[var(--brand-surface-2)] px-5 text-white shadow-sm hover:bg-[var(--brand-surface-4)]"
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