import { SparklesIcon } from "lucide-react";
import { ConnectorSpine } from "./connector-spine";
import { ScrollFillCard } from "./scroll-card";

type Row = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  imageOnRight: boolean;
  content?: "scroll-fill-card" | "orbit-card";
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
    title: "Personalized AI Marketing",
    description:
      "Engage customers with tailored messages delivered at the right time — one trigger fans out to email, mobile push, and more, each tracked independently.",
    imageOnRight: false,
    content: "scroll-fill-card",
  },
  {
    title: "CRM Automation",
    description:
      "Automatically capture, qualify, and route leads to the right person on your team, based on rules you define once on the canvas.",
    imageOnRight: true,
    content: "orbit-card",
  },
];

const ORBIT_PHOTOS = [
  {
    src: "/images/person (3).png",
    alt: "Team member",
    top: "73%",
    left: "55%",
  },
  {
    src: "/images/person1.png",
    alt: "Team member",
    top: "33%",
    left: "43%",
  },
  {
    src: "/images/person (1).png",
    alt: "Team member",
    top: "40%",
    left: "71%",
  },
  {
    src: "/images/person (2).png",
    alt: "Team member",
    top: "63%",
    left: "29%",
  },
];

export function FeaturesBento() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <span className="brand-ring-border mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80">
          <SparklesIcon className="size-3 text-[var(--brand-orange-500)]" />
          AI-Driven Solutions
        </span>
        <h2 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Build automated AI workflows
        </h2>
        <p className="mt-3 text-muted-foreground">
          Connect your favorite apps, set simple triggers, and let flux run
          tasks for you — no coding required.
        </p>
      </div>

      <div className="relative mt-16">
        <ConnectorSpine />

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
                {row.content === "scroll-fill-card" && <ScrollFillCard />}
                {row.content === "orbit-card" && <OrbitCard />}
                {!row.content && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.image}
                    alt={row.imageAlt}
                    className="w-full max-w-md drop-shadow-2xl"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrbitCard() {
  return (
    <div className="relative w-full max-w-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero/download (13).svg"
        alt="CRM automation mockup: contacts orbiting a routing hub"
        className="w-full drop-shadow-2xl"
      />
      <div className="animate-orbit-spin absolute inset-0">
        {ORBIT_PHOTOS.map((photo) => (
          <div
            key={photo.src}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: photo.top, left: photo.left }}
          >
            <div className="animate-orbit-spin-reverse">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                className="size-12 rounded-full border-2 border-white/20 object-cover shadow-md"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}