"use client";

import dynamic from "next/dynamic";

export const EquityChart = dynamic(
  () => import("./equity-chart").then((mod) => mod.EquityChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
        Loading chart...
      </div>
    ),
  }
);