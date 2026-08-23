import {
  GitBranchIcon,
  LockKeyholeIcon,
  MailIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  WorkflowIcon,
  ZapIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export function FeaturesBento() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Precision-engineered to keep work moving
        </h2>
        <p className="mt-3 text-muted-foreground">
          Six capabilities, one canvas. Everything you need to automate
          smarter and ship faster.
        </p>
      </div>

      <div
        className="mt-12 grid gap-5 md:grid-cols-3"
        style={{
          gridTemplateAreas: `"a b b" "a c d" "e f f"`,
        }}
      >
        <BentoCard area="a" className="md:row-span-2">
          <MiniOrbitGraphic />
          <CardCopy
            title="No-code automation"
            description="Drag triggers, models, and actions onto a canvas and wire them together. No YAML, no DSL to learn."
          />
        </BentoCard>

        <BentoCard area="b">
          <MiniIntegrationsGraphic />
          <CardCopy
            title="Smart integrations"
            description="Connect Stripe, Slack, OpenAI, Anthropic, and more in seconds — everything flows through one canvas."
          />
        </BentoCard>

        <BentoCard area="c">
          <MiniChartGraphic />
          <CardCopy
            title="Every run, replayable"
            description="Each execution is stored step by step, so you can inspect exactly what moved through which node."
          />
        </BentoCard>

        <BentoCard area="d">
          <MiniTeamGraphic />
          <CardCopy
            title="Type-safe end to end"
            description="tRPC, Zod, and Prisma keep client, API, and database in sync — one schema change, zero drift."
          />
        </BentoCard>

        <BentoCard area="e">
          <MiniAiGraphic />
          <CardCopy
            title="AI models as nodes"
            description="Drop in OpenAI, Anthropic, or Gemini nodes to summarize, classify, or generate mid-workflow."
          />
        </BentoCard>

        <BentoCard area="f" className="md:flex md:items-center md:gap-8">
          <MiniSecurityGraphic />
          <CardCopy
            title="Encrypted & dependency-aware"
            description="Secrets are encrypted at rest and scoped per user. Workflows resolve as a directed graph, so nodes always run in the correct order."
          />
        </BentoCard>
      </div>
    </section>
  );
}

function BentoCard({
  area,
  className = "",
  children,
}: {
  area: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ gridArea: area }}
      className={`brand-card-glow flex flex-col justify-between overflow-hidden rounded-2xl border border-border p-6 transition-colors hover:border-[var(--brand-violet-500)]/40 ${className}`}
    >
      {children}
    </div>
  );
}

function CardCopy({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function IconChip({ icon: Icon }: { icon: typeof WorkflowIcon }) {
  return (
    <div className="flex size-8 items-center justify-center rounded-full border border-border bg-card shadow-sm">
      <Icon className="size-3.5 text-[var(--brand-violet-500)]" />
    </div>
  );
}

function MiniOrbitGraphic() {
  return (
    <div className="relative flex h-32 items-center justify-center">
      <div className="absolute left-4 top-2">
        <IconChip icon={MailIcon} />
      </div>
      <div className="absolute right-6 top-6">
        <IconChip icon={UsersIcon} />
      </div>
      <div className="absolute bottom-2 right-2">
        <IconChip icon={GitBranchIcon} />
      </div>
      <div className="absolute bottom-4 left-8">
        <IconChip icon={MessageSquareIcon} />
      </div>
      <div className="brand-logo-mark flex size-11 items-center justify-center rounded-xl shadow-sm">
        <WorkflowIcon className="size-5 text-white" />
      </div>
    </div>
  );
}

function MiniIntegrationsGraphic() {
  return (
    <div className="relative flex h-20 items-center justify-between rounded-xl border border-border bg-secondary/30 px-4">
      <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        +10 tools
      </span>
      <svg viewBox="0 0 140 40" className="h-8 w-24" aria-hidden="true">
        <polyline
          points="0,32 25,18 50,26 75,8 100,16 140,2"
          fill="none"
          stroke="var(--brand-violet-500)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="brand-logo-mark flex size-8 items-center justify-center rounded-lg">
        <ZapIcon className="size-4 text-white" />
      </div>
    </div>
  );
}

function MiniChartGraphic() {
  return (
    <div className="flex h-20 flex-col justify-end rounded-xl border border-border bg-secondary/30 p-3">
      <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
        <span className="size-1 rounded-full bg-emerald-500" />
        Live
      </span>
      <svg viewBox="0 0 100 24" className="h-8 w-full" aria-hidden="true">
        <polyline
          points="0,20 15,16 30,18 45,8 60,12 75,4 100,6"
          fill="none"
          stroke="var(--brand-violet-500)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function MiniTeamGraphic() {
  return (
    <div className="flex h-20 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/30">
      <IconChip icon={ShieldCheckIcon} />
      <IconChip icon={GitBranchIcon} />
      <div className="brand-logo-mark flex size-9 items-center justify-center rounded-full">
        <UsersIcon className="size-4 text-white" />
      </div>
      <IconChip icon={WorkflowIcon} />
    </div>
  );
}

function MiniAiGraphic() {
  return (
    <div className="relative flex h-20 items-center justify-center rounded-xl border border-border bg-secondary/30">
      <div className="absolute left-5">
        <IconChip icon={MailIcon} />
      </div>
      <div className="brand-logo-mark flex size-9 items-center justify-center rounded-full">
        <SparklesIcon className="size-4 text-white" />
      </div>
      <div className="absolute right-5">
        <IconChip icon={UsersIcon} />
      </div>
    </div>
  );
}

function MiniSecurityGraphic() {
  return (
    <div className="mb-5 flex shrink-0 items-center gap-3 md:mb-0">
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <GitBranchIcon className="size-5 text-[var(--brand-violet-500)]" />
        <span className="text-[10px] font-medium text-muted-foreground">
          Auto scaling
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <LockKeyholeIcon className="size-5 text-emerald-500" />
        <span className="text-[10px] font-medium text-muted-foreground">
          Encrypted vault
        </span>
      </div>
    </div>
  );
}
