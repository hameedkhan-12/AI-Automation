import { ArrowRightIcon, WorkflowIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
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
      className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="#top" className="flex items-center gap-2">
          <span className="brand-logo-mark flex size-7 items-center justify-center rounded-lg shadow-sm">
            <WorkflowIcon className="size-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            flux
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button size="sm" asChild>
              <Link href="/workflows">
                Dashboard
                <ArrowRightIcon />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-[var(--brand-violet-900)] text-white hover:bg-[var(--brand-violet-900)]/90 dark:bg-[var(--brand-violet-500)] dark:hover:bg-[var(--brand-violet-500)]/90"
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
