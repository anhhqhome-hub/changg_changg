# Vercel SQLite fix

This build fixes the Vercel crash caused by trying to open `file:./prisma/dev.db` inside the read-only deployment filesystem.

## What changed

- Added `src/lib/runtime-database.ts`.
- On Vercel, a `file:` database is copied automatically to `/tmp/changg-changg/dev.db` before Prisma connects.
- `BETTER_AUTH_URL` automatically uses the Vercel deployment URL when it is missing or still set to localhost.
- Local uploads automatically use `/tmp/changg-changg/uploads` on Vercel to avoid write failures.
- Added optional `DATABASE_AUTH_TOKEN` so the same code can later use a persistent `libsql://` database without source changes.
- Added standard Prisma 7 config at `prisma.config.ts`.
- `npm/pnpm build` now runs `prisma generate` before `next build`.

## Important

Zero-config Vercel SQLite mode is ephemeral. It is suitable for demos and smoke tests, not durable production data. For persistent production usage, set a remote `libsql://...` `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.
