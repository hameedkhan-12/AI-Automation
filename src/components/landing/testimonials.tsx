import type { CSSProperties } from "react";

type CSSVars = CSSProperties & Record<`--${string}`, string>;

const TESTIMONIALS = [
  {
    quote:
      "This platform completely changed how we manage workflows. What used to take hours now runs automatically in the background.",
    name: "Sample Customer",
    role: "Head of Ops, placeholder company",
    initials: "SC",
    meshAngle: "128deg",
  },
  {
    quote:
      "The credential vault alone sold us — every API key is encrypted and scoped, so onboarding a teammate doesn't mean sharing secrets.",
    name: "Sample Customer",
    role: "Engineering Lead, placeholder company",
    initials: "EL",
    meshAngle: "145deg",
  },
  {
    quote:
      "flux has become the backbone of how we route support tickets and trading alerts. Self-hosting it was the easy part.",
    name: "Sample Customer",
    role: "Platform Lead, placeholder company",
    initials: "PL",
    meshAngle: "97deg",
  },
] as const;

export function Testimonials() {
  return (
    <section className="dark relative overflow-hidden py-24 text-white">
      <div className="mx-auto max-w-lg px-6 text-center ">
        <span className="brand-ring-border inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide text-white/80">
          Testimonial
        </span>
        <h2 className="mt-6 text-4xl font-medium tracking-tight sm:text-5xl">
          Loved by Creative People
        </h2>
        <p className="mt-4 text-white/60">
          These are sample quotes previewing the layout — swap in real feedback
          once you have users.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.name + t.role} {...t} />
        ))}
      </div>
    </section>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  initials,
  meshAngle,
}: (typeof TESTIMONIALS)[number]) {
  return (
    <div className="brand-ring-border flex flex-col rounded-2xl p-6">
      <img
        src="/images/hero/download (56).svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      <div className="flex items-center gap-3">
        <span
          className="brand-mesh flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
          style={{ "--mesh-angle": meshAngle } as CSSVars}
        >
          {initials}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-white/50">{role}</p>
        </div>
      </div>

      <p className="mt-8 flex-1 text-[15px] font-medium leading-relaxed text-balance text-white/90">
        &ldquo;{quote}&rdquo;
      </p>

      <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5">
        <LogoipsumMark />
        <span className="text-sm font-semibold text-white/70">Logoipsum</span>
      </div>
    </div>
  );
}

function LogoipsumMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 8c4-3 8 3 12 0M4 12c4-3 8 3 12 0M4 16c4-3 8 3 12 0"
        stroke="white"
        strokeOpacity="0.7"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
