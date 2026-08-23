import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    cta: "Get started",
    href: "/signup",
    featured: false,
    features: ["5 active workflows", "2,000 tasks/mo", "Standard connectors"],
  },
  {
    name: "Growth",
    price: "$19",
    period: "/mo",
    cta: "Get started",
    href: "/signup",
    featured: true,
    badge: "Most popular",
    features: [
      "Unlimited workflows",
      "50,000 tasks/mo",
      "Priority execution",
      "Advanced logic nodes",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    cta: "Contact us",
    href: "https://github.com/hameedkhan-12/ai-automation",
    featured: false,
    features: ["Custom task limits", "Self-hosted deployment", "SOC2-ready guidance"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-3 text-muted-foreground">
          Start for free, self-host anytime, then upgrade when you need more
          power. No hidden fees.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-7 ${
              plan.featured
                ? "border-transparent bg-[var(--brand-violet-900)] text-white shadow-xl md:-translate-y-3"
                : "border-border bg-card"
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand-orange-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {plan.badge}
              </span>
            )}
            <p
              className={`text-sm font-medium ${plan.featured ? "text-white/70" : "text-muted-foreground"}`}
            >
              {plan.name}
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">
                {plan.price}
              </span>
              {plan.period && (
                <span
                  className={`text-sm ${plan.featured ? "text-white/60" : "text-muted-foreground"}`}
                >
                  {plan.period}
                </span>
              )}
            </div>

            <Button
              asChild
              className={`mt-6 w-full ${
                plan.featured
                  ? "bg-white text-[var(--brand-violet-900)] hover:bg-white/90"
                  : ""
              }`}
              variant={plan.featured ? undefined : "outline"}
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>

            <ul className="mt-7 flex flex-col gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full ${
                      plan.featured
                        ? "bg-white/15 text-white"
                        : "bg-[var(--brand-violet-100)] text-[var(--brand-violet-600)]"
                    }`}
                  >
                    <CheckIcon className="size-2.5" strokeWidth={3} />
                  </span>
                  <span className={plan.featured ? "text-white/90" : ""}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
