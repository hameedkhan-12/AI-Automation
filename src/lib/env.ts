import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string."),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters."),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL."),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL."),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters."),
  POLAR_ACCESS_TOKEN: optionalString,
  POLAR_SUCCESS_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional()
  ),
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  // ─── Trading / Redis ──────────────────────────────────────────────────────
  // Required only when using trading nodes. Safe to leave unset in non-trading
  // deployments — validated at call site, not at startup.
  UPSTASH_REDIS_REST_URL: optionalString,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  // Alpaca paper trading — https://paper-api.alpaca.markets
  ALPACA_API_KEY: optionalString,
  ALPACA_API_SECRET: optionalString,
  ALPACA_BASE_URL: optionalString,
});

export const env = envSchema.parse(process.env);

