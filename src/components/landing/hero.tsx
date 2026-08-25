import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "./constants";

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="dark relative isolate overflow-hidden text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/dotted-ring.svg"
        alt=""
        aria-hidden="true"
        className="animate-spin-slow pointer-events-none absolute left-[-18%] top-1/2 hidden aspect-square w-[80%] max-w-[820px] -translate-y-1/2 opacity-70 md:block"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/dotted-ring.svg"
        alt=""
        aria-hidden="true"
        className="animate-spin-slow pointer-events-none absolute right-[-18%] top-1/2 hidden aspect-square w-[80%] max-w-[820px] -translate-y-1/2 opacity-70 md:block"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-arc-left.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 hidden h-[78%] w-auto -translate-y-1/2 md:block lg:left-28"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-arc-right.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 hidden h-[86%] w-auto -translate-y-1/2 md:block lg:right-28"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero/download (14).svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute top-12  -z-10 w-[560px] max-w-none opacity-70 blur-2xl sm:w-[680px]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero/download (14).svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow-alt pointer-events-none absolute top-8 -right-10 -z-10 w-[520px] max-w-none rotate-180 opacity-60 blur-2xl sm:w-[640px]"
      />
      <img
        src="/images/hero/download (14).svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow-alt pointer-events-none top-80 right-97 absolute -z-10 w-[520px] max-w-none rotate-180 opacity-60 blur-2xl sm:w-[640px]"
      />

      {/* Center hotspot — brightens the middle of the band the way the
          reference's central radial highlight does. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(45%_55%_at_50%_38%,color-mix(in_oklch,var(--brand-violet-500)_38%,transparent),transparent_70%)]"
      />

      <div className="animate-soft-rise relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-28 pt-32 text-center md:pt-40">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
          <SparklesIcon className="size-3 text-[var(--brand-orange-500)]" />
          Automate work with AI agents
        </div>

        <h1 className="text-4xl font-medium tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
          Build Automated AI Workflows
        </h1>

        <p className="mt-5 max-w-lg text-base text-white/60 sm:text-lg">
          flux connects payments, forms, language models, and chat into
          reliable automations you assemble on a canvas — not a config file.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            asChild
            className="rounded-full bg-white px-7 text-[var(--brand-violet-900)] shadow-md hover:bg-white/90"
          >
            <Link href={isAuthenticated ? "/workflows" : "/signup"}>
              {isAuthenticated ? "Open workflows" : "Get Started"}{" "}
              <span className="brand-gradient-text">Now</span>
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 text-xs text-white/40 underline-offset-4 transition-colors hover:text-white/70 hover:underline"
        >
          View on GitHub
        </a>

      </div>
    </section>
  );
}