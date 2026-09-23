# Vercel build/runtime fix

This revision fixes the `Failed to collect page data` failure caused by database runtime preparation being executed while Next.js imports App Routes during `next build`.

## Changes

- `src/lib/db.ts`
  - Prisma is now initialized lazily through `getPrismaClient()`.
  - Importing an App Route no longer initializes the adapter/database immediately.
- `src/lib/runtime-database.ts`
  - Detects the Next build lifecycle and avoids copying/opening the Vercel `/tmp` SQLite runtime database during build collection.
  - At real Vercel runtime, local SQLite is still copied to `/tmp/changg-changg/dev.db`.
- `src/app/api/**/route.ts`
  - Explicitly uses Node.js runtime.
  - Explicitly marks handlers as `force-dynamic` so Next does not try to statically prerender API handlers.
- `src/app/[locale]/layout.tsx`
  - Marked as `force-dynamic` because this application is session/database driven.
- `next.config.ts`
  - Keeps `prisma/dev.db` in output file tracing so the runtime template database is deployed.

## Important

The `/tmp` database mode is still ephemeral and is intended for demo/testing on Vercel. For persistent production data, set `DATABASE_URL=libsql://...` and `DATABASE_AUTH_TOKEN=...`.
