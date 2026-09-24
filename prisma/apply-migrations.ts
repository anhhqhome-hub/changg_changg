import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function sqlitePathFromUrl(url: string) {
  if (!url.startsWith("file:")) throw new Error("Only file: SQLite DATABASE_URL values are supported by this MVP migrator.");
  const value = url.slice("file:".length);
  return path.resolve(value.replace(/^.\//, ""));
}

async function main() {
  const dbPath = sqlitePathFromUrl(process.env.DATABASE_URL ?? "file:./prisma/dev.db");
  const migrationsRoot = path.resolve("prisma/migrations");
  const applied = new Set<string>();
  if (existsSync(dbPath)) {
    const result = spawnSync("sqlite3", [dbPath, 'SELECT "name" FROM "_trangg_migrations";'], {
      encoding: "utf8"
    });
    if (result.status === 0) {
      for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) applied.add(line.trim());
    }
  }
  const migrationDirs = (await readdir(migrationsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const dir of migrationDirs) {
    if (applied.has(dir)) continue;
    const sql = await readFile(path.join(migrationsRoot, dir, "migration.sql"), "utf8");
    const input = `
      PRAGMA foreign_keys = ON;
      BEGIN;
      ${sql}
      CREATE TABLE IF NOT EXISTS "_trangg_migrations" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO "_trangg_migrations" ("name") VALUES ('${dir.replaceAll("'", "''")}');
      COMMIT;
    `;
    const result = spawnSync("sqlite3", [dbPath], { input, encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || `sqlite3 exited with ${result.status}`);
    }
    console.log(`Applied migration ${dir}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
