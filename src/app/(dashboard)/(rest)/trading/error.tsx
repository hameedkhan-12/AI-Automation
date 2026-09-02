"use client";

import { TradingLoadError } from "@/features/trading/components/trading-load-error";

export default function TradingError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <TradingLoadError
      detail={
        process.env.NODE_ENV === "development"
          ? error.message
          : error.digest
            ? `Error digest: ${error.digest}`
            : undefined
      }
    />
  );
}
