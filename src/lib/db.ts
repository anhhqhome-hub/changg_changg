import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { resolveDatabaseConnection } from "@/lib/runtime-database";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connection = resolveDatabaseConnection(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);

const adapter = new PrismaLibSql({
  url: connection.url,
  authToken: connection.authToken
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
