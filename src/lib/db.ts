import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { resolveDatabaseConnection } from "@/lib/runtime-database";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connection = resolveDatabaseConnection(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);
  const adapter = new PrismaLibSql({
    url: connection.url,
    authToken: connection.authToken
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Next.js imports App Routes while collecting build metadata. Exporting a lazy
// proxy prevents database/filesystem setup merely because a route module is imported.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  }
});
