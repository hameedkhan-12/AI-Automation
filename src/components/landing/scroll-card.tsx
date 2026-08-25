"use client";

import { BellIcon, MailIcon, SettingsIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

const ROWS = [
  { label: "Automation Start", icon: SettingsIcon, fill: "100%" },
  { label: "Outbound Email", icon: MailIcon, fill: "100%" },
  { label: "Mobile Notification", icon: BellIcon, fill: "100%" },
];

export function ScrollFillCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="brand-mesh relative w-full max-w-md overflow-hidden rounded-2xl p-5 shadow-2xl"
      style={{ "--mesh-via-pos": "60%" } as CSSProperties}
    >
      <div className="flex flex-col gap-3">
        {ROWS.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center gap-3 rounded-xl bg-black/25 px-3.5 py-3 backdrop-blur-sm"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <row.icon className="size-4 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 truncate text-xs font-semibold text-white">
                {row.label}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-1400 ease-out"
                  style={{
                    width: inView ? row.fill : "0%",
                    transitionDelay: `${i * 180}ms`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}