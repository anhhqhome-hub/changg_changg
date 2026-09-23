import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { EMBEDDED_DEMO_DB_BASE64 } from "@/lib/embedded-demo-db";

const VERCEL_RUNTIME_DIR = "/tmp/changg-changg";
const VERCEL_RUNTIME_DB = "/tmp/changg-changg/dev.db";

function isNextBuildPhase() {
  const lifecycle = process.env.npm_lifecycle_event?.toLowerCase();
  return lifecycle === "build" || process.env.NEXT_PHASE === "phase-production-build";
}

function prepareVercelSqlite() {
  if (!existsSync(VERCEL_RUNTIME_DB)) {
    mkdirSync(VERCEL_RUNTIME_DIR, { recursive: true });
    writeFileSync(VERCEL_RUNTIME_DB, Buffer.from(EMBEDDED_DEMO_DB_BASE64, "base64"));
  }

  return `file:${VERCEL_RUNTIME_DB}`;
}

export type ResolvedDatabaseConnection = {
  url: string;
  authToken?: string;
  ephemeral: boolean;
  mode: "local-file" | "vercel-demo" | "remote-libsql" | "other";
};

export function resolveDatabaseConnection(configuredUrl: string, authToken?: string): ResolvedDatabaseConnection {
  const isFileDatabase = configuredUrl.startsWith("file:");
  const isRemoteLibsql = configuredUrl.startsWith("libsql:") || configuredUrl.startsWith("https:");
  const isVercel = process.env.VERCEL === "1";

  // During `next build`, never create runtime files. Prisma is initialized lazily,
  // so the real connection is only needed after a deployed request arrives.
  if (isFileDatabase && isVercel && !isNextBuildPhase()) {
    return {
      url: prepareVercelSqlite(),
      authToken: undefined,
      ephemeral: true,
      mode: "vercel-demo"
    };
  }

  return {
    url: configuredUrl,
    authToken: authToken?.trim() || undefined,
    ephemeral: false,
    mode: isRemoteLibsql ? "remote-libsql" : isFileDatabase ? "local-file" : "other"
  };
}
