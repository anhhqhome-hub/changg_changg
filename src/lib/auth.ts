import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "sqlite"
  }),
  emailAndPassword: {
    enabled: true
  },
  user: {
    additionalFields: {
      role: {
        type: ["ADMIN", "TEACHER", "STUDENT"],
        required: false,
        defaultValue: "STUDENT",
        input: false
      },
      status: {
        type: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
        required: false,
        defaultValue: "PENDING",
        input: false
      },
      preferredLocale: {
        type: "string",
        required: false,
        defaultValue: "vi"
      },
      lastLoginAt: {
        type: "date",
        required: false,
        input: false
      }
    }
  },
  advanced: {
    database: {
      joins: true
    }
  },
  plugins: [nextCookies()]
});

export type AuthSession = typeof auth.$Infer.Session;
