import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const VERCEL_RUNTIME_DIR = "/tmp/changg-changg";
const VERCEL_RUNTIME_DB = path.join(VERCEL_RUNTIME_DIR, "dev.db");

function filePathFromDatabaseUrl(url: string) {
  const value = url.slice("file:".length);
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function findTemplateDatabase(configuredUrl: string) {
  const candidates = [
    filePathFromDatabaseUrl(configuredUrl),
    path.resolve(process.cwd(), "prisma/dev.db"),
    path.resolve(process.cwd(), "dev.db")
  ];

  return candidates.find((candidate) => candidate !== VERCEL_RUNTIME_DB && existsSync(candidate));
}

function prepareVercelSqlite(configuredUrl: string) {
  if (!existsSync(VERCEL_RUNTIME_DB)) {
    const template = findTemplateDatabase(configuredUrl);
    if (!template) {
      throw new Error(
        "SQLite template database was not found. Keep prisma/dev.db in the deployment or configure a persistent libsql DATABASE_URL."
      );
    }

    mkdirSync(VERCEL_RUNTIME_DIR, { recursive: true });
    copyFileSync(template, VERCEL_RUNTIME_DB);
  }

  return `file:${VERCEL_RUNTIME_DB}`;
}

export function resolveDatabaseConnection(configuredUrl: string, authToken?: string) {
  const isFileDatabase = configuredUrl.startsWith("file:");
  const isVercel = process.env.VERCEL === "1";

  if (isFileDatabase && isVercel) {
    return {
      url: prepareVercelSqlite(configuredUrl),
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
