"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

export interface CandleDataPoint {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorOverlay {
  name: string;
  color: string;
  data: { time: number; value: number }[];
}

export interface CandlestickChartProps {
  symbol: string;
  data: CandleDataPoint[];
  indicators?: IndicatorOverlay[];
}

export function CandlestickChart({
  symbol,
  data,
  indicators = [],
}: CandlestickChartProps) {
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
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries: ISeriesApi<"Candlestick"> = chart.addSeries(
      CandlestickSeries,
      {
        upColor: "#00E5A0",
        downColor: "#EF4444",
        borderUpColor: "#00E5A0",
        borderDownColor: "#EF4444",
        wickUpColor: "#00E5A0",
        wickDownColor: "#EF4444",
      },
    );

    const sortedCandles = [...data]
      .sort((a, b) => a.time - b.time)
      .map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    candlestickSeries.setData(sortedCandles);

    // Render each indicator as an overlay LineSeries
    for (const ind of indicators) {
      if (ind.data && ind.data.length > 0) {
        const lineSeries: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 2,
          title: ind.name,
        });

        const sortedLineData = [...ind.data]
          .sort((a, b) => a.time - b.time)
          .map((pt) => ({
            time: pt.time as any,
            value: pt.value,
          }));

        lineSeries.setData(sortedLineData);
      }
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, indicators]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed text-muted-foreground">
        No historical candle data available for {symbol}.
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {indicators.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {indicators.map((ind) => (
            <div key={ind.name} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: ind.color }}
              />
              <span className="text-muted-foreground font-mono">{ind.name}</span>
            </div>
          ))}
        </div>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
