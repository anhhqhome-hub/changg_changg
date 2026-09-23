import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

// Keep every filesystem path statically scoped. Turbopack can then trace only
// prisma/dev.db instead of conservatively including the whole project.
const PROJECT_TEMPLATE_DB = path.join(process.cwd(), "prisma", "dev.db");
const VERCEL_RUNTIME_DIR = "/tmp/changg-changg";
const VERCEL_RUNTIME_DB = "/tmp/changg-changg/dev.db";

function isNextBuildPhase() {
  const lifecycle = process.env.npm_lifecycle_event?.toLowerCase();
  return lifecycle === "build" || process.env.NEXT_PHASE === "phase-production-build";
}

function prepareVercelSqlite() {
  if (!existsSync(VERCEL_RUNTIME_DB)) {
    if (!existsSync(PROJECT_TEMPLATE_DB)) {
      throw new Error(
        "SQLite template database was not found at prisma/dev.db. Keep prisma/dev.db in the deployment or configure a persistent libsql DATABASE_URL."
      );
    }

    mkdirSync(VERCEL_RUNTIME_DIR, { recursive: true });
    copyFileSync(PROJECT_TEMPLATE_DB, VERCEL_RUNTIME_DB);
  }

  return `file:${VERCEL_RUNTIME_DB}`;
}

export function resolveDatabaseConnection(configuredUrl: string, authToken?: string) {
  const isFileDatabase = configuredUrl.startsWith("file:");
  const isVercel = process.env.VERCEL === "1";

  // Next imports route/server modules while collecting build metadata.
  // Runtime filesystem preparation happens only after deployment receives a request.
  if (isFileDatabase && isVercel && !isNextBuildPhase()) {
    return {
      url: prepareVercelSqlite(),
      authToken: undefined,
      ephemeral: true
    };
  }

  return {
    url: configuredUrl,
    authToken: authToken?.trim() || undefined,
    ephemeral: false
  };
}
