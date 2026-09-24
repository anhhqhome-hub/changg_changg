import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/password";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
      refreshCache: true,
      strategy: "compact"
    }
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
        defaultValue: "APPROVED",
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
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      immutableUsername: true
    }),
    nextCookies()
  ]
});

export type AuthSession = typeof auth.$Infer.Session;
