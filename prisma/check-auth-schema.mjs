import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const schemaPath = path.resolve("prisma/schema.prisma");
const dbPath = path.resolve("prisma/dev.db");

if (!existsSync(schemaPath)) throw new Error("Missing prisma/schema.prisma");
if (!existsSync(dbPath)) {
  console.log("[auth-schema] prisma/dev.db not found; Prisma will create/sync it during dev.");
  process.exit(0);
}

try {
  const rows = execFileSync("sqlite3", [dbPath, "PRAGMA table_info('user');"], { encoding: "utf8" });
  const hasUsername = rows.includes("|username|");
  const hasDisplayUsername = rows.includes("|displayUsername|");
  if (!hasUsername || !hasDisplayUsername) {
    console.error("[auth-schema] Local DB is missing Better Auth username columns. Run: pnpm db:sync");
    process.exit(1);
  }
  console.log("[auth-schema] Better Auth username columns are present.");
} catch {
  console.log("[auth-schema] sqlite3 CLI unavailable; skipped DB column check. Prisma db:sync remains the source of truth.");
}
