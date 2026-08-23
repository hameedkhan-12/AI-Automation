import { WorkflowIcon } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { ORBIT_INTEGRATIONS } from "./constants";

const LEFT = ORBIT_INTEGRATIONS.slice(0, 4);
const RIGHT = ORBIT_INTEGRATIONS.slice(4, 8);

const LEFT_TOPS = ["16%", "37%", "58%", "79%"];
const RIGHT_TOPS = ["16%", "37%", "58%", "79%"];

export function IntegrationOrbit() {
  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-3xl">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 500 313"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {LEFT.map((_, i) => {
          const y = 50 + i * 66;
          return (
            <path
              key={`left-${i}`}
              d={`M 70 ${y} C 170 ${y}, 190 156, 250 156`}
              fill="none"
              stroke="var(--brand-line)"
              strokeWidth="1.5"
              className="animate-orbit-line"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          );
        })}
        {RIGHT.map((_, i) => {
          const y = 50 + i * 66;
          return (
            <path
              key={`right-${i}`}
              d={`M 430 ${y} C 330 ${y}, 310 156, 250 156`}
              fill="none"
              stroke="var(--brand-line)"
              strokeWidth="1.5"
              className="animate-orbit-line"
              style={{ animationDelay: `${i * 0.25 + 0.15}s` }}
            />
          );
        })}
      </svg>

      {LEFT.map((integration, i) => (
        <IconBubble
          key={integration.name}
          integration={integration}
          style={{ left: "14%", top: LEFT_TOPS[i] }}
          delay={i * 0.3}
        />
      ))}
      {RIGHT.map((integration, i) => (
        <IconBubble
          key={integration.name}
          integration={integration}
          style={{ left: "86%", top: RIGHT_TOPS[i] }}
          delay={i * 0.3 + 0.2}
        />
      ))}

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="brand-logo-mark animate-hub-glow flex size-20 items-center justify-center rounded-2xl sm:size-24">
          <WorkflowIcon className="size-9 text-white sm:size-10" strokeWidth={2} />
        </div>
      </div>

      <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-md sm:-bottom-6">
        <span className="flex size-2 items-center justify-center rounded-full bg-emerald-500" />
        <div className="leading-tight">
          <p className="text-xs font-semibold">10+ Integrations</p>
          <p className="text-[11px] text-muted-foreground">
            Connect all your tools
          </p>
        </div>
      </div>
    </div>
  );
}

function IconBubble({
  integration,
  style,
  delay,
}: {
  integration: { name: string; src: string };
  style: CSSProperties;
  delay: number;
}) {
  return (
    <div
      className="animate-bubble-float absolute -translate-x-1/2 -translate-y-1/2"
      style={{ ...style, animationDelay: `${delay}s` }}
    >
      <div className="flex size-11 items-center justify-center rounded-full border border-border bg-card shadow-sm sm:size-12">
        <Image src={integration.src} alt={integration.name} width={20} height={20} />
      </div>
    </div>
  );
}
