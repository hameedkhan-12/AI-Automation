import {
  CandlestickChartIcon,
  HeadphonesIcon,
  MessageSquareIcon,
  ReceiptIcon,
  SlackIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export function Teams() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Engineered for every team
        </h2>
        <p className="mt-3 text-muted-foreground">
          The same node canvas adapts to whatever your team automates first.
        </p>
      </div>

      <div
        className="mt-12 grid gap-5 md:grid-cols-3"
        style={{ gridTemplateAreas: `"a b b" "a c d"` }}
      >
        <TeamCard area="a" className="md:row-span-2">
          <div className="relative flex h-40 items-center justify-center">
            <div className="absolute top-2 flex flex-col items-center gap-3">
              <div className="brand-logo-mark flex size-10 items-center justify-center rounded-full">
                <CandlestickChartIcon className="size-4 text-white" />
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex gap-8">
                <div className="flex size-9 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                  <ReceiptIcon className="size-3.5 text-[var(--brand-violet-500)]" />
                </div>
                <div className="flex size-9 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                  <SlackIcon className="size-3.5 text-[var(--brand-violet-500)]" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill>Backtests</Pill>
            <Pill>Live orders</Pill>
            <Pill>Signals</Pill>
          </div>
          <h3 className="mt-5 text-base font-semibold">Trading & quant teams</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Backtest strategies against historical candles, then wire the
            same graph to place live orders through an exchange adapter.
          </p>
        </TeamCard>

        <TeamCard area="b" className="md:flex md:items-center md:gap-6">
          <div className="mb-5 flex shrink-0 justify-center md:mb-0">
            <RadialIcons />
          </div>
          <div>
            <h3 className="text-base font-semibold">Growth & revenue teams</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Route new Stripe payments straight into a Slack alert, a CRM
              update, or an AI-drafted welcome note.
            </p>
          </div>
        </TeamCard>

        <TeamCard area="c">
          <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-[var(--brand-violet-100)]">
            <HeadphonesIcon className="size-4 text-[var(--brand-violet-600)]" />
          </div>
          <h3 className="text-base font-semibold">Support teams</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Auto-route inbound requests and notify the right channel the
            moment a form or webhook fires.
          </p>
        </TeamCard>

        <TeamCard area="d">
          <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-[var(--brand-violet-100)]">
            <MessageSquareIcon className="size-4 text-[var(--brand-violet-600)]" />
          </div>
          <h3 className="text-base font-semibold">Ops & platform teams</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Chain HTTP requests, conditions, and retries into dependable
            internal automations you don&apos;t have to babysit.
          </p>
        </TeamCard>
      </div>
    </section>
  );
}

function TeamCard({
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
      className={`brand-card-glow rounded-2xl border border-border p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function RadialIcons() {
  return (
    <div className="relative flex size-24 items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-dashed border-border" />
      <div className="brand-logo-mark flex size-11 items-center justify-center rounded-full">
        <ReceiptIcon className="size-5 text-white" />
      </div>
      <div className="absolute -top-1 left-1/2 -translate-x-1/2">
        <MiniDot />
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <MiniDot />
      </div>
      <div className="absolute -left-1 top-1/2 -translate-y-1/2">
        <MiniDot />
      </div>
      <div className="absolute -right-1 top-1/2 -translate-y-1/2">
        <MiniDot />
      </div>
    </div>
  );
}

function MiniDot() {
  return (
    <div className="flex size-6 items-center justify-center rounded-full border border-border bg-card shadow-sm">
      <span className="size-1.5 rounded-full bg-[var(--brand-violet-500)]" />
    </div>
  );
}
