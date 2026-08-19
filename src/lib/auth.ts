import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { polarClient } from "./polar";

const githubClientId = env.GITHUB_CLIENT_ID?.trim();
const githubClientSecret = env.GITHUB_CLIENT_SECRET?.trim();
const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();

const socialProviders = {
  ...(githubClientId && githubClientSecret
    ? {
      github: {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
      },
    }
    : {}),
  ...(googleClientId && googleClientSecret
    ? {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    }
    : {}),
};

const plugins = env.POLAR_ACCESS_TOKEN?.trim()
  ? [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "f81be8a8-45e1-4e45-a1e9-b9d3fd79f814",
              slug: "pro",
            },
          ],
          successUrl: env.POLAR_SUCCESS_URL ?? "http://localhost:3000/dashboard/billing",
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }),
  ]
  : [];

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders,
  plugins,
});
