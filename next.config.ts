import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    INNGEST_BASE_URL:
      process.env.INNGEST_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api.inngest.com"
        : "http://localhost:8288"),
    INNGEST_DEV: process.env.NODE_ENV === "production" ? "false" : "true",
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "enra-doo",
  project: "flux",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true
});