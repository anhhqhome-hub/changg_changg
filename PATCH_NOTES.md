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

## V3 - Turbopack filesystem tracing fix

- Removed dynamic `path.resolve(process.cwd(), value)` filesystem resolution from `runtime-database.ts`.
- Vercel SQLite fallback now copies only the statically known `prisma/dev.db` template to `/tmp/changg-changg/dev.db`.
- `next.config.ts` keeps `prisma/dev.db` in `outputFileTracingIncludes`, so the runtime template is explicitly bundled.
- Removed the accidental empty root-level `dev.db`; `prisma/dev.db` is the only SQLite template.

## V4 - runtime error hardening

- Embedded the demo SQLite template in the server bundle; Vercel no longer depends on tracing `prisma/dev.db` into each function.
- Vercel demo instances materialize the embedded DB into `/tmp/changg-changg/dev.db` on first database access.
- Enabled Better Auth signed session cookie caching to make session reads less dependent on the same ephemeral function instance.
- Founder/site settings now fail soft so a decorative DB read cannot take down the login page.
- Added `/api/health/database` for safe database diagnostics (no secrets are returned).
- Error UI now prints the Next.js digest and logs the client error to the browser console.

For durable production writes, use a shared remote database (`libsql://...`/Turso or another persistent SQL service). Vercel `/tmp` remains demo-only storage.

## V5 - TypeScript stack overflow fix

- Replaced the generated `embedded-demo-db.ts` chain containing thousands of `+` binary expressions with a JSON-backed Base64 asset.
- This avoids `RangeError: Maximum call stack size exceeded` in TypeScript 5.9.x during Next.js production type checking.
- The embedded SQLite bytes are unchanged and still initialize the Vercel `/tmp` demo database at runtime.
