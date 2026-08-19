import {
  ArrowRightIcon,
  GitBranchIcon,
  HistoryIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/hameedkhan-12/ai-automation";

const INTEGRATIONS = [
  { name: "Stripe", src: "/logos/stripe.svg" },
  { name: "OpenAI", src: "/logos/openai.svg" },
  { name: "Anthropic", src: "/logos/anthropic.svg" },
  { name: "Gemini", src: "/logos/gemini.svg" },
  { name: "Slack", src: "/logos/slack.svg" },
  { name: "Discord", src: "/logos/discord.svg" },
  { name: "Google Forms", src: "/logos/googleform.svg" },
];

const FEATURES = [
  {
    icon: WorkflowIcon,
    title: "Visual workflow builder",
    description:
      "Drag triggers, models, and actions onto a canvas and wire them together. No YAML, no DSL to learn.",
  },
  {
    icon: SparklesIcon,
    title: "AI models as first-class nodes",
    description:
      "Drop in OpenAI, Anthropic, or Gemini nodes to summarize, classify, or generate content mid-workflow.",
  },
  {
    icon: HistoryIcon,
    title: "Every run, replayable",
    description:
      "Each execution is stored step by step, so you can inspect exactly what data moved through which node, and re-run it.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Encrypted credential vault",
    description:
      "API keys and secrets are encrypted at rest and scoped per user, never exposed to the workflow definition itself.",
  },
  {
    icon: GitBranchIcon,
    title: "Dependency-aware execution",
    description:
      "Workflows are resolved as a directed graph, so nodes run in the correct order however you arrange the canvas.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Type-safe, end to end",
    description:
      "tRPC, Zod, and Prisma keep the client, API, and database in sync — one schema change, zero drift.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Trigger",
    description:
      "Start a run from a Stripe event, a Google Form submission, or a manual click while you're building.",
  },
  {
    number: "02",
    title: "Process",
    description:
      "Transform the payload, branch on conditions, or hand it to an AI node for summarizing, drafting, or classifying.",
  },
  {
    number: "03",
    title: "Act",
    description:
      "Post to Slack or Discord, call any API with the HTTP node, or chain into another workflow entirely.",
  },
];

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <IntegrationStrip />
      <Features />
      <HowItWorks />
      <CtaBand isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
}

function Nav({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Image src="/logos/logo.svg" alt="" width={26} height={11} priority />
          <span className="font-mono text-sm font-semibold tracking-tight">
            flux
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button size="sm" asChild>
              <Link href="/workflows">
                Dashboard
                <ArrowRightIcon />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">
                  Get started
                  <ArrowRightIcon />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="grid items-center gap-14 md:grid-cols-2">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            open-source · self-hostable
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Automate anything.
            <br />
            <span className="text-primary">Build it visually.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            flux connects the tools you already use — payments, forms,
            language models, chat — into reliable workflows you assemble on a
            canvas, not a config file.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href={isAuthenticated ? "/workflows" : "/signup"}>
                {isAuthenticated ? "Open workflows" : "Start building"}
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

        <FlowCanvasMock />
      </div>
    </section>
  );
}

function FlowCanvasMock() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
        <span className="font-mono text-xs text-muted-foreground">
          order-fulfillment.workflow
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-flow-pulse" />
          running
        </span>
      </div>

      <div className="bg-canvas-grid relative h-80 p-6 sm:h-96">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 400 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 96 70 C 160 70, 160 160, 200 160"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            className="animate-flow-edge"
          />
          <path
            d="M 296 160 C 336 160, 336 250, 300 250"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            className="animate-flow-edge"
          />
        </svg>

        <NodeCard
          className="absolute left-[6%] top-[14%] w-40"
          logo="/logos/stripe.svg"
          name="Stripe"
          label="Payment succeeded"
          status="success"
        />
        <NodeCard
          className="absolute left-[36%] top-[44%] w-44"
          logo="/logos/anthropic.svg"
          name="Claude"
          label="Summarize order"
          status="loading"
        />
        <NodeCard
          className="absolute left-[58%] top-[74%] w-40"
          logo="/logos/slack.svg"
          name="Slack"
          label="Notify #orders"
          status="pending"
        />
      </div>
    </div>
  );
}

function NodeCard({
  className,
  logo,
  name,
  label,
  status,
}: {
  className?: string;
  logo: string;
  name: string;
  label: string;
  status: "success" | "loading" | "pending";
}) {
  return (
    <div
      className={`rounded-xl border bg-card px-3 py-2.5 shadow-sm ${status === "pending"
          ? "border-dashed border-muted-foreground/40"
          : "border-border"
        } ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-secondary">
          <Image src={logo} alt="" width={13} height={13} />
        </div>
        <span className="text-xs font-medium">{name}</span>
        <StatusDot status={status} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusDot({ status }: { status: "success" | "loading" | "pending" }) {
  if (status === "success") {
    return <span className="ml-auto size-1.5 rounded-full bg-emerald-500" />;
  }
  if (status === "loading") {
    return (
      <span className="ml-auto size-1.5 rounded-full bg-primary animate-flow-pulse" />
    );
  }
  return (
    <span className="ml-auto size-1.5 rounded-full bg-muted-foreground/40" />
  );
}

function IntegrationStrip() {
  return (
    <section className="border-y border-border/70 bg-secondary/30 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-mono text-xs text-muted-foreground">
          connects to the tools you already use
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 grayscale opacity-70">
          {INTEGRATIONS.map((integration) => (
            <Image
              key={integration.name}
              src={integration.src}
              alt={integration.name}
              width={22}
              height={22}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-xl">
        <h2 className="text-3xl font-semibold tracking-tight">
          Everything a workflow needs to be trusted in production
        </h2>
        <p className="mt-3 text-muted-foreground">
          Not just a canvas — the execution engine, secrets handling, and
          history that make automations safe to hand off.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <feature.icon className="size-5 text-primary" />
            <h3 className="mt-4 text-sm font-medium">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border/70 bg-secondary/30 py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold tracking-tight">
          Three parts to every workflow
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              <span className="font-mono text-sm text-primary">
                {step.number}
              </span>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
              {i < STEPS.length - 1 && (
                <ArrowRightIcon className="pointer-events-none absolute -right-7 top-1 hidden size-4 text-muted-foreground/40 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">
        Ready to automate your first workflow?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Spin it up locally in a few minutes, or read the source before you
        commit to anything.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href={isAuthenticated ? "/workflows" : "/signup"}>
            {isAuthenticated ? "Go to dashboard" : "Get started free"}
            <ArrowRightIcon />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            Star on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Image src="/logos/logo.svg" alt="" width={20} height={8} />
          <span className="font-mono text-xs">flux</span>
        </div>
        <p className="font-mono text-xs">
          Next.js · TypeScript · tRPC · Prisma · Inngest · React Flow
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}