"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";

interface EquityPoint {
  timestamp: number;
  equity: number;
}

interface EquityChartProps {
  data: EquityPoint[];
}

export function EquityChart({ data }: EquityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 320,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const areaSeries: ISeriesApi<"Area"> = chart.addAreaSeries({
      lineColor: "#00E5A0",
      topColor: "rgba(0, 229, 160, 0.3)",
      bottomColor: "rgba(0, 229, 160, 0.0)",
      lineWidth: 2,
    });

    const sortedData = [...data]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((pt) => ({
        time: Math.floor(pt.timestamp / 1000) as any,
        value: pt.equity,
      }));

    areaSeries.setData(sortedData);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full" />;
}
