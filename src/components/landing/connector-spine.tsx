"use client";

import { Sparkle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const JUNCTIONS = ["12.5%", "37.5%", "62.5%", "87.5%"];

export function ConnectorSpine() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 lg:block"
    >
      <div className="h-full w-px border-l border-dashed border-white/15" />

      <span
        aria-hidden="true"
        className={`absolute left-1/2 top-0 size-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_3px_var(--brand-violet-500)] ${
          inView ? "animate-flow-down" : ""
        }`}
      />

      {JUNCTIONS.map((top) => (
        <div
          key={top}
          aria-hidden="true"
          className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center"
          style={{ top }}
        >
          <span className="h-px w-10 bg-white/15" />
          <Sparkle className="mx-1 size-4 shrink-0 fill-[var(--brand-violet-500)] text-[var(--brand-violet-500)]" />
          <span className="h-px w-10 bg-white/15" />
        </div>
      ))}
    </div>
  );
}