import { GithubIcon, TwitterIcon, WorkflowIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GITHUB_URL } from "./constants";

const QUICK_LINKS_A = [
  { label: "Home", href: "#top" },
  { label: "Solutions", href: "#solutions" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

const QUICK_LINKS_B = [
  { label: "GitHub Issues", href: `${GITHUB_URL}/issues`, external: true },
  { label: "Terms & Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

const SOCIALS = [
  { label: "GitHub", href: GITHUB_URL, icon: GithubIcon },
  { label: "Discord", href: "#", icon: null, src: "/logos/discord.svg" },
  { label: "X (Twitter)", href: "#", icon: TwitterIcon },
];

export function Footer() {
  return (
    <footer className="dark relative overflow-hidden text-white">
      <div className="absolute inset-x-0 top-0 border-t border-white/10" />

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="relative mx-auto h-full px-6 mt-44 ml-28">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative
              bleed image of unknown intrinsic size; plain img preserves its
              natural aspect ratio instead of forcing one. */}
          <img
            src="/images/footer.png"
            alt=""
            aria-hidden="true"
            className="animate-spin-slow absolute -bottom-10 left-[45%] w-[280px] -translate-x-1/2 opacity-90 sm:w-[380px] lg:left-[42%] lg:w-[480px]"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-16 sm:pb-52">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="#top"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2"
            >
              <span className="brand-logo-mark flex size-6 items-center justify-center rounded-md">
                <WorkflowIcon
                  className="size-3.5 text-white"
                  strokeWidth={2.5}
                />
              </span>
              <span className="text-lg font-medium tracking-tight">FLUX</span>
            </Link>
            <p className="mt-6 text-sm text-white">
              &copy; {new Date().getFullYear()}{" "}
              <span className="font-medium text-white/70">flux</span>. All
              rights reserved.
            </p>
          </div>

          <div>
            <p className="text-base font-medium sm:text-lg">
              Quick <span className="brand-gradient-text">link:</span>
            </p>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
              <ul className="flex flex-col gap-3">
                {QUICK_LINKS_A.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-base text-white/90 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-3">
                {QUICK_LINKS_B.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="text-base text-white/90 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="text-base font-medium sm:text-lg">
              Quick <span className="brand-gradient-text">contact:</span>
            </p>
            <div className="mt-5 flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium text-white/80">Community:</p>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base text-white/90 transition-colors hover:text-white"
                >
                  Open an issue on GitHub
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Mail us:</p>
                <a
                  href="mailto:hello@flux.dev"
                  className="text-base text-white/90 transition-colors hover:text-white"
                >
                  hello@flux.dev
                </a>
              </div>
            </div>
          </div>

          <div>
            <p className="text-base font-medium sm:text-lg">
              Follow <span className="brand-gradient-text">us:</span>
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="flex size-11 items-center justify-center rounded-lg border border-white/15 bg-white/5 transition-colors hover:border-[var(--brand-violet-500)]/60"
                >
                  {social.icon ? (
                    <social.icon className="size-4 text-white" />
                  ) : (
                    <Image
                      src={social.src as string}
                      alt=""
                      width={16}
                      height={16}
                    />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
