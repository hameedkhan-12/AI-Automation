import { StarIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const FEATURED = {
  quote:
    "We rebuilt our order-fulfillment pipeline in an afternoon. Setting up logic that used to take days now takes less than 15 minutes.",
  name: "Sample Customer",
  role: "Head of Ops, placeholder company",
  initials: "SC",
};

const OTHERS = [
  {
    quote:
      "The credential vault alone sold us — every API key is encrypted and scoped, so onboarding a new teammate doesn't mean sharing secrets.",
    name: "Sample Customer",
    role: "Engineering Lead, placeholder company",
    initials: "EL",
  },
  {
    quote:
      "Being able to replay any run node-by-node made debugging our webhook flows trivial. It's the feature I didn't know I needed.",
    name: "Sample Customer",
    role: "Founder, placeholder company",
    initials: "F",
  },
  {
    quote:
      "flux has become the backbone of how we route support tickets and trading alerts. Self-hosting it was the easy part.",
    name: "Sample Customer",
    role: "Platform Lead, placeholder company",
    initials: "PL",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-border/70 bg-secondary/30 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Placeholder quotes — swap in your own
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
          These are sample cards to preview the layout. Replace them with
          real feedback once you have users.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <div className="brand-card-glow rounded-2xl border border-border p-7 lg:col-span-2">
            <Stars />
            <p className="mt-4 text-lg font-medium leading-relaxed text-balance">
              &ldquo;{FEATURED.quote}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-[var(--brand-violet-100)] text-[var(--brand-violet-600)]">
                  {FEATURED.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{FEATURED.name}</p>
                <p className="text-xs text-muted-foreground">
                  {FEATURED.role}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {OTHERS.slice(0, 2).map((t) => (
              <TestimonialCard key={t.name + t.role} {...t} />
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <TestimonialCard {...OTHERS[2]} />
          <div className="brand-card-glow flex flex-col justify-center rounded-2xl border border-dashed border-border p-7 text-sm text-muted-foreground">
            Your quote could go here. Star the repo and open a discussion if
            you&apos;d like to be featured.
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  initials,
}: {
  quote: string;
  name: string;
  role: string;
  initials: string;
}) {
  return (
    <div className="brand-card-glow rounded-2xl border border-border p-6">
      <Stars small />
      <p className="mt-3 text-sm text-muted-foreground">&ldquo;{quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-2.5">
        <Avatar className="size-8">
          <AvatarFallback className="bg-[var(--brand-violet-100)] text-xs text-[var(--brand-violet-600)]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs font-semibold">{name}</p>
          <p className="text-[11px] text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

function Stars({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-0.5 text-[var(--brand-orange-500)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={small ? "size-3 fill-current" : "size-4 fill-current"}
        />
      ))}
    </div>
  );
}
