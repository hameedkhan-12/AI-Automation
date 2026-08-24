import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f1a2853e6bb4b74c72976cd5c3b37dd9@o4507629901053952.ingest.de.sentry.io/4510150041337936",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  tracesSampleRate: 1,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,

  replaysOnErrorSampleRate: 1.0,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;