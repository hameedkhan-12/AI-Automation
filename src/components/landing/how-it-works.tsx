import {
  BoltIcon,
  LinkIcon,
  SendIcon,
  UserRoundIcon,
  WorkflowIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const STEPS = [
  {
    number: "01",
    title: "Connect your tools",
    description:
      "Add a credential once and it's securely encrypted and ready to reuse — Stripe, OpenAI, Slack, and more.",
    icon: LinkIcon,
  },
  {
    number: "02",
    title: "Build your workflow",
    description:
      "Use the drag-and-drop canvas to map triggers, AI nodes, and actions into a dependency-aware graph.",
    icon: WorkflowIcon,
  },
  {
    number: "03",
    title: "Launch & inspect",
    description:
      "Trigger a run and watch it execute live, node by node — every step logged and replayable afterward.",
    icon: BoltIcon,
  },
];

export function HowItWorks() {
  return (
    <section
      id="solutions"
      className="dark relative overflow-hidden py-24 text-white"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Get started in minutes
          </h2>
          <p className="mt-3 text-white/60">
            We&apos;ve made automation simple enough that anyone on your team
            can build powerful workflows.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-16">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col items-center gap-8 md:gap-14 ${
                i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              <div className="flex-1 text-center md:text-left">
                <span className="font-mono text-sm text-[var(--brand-violet-600)]">
                  {step.number}
                </span>
                <h3 className="mt-2 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm text-white/60 md:mx-0 mx-auto">
                  {step.description}
                </p>
              </div>
              <div className="flex-1">
                <StepGraphic icon={step.icon} variant={i} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepGraphic({
  icon: Icon,
  variant,
}: {
  icon: typeof BoltIcon;
  variant: number;
}) {
  return (
    <div className="relative flex h-44 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
      <GlowOrb />
      <div className="relative flex items-center gap-6">
        {variant !== 1 && <SatelliteIcon icon={UserRoundIcon} />}
        <div className="brand-logo-mark animate-hub-glow flex size-14 items-center justify-center rounded-2xl">
          <Icon className="size-6 text-white" />
        </div>
        {variant !== 2 && <SatelliteIcon icon={SendIcon} />}
      </div>
    </div>
  );
}

function SatelliteIcon({ icon: Icon }: { icon: typeof UserRoundIcon }) {
  return (
    <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
      <Icon className="size-4 text-white/70" />
    </div>
  );
}

function GlowOrb(): ReactNode {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(40%_60%_at_50%_50%,color-mix(in_oklch,var(--brand-violet-500)_35%,transparent),transparent_70%)]"
    />
  );
}
