"use client";

import { CheckIcon, FlameIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "./constants";

type Billing = "monthly" | "yearly";

const PLANS = [
  {
    name: "Starter",
    description: "Try flux out on your own projects.",
    monthly: 0,
    yearly: 0,
    cta: "Get started",
    href: "/signup",
    featured: false,
    features: [
      "5 active workflows",
      "2,000 tasks / month",
      "Standard connectors",
      "Slack and Discord integrations",
      "Monthly Usage Reports",
    ],
  },
  {
    name: "Growth",
    description: "Best for individuals & small teams.",
    monthly: 19,
    yearly: 15,
    cta: "Start Automating",
    href: "/signup",
    featured: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Unlimited workflows",
      "50,000 tasks / month",
      "Priority execution",
      "Advanced logic nodes",
      "Custom task limits",
    ],
  },
  {
    name: "Enterprise",
    description: "For teams that need scale & control.",
    monthly: null,
    yearly: null,
    cta: "Contact us",
    href: GITHUB_URL,
    featured: false,
    features: [
      "Custom task limits",
      "Self-hosted deployment",
      "SOC2-ready guidance",
      "24/7 support",
      "Priority execution",
    ],
  },
] as const;

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section
      id="pricing"
      className="dark relative overflow-hidden py-24 text-white"
    >
      <div className="mx-auto max-w-lg px-6 text-center">
        <span className="brand-ring-border inline-flex items-center rounded-full px-4 py-1.5 text-sm tracking-wide text-white">
          Pricing
        </span>
        <h2 className="mt-6 text-4xl font-medium tracking-tight sm:text-5xl">
          Pricing that Scales with you
        </h2>
        <p className="mt-4 text-white">
          Start simple, upgrade anytime, and scale effortlessly as your
          automation needs grow.
        </p>
      </div>

      <BillingToggle billing={billing} onChange={setBilling} />

      <div className="mx-auto mt-8 grid max-w-6xl gap-6 px-2 md:grid-cols-3 brand-ring-border p-3 rounded-3xl">
        {PLANS.map((plan) => (
          <PricingCard key={plan.name} plan={plan} billing={billing} />
        ))}
      </div>
    </section>
  );
}

function BillingToggle({
  billing,
  onChange,
}: {
  billing: Billing;
  onChange: (b: Billing) => void;
}) {
  return (
    <div className="mx-auto mt-10 flex max-w-5xl justify-center px-6">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1.5">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            billing === "monthly"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("yearly")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            billing === "yearly"
              ? "bg-white/10 text-white"
              : "text-white/70 hover:text-white/80"
          }`}
        >
          Yearly
          <span className="brand-mesh rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  billing,
}: {
  plan: (typeof PLANS)[number];
  billing: Billing;
}) {
  const price = billing === "monthly" ? plan.monthly : plan.yearly;

  return (
    <div
      className={
        plan.featured
          ? "brand-ring-border relative flex flex-col overflow-hidden rounded-3xl p-12 [--ring-from:var(--brand-violet-500)] [--ring-to:var(--brand-violet-300)]"
          : "relative flex flex-col rounded-3xl border border-white/10 bg-[var(--brand-surface-1)] p-7"
      }
    >
      {plan.featured && (
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
      )}

      {plan.featured && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[linear-gradient(to_top,color-mix(in_oklch,var(--brand-violet-500)_35%,transparent),transparent)]"
        />
      )}

      <div className="relative z-10 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{plan.name}</p>
        {plan.badge && (
          <span className="brand-ring-border inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold text-white [--ring-surface:var(--brand-violet-900)]">
            <FlameIcon
              className="size-5 text-[var(--brand-orange-500)]"
              fill="currentColor"
            />
            {plan.badge}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-3 flex items-baseline gap-1">
        {price === null ? (
          <span className="text-4xl font-medium tracking-tight">Custom</span>
        ) : (
          <>
            <span className="self-start pt-2 text-lg font-medium text-white/90">
              $
            </span>
            <span className="text-5xl font-medium tracking-tight">{price}</span>
            <span className="text-sm text-white/80">/month</span>
          </>
        )}
      </div>

      <p className="relative z-10 mt-3 text-sm text-white">
        {plan.description}
      </p>

      <Button
        asChild
        className="relative z-10 mt-6 w-full rounded-full bg-white text-[var(--brand-violet-900)] shadow-md hover:bg-white/90"
      >
        <Link href={plan.href}>
          <span className="text-[var(--brand-orange-500)]">
            {plan.cta.split(" ")[0]}
          </span>{" "}
          <span className="brand-gradient-text">
            {plan.cta.split(" ").slice(1).join(" ")}
          </span>
        </Link>
      </Button>

      <ul className="relative z-10 mt-7 flex flex-col gap-3 border-t border-white/10 pt-6">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2.5 text-sm sm:text-base text-white font-medium"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-white/25 text-white">
              <CheckIcon className="size-3 font-semibold" strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
