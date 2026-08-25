"use client";

import { useEffect, useRef, useState } from "react";

const BARS = [
  { top: "20%", fill: "100%" },
  { top: "48%", fill: "100%" },
  { top: "74%", fill: "100%" },
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
    <div ref={ref} className="relative w-full max-w-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero/download (10).svg"
        alt="Marketing automation mockup: automation start, outbound email, and mobile notification steps"
        className="w-full drop-shadow-2xl"
      />

      {BARS.map((bar, i) => (
        <div
          key={bar.top}
          className="absolute left-[29%] h-[4%] w-[60%] overflow-hidden mt-3"
          style={{ top: bar.top }}
        >
          <div
            className="h-full bg-gradient-to-r from-white/90 to-[var(--brand-violet-500)] transition-[width] duration-[1400ms] ease-out"
            style={{
              width: inView ? bar.fill : "0%",
              transitionDelay: `${i * 200}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}