import { GithubIcon, TwitterIcon, WorkflowIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GITHUB_URL } from "./constants";

const QUICK_LINKS_COL1 = [
  { label: "Home", href: "#top" },
  { label: "Solutions", href: "#solutions" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

const QUICK_LINKS_COL2 = [
  { label: "Contact Us", href: GITHUB_URL, external: true },
  { label: "Terms & Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

const SOCIALS = [
  { label: "GitHub", href: GITHUB_URL, icon: GithubIcon },
  { label: "Discord", href: "#", icon: null, src: "/logos/discord.svg" },
  { label: "X (Twitter)", href: "https://x.com/hameedkhan_11", icon: TwitterIcon },
];

export function Footer() {
  return (
    <footer className="dark relative overflow-hidden bg-[var(--brand-ink)] text-white">
      {/* Top subtle border */}
      <div className="absolute inset-x-0 top-0 border-t border-white/10" />

      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-0 -z-10 size-[500px] rounded-full bg-[radial-gradient(circle,rgba(89,59,255,0.12)_0%,transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-0 -z-10 size-[500px] rounded-full bg-[radial-gradient(circle,rgba(252,95,42,0.08)_0%,transparent_70%)] blur-3xl"
      />

      {/* Main Grid Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-48 sm:pb-64 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">

          {/* Brand & Copyright Column */}
          <div className="flex flex-col justify-between sm:col-span-2 lg:col-span-4">
            <div>
              <Link
                href="#top"
                className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
              >
                <span className="brand-mesh flex size-8 items-center justify-center rounded-lg shadow-sm">
                  <WorkflowIcon
                    className="size-4 text-white"
                    strokeWidth={2.5}
                  />
                </span>
                <span className="text-2xl font-bold tracking-tight">FLUX</span>
              </Link>
            </div>

            <p className="mt-8 text-xs text-white/50 sm:mt-16">
              &copy; {new Date().getFullYear()} Design by <span className="font-semibold text-white/80">Flux</span>. All rights reserved.
            </p>
          </div>

          {/* Quick link: Column (2 sub-columns) */}
          <div className="lg:col-span-4">
            <p className="text-sm font-semibold text-white">
              Quick <span className="text-[var(--brand-violet-300)]">link:</span>
            </p>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
              <ul className="flex flex-col gap-3.5">
                {QUICK_LINKS_COL1.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-3.5">
                {QUICK_LINKS_COL2.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Contact: Column */}
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-white">
              Quick <span className="text-[var(--brand-violet-300)]">Contact:</span>
            </p>
            <div className="mt-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-white">Community:</p>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-sm text-white/70 transition-colors hover:text-white"
                >
                  GitHub Issues
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Mail Us:</p>
                <a
                  href="mailto:hello@flux.dev"
                  className="mt-1 block text-sm text-white/70 transition-colors hover:text-white"
                >
                  hello@flux.dev
                </a>
              </div>
            </div>
          </div>

          {/* Follow us: Column */}
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-white">
              Follow <span className="text-[var(--brand-violet-300)]">us:</span>
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="group flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm transition-all duration-200 hover:border-[var(--brand-violet-500)]/80 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(89,59,255,0.3)]"
                >
                  {social.icon ? (
                    <social.icon className="size-4 text-white/80 transition-colors group-hover:text-white" />
                  ) : (
                    <Image
                      src={social.src as string}
                      alt=""
                      width={16}
                      height={16}
                      className="opacity-80 transition-opacity group-hover:opacity-100"
                    />
                  )}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/footer.png"
          alt=""
          aria-hidden="true"
          className="animate-spin-slow h-auto w-[320px] max-w-none translate-y-1/3 opacity-95 sm:w-[440px] md:w-[540px] lg:w-[620px]"
        />
      </div>

    </footer>
  );
}
