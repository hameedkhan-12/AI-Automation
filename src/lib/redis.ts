import "server-only";
import { Redis } from "@upstash/redis";

// Mirrors the singleton pattern in src/lib/db.ts.
// @upstash/redis is HTTP-based — no persistent TCP pool, safe in
// serverless / Next.js API routes.
const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
