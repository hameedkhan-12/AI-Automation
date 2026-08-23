import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "./constants";
import { IntegrationOrbit } from "./integration-orbit";

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-28 pt-16 md:pt-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px] bg-[url('/logos/wave.svg')] bg-size-[auto_100%] bg-center bg-no-repeat opacity-35"
      />

      <div className="animate-soft-rise relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
          Your workflows should
          <br />
          run <span className="brand-gradient-text">on autopilot.</span>
        </h1>

        <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          flux connects payments, forms, language models, and chat into
          reliable automations you assemble on a canvas — not a config file.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            asChild
            className="bg-[var(--brand-orange-500)] text-white shadow-md shadow-[var(--brand-orange-500)]/25 hover:bg-[var(--brand-orange-600)]"
          >
            <Link href={isAuthenticated ? "/workflows" : "/signup"}>
              {isAuthenticated ? "Open workflows" : "Start building free"}
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </Button>
        </div>

        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Next.js · tRPC · Prisma · Inngest · React Flow
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-20 max-w-4xl">
        <IntegrationOrbit />
      </div>
    </section>
  );
}
