import { SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ScrollFillCard } from "./scroll-card";

type Row = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  rotateImage?: boolean;
  imageOnRight: boolean;
  content?: "scroll-fill-card";
};

const ROWS: Row[] = [
  {
    title: "Workflow Automation",
    description:
      "Automate repetitive multi-step processes — from a form submission to a fully routed, notified, and logged run — so your team can focus on higher-value work.",
    image: "/images/hero/download (12).svg",
    imageAlt: "Workflow automation node graph mockup",
    imageOnRight: false,
  },
  {
    title: "AI Chat & Assistant Nodes",
    description:
      "Drop in OpenAI, Anthropic, or Gemini nodes that read incoming messages, qualify leads, and escalate anything that needs a human — no separate chatbot platform required.",
    image: "/images/hero/download (11).svg",
    imageAlt: "AI assistant chat widget mockup",
    imageOnRight: true,
  },
  {
    title: "Multi-Channel Notifications",
    description:
      "Fan a single trigger out to email, Slack, Discord, and mobile push at once — each channel fires independently, so one slow integration never blocks the rest.",
    image: "/images/hero/download (10).svg",
    imageOnRight: false,
    content: "scroll-fill-card",
  },
  {
    title: "CRM & Team Routing",
    description:
      "Automatically capture, qualify, and route incoming leads or tickets to the right person on your team, based on rules you define once on the canvas.",
    image: "/images/hero/download (13).svg",
    imageAlt: "CRM automation routing mockup with rotating team avatars",
    imageOnRight: true,
    rotateImage: true,
  },
];

export function FeaturesBento() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <span className="brand-ring-border mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide text-white/80">
          <SparklesIcon className="size-3 text-[var(--brand-orange-500)]" />
          AI-Driven Solutions
        </span>
        <h2 className="text-3xl font-medium tracking-tight text-balance sm:text-5xl">
          Build automated AI workflows
        </h2>
        <p className="mt-3 text-muted-foreground">
          Connect your favorite apps, set simple triggers, and let flux run
          tasks for you — no coding required.
        </p>
      </div>

      <div className="relative mt-16">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero/download (23).svg"
            alt=""
            aria-hidden="true"
            className="h-full w-auto -translate-x-1/2 opacity-70"
          />
          <span
            aria-hidden="true"
            className="animate-flow-down absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_3px_var(--brand-violet-500)]"
          />
          {["12.5%", "37.5%", "62.5%", "87.5%"].map((top) => (
            <span
              key={top}
              aria-hidden="true"
              className="absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--brand-violet-500)] bg-[var(--background)]"
              style={{ top }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-16 lg:gap-24">
          {ROWS.map((row) => (
            <div
              key={row.title}
              className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-16 ${
                row.imageOnRight ? "" : "lg:flex-row-reverse"
              }`}
            >
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-xl font-semibold sm:text-2xl">
                  {row.title}
                </h3>
                <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground lg:mx-0">
                  {row.description}
                </p>
              </div>

              <div className="flex flex-1 justify-center">
                  <RowImage
                    src={row.image as string}
                    alt={row.imageAlt as string}
                    rotate={row.rotateImage}
                  />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RowImage({
  src,
  alt,
  rotate,
}: {
  src: string;
  alt: string;
  rotate?: boolean;
}) {
  if (!rotate) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={src} alt={alt} className="w-full max-w-md drop-shadow-2xl" />
    );
  }

  return (
    <div className="relative w-full max-w-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="animate-spin-slower w-full drop-shadow-2xl"
      />
      <TagChip className="left-2 top-4">Sales</TagChip>
      <TagChip className="right-2 top-10">Support</TagChip>
      <TagChip className="bottom-10 left-4">Success</TagChip>
      <TagChip className="bottom-2 right-8">Ops</TagChip>
    </div>
  );
}

function TagChip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`absolute rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm ${className}`}
    >
      {children}
    </span>
  );
}