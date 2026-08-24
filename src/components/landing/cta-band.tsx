import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "./constants";

export function CtaBand({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    // overflow-x-clip (not overflow-hidden) so horizontal scroll can never
    // happen from the oversized decorative layers, while still letting
    // them bleed vertically past this section's own top edge into
    // whatever section precedes it — same "peeks above its own box"
    // technique used for the hero's rings, just modest here so it holds
    // up across breakpoints instead of relying on large fixed offsets.
    <section className="dark relative isolate overflow-x-clip text-white mt-44">
      {/* Two concentric rings, rotating in opposite directions at
          different speeds. Reusing the existing PNG ring assets rather
          than redrawing them:
            - footer3.png: outer tick-marked ring
            - footer2.png: inner plain ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-34 -z-10 aspect-square w-[760px] max-w-none -translate-x-1/2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/footer3.png"
          alt=""
          className="animate-spin-slower absolute h-full w-full"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/footer2.png"
          alt=""
          className="animate-spin-reverse-slower absolute inset-[10%] h-[80%] w-[80%]"
        />
      </div>

      {/* The orb — same asset the orbit-hub icon uses elsewhere
          (public/images/hero/download (13).svg). One heavily blurred
          copy for the ambient glow wash, one sharper copy on top for
          definition, the same two-layer technique the hero's glow
          blobs use. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero/download%20(13).svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-16 -z-10 aspect-square w-[560px] max-w-none -translate-x-1/2 opacity-90 blur-3xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/orangeball.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-8 -z-10 aspect-square w-[580px] h-[580px] opacity-80 max-w-none -translate-x-1/2"
      />

      {/* Fades the section smoothly into solid ink toward the bottom, so
          the orb's glow reads as emanating from the top rather than
          ending on a hard edge. */}
      <div
        aria-hidden="true"
        className="brand-fade-to-ink pointer-events-none absolute backdrop-blur-lg inset-x-0 bottom-0 -z-10 h-2/3"
      />

 <img
        src="/images/hero/download (4).svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow-alt pointer-events-none top-80  absolute -z-10 w-[520px] h-[500px] max-w-none rotate-180 opacity-60 blur-2xl sm:w-[1140px]"
      />
 <img
        src="/images/hero/download (5).svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow-alt pointer-events-none top-60 left-0 absolute -z-10 w-[520px] h-[500px] max-w-none rotate-180 opacity-40 blur-2xl sm:w-[1140px]"
      />
 <img
        src="/images/hero/download (5).svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow-alt pointer-events-none top-80 right-10  absolute -z-10 w-[520px] h-[500px] max-w-none rotate-180 opacity-40 blur-2xl sm:w-[1000px]"
      />

    
 <img
        src="/images/hero/download (4).svg"
        alt=""
        aria-hidden="true"
        className="animate-float-slow-alt pointer-events-none top-60 right-0  absolute -z-10 w-[520px] h-[500px] max-w-none rotate-180 opacity-40 blur-2xl sm:w-[1000px]"
      />

    
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6 pb-24 pt-32 text-center sm:pt-40">
        <h2 className="text-4xl font-medium text-balance sm:text-7xl pt-24">
          Start Automating in Minutes.
        </h2>

        <p className="mt-5 max-w-md text-white/70">
          Join teams using AI-powered workflows to save time, reduce errors,
          and scale faster.
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
        </div>
      </div>
    </section>
  );
}