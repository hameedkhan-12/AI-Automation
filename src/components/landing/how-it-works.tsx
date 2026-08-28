const STEPS = [
  {
    number: "01",
    title: "Configure AI Agent",
    description:
      "Set goals, connect data sources, and choose prebuilt behaviors to shape your agent's role — no code required. Customize logic, permissions, and triggers in minutes.",
    icon: "/images/hero/download%20(55).svg",
  },
  {
    number: "02",
    title: "Activate Automation",
    description:
      "The agent listens for events, analyzes context in real time, and executes actions automatically. From task handling to decision support, everything runs continuously in the background.",
    icon: "/images/hero/download%20(57).svg",
  },
  {
    number: "03",
    title: "Monitor And Optimize",
    description:
      "Track performance, review decisions, and refine behavior using built-in analytics. Your AI agent improves over time, adapting to new patterns and business needs.",
    icon: "/images/hero/download%20(58).svg",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="solutions"
      className="dark relative py-24 text-white"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-x-28 gap-y-12 lg:grid-cols-2">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <span className="brand-ring-border inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-white/80">
              Process
            </span>
            <h2 className="mt-6 text-4xl font-medium tracking-tight sm:text-5xl">
              Our AI-First Approach
            </h2>
            <p className="mt-4 max-w-sm text-white/60">
              Discover how AI workflow automation can transform your business
              and streamline your operations.
            </p>
          </div>

          <div className="flex flex-col items-center lg:items-stretch gap-8">
            {STEPS.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className="brand-ring-border w-full max-w-[470px] min-h-[260px] relative overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className="flex items-start justify-between">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={step.icon}
            alt=""
            aria-hidden="true"
            className="size-full object-cover"
          />
        </div>
        <span
          aria-hidden="true"
          className="select-none font-mono text-6xl font-medium text-white/10"
        >
          {step.number}
        </span>
      </div>

      <h3 className="mt-10 text-xl font-semibold tracking-tight">{step.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-white/60">
        {step.description}
      </p>
       <>
          <img
            src="/images/hero/download (56).svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
          <img
            src="/images/hero/download (56).svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        </>
    </div>
  );
}