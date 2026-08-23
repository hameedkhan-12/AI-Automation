import { GithubIcon, TwitterIcon, WorkflowIcon } from "lucide-react";
import Link from "next/link";
import { GITHUB_URL } from "./constants";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Solutions", href: "#solutions" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: GITHUB_URL, external: true },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Documentation", href: GITHUB_URL, external: true },
      { label: "GitHub Issues", href: `${GITHUB_URL}/issues`, external: true },
      { label: "Security", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="#top" className="flex items-center gap-2">
              <span className="brand-logo-mark flex size-7 items-center justify-center rounded-lg">
                <WorkflowIcon className="size-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                flux
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              flux is a next-generation workflow orchestration platform to
              automate your work and save valuable time and expense.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[var(--brand-violet-500)]/50 hover:text-foreground"
              >
                <GithubIcon className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[var(--brand-violet-500)]/50 hover:text-foreground"
              >
                <TwitterIcon className="size-4" />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} flux. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
