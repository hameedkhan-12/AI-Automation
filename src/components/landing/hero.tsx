import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "./constants";

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="brand-dark-band relative isolate overflow-hidden text-white">
      {/* Each side has a matching pair: a full dashed circle that spins
          continuously, and a bright static arc segment — both drawn from
          the exact same center/radius, so they sit on one shared circle
          instead of two independently-sized shapes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-ring-left.svg"
        alt=""
        aria-hidden="true"
        className="animate-spin-slow origin-[93.4%_93.8%] pointer-events-none absolute left-6 top-1/2 hidden h-[70%] w-auto -translate-y-1/2 md:block lg:left-16"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-arc-left.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-1/2 hidden h-[70%] w-auto -translate-y-1/2 md:block lg:left-16"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-ring-right.svg"
        alt=""
        aria-hidden="true"
        className="animate-spin-slow origin-[18.6%_95.7%] pointer-events-none absolute right-6 top-1/2 hidden h-[70%] w-auto -translate-y-1/2 md:block lg:right-16"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-arc-right.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-1/2 hidden h-[70%] w-auto -translate-y-1/2 md:block lg:right-16"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-glow-blob.svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -top-20 left-[18%] -z-10 w-[420px] max-w-none opacity-60 blur-2xl sm:w-[520px]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/hero-glow-blob.svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow-alt pointer-events-none absolute bottom-0 right-[12%] -z-10 w-[360px] max-w-none rotate-180 opacity-50 blur-2xl sm:w-[460px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(45%_55%_at_50%_35%,color-mix(in_oklch,var(--brand-violet-500)_35%,transparent),transparent_70%)]"
      />

      <div className="animate-soft-rise relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-28 pt-16 text-center md:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
          <SparklesIcon className="size-3 text-[var(--brand-orange-500)]" />
          Automate work with AI agents
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-8xl font-medium tracking-tight text-balance ">
          Build Automated AI Workflows
          <br />
        </h1>

        <p className="mt-5 max-w-lg text-base text-white/60 sm:text-lg">
          flux connects payments, forms, language models, and chat into
          reliable automations you assemble on a canvas — not a config file.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
          <Button
            size="lg"
            variant="outline"
            asChild
            className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </Button>
        </div>

        <p className="mt-6 font-mono text-xs text-white/40">
          Next.js · tRPC · Prisma · Inngest · React Flow
        </p>
      </div>
    </section>
  );
}