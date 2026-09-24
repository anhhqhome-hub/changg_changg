# Username login schema fix

The Prisma schema and demo SQLite database include `user.username` and `user.displayUsername`.
The previous archive also included an old generated Prisma Client that predated those fields. Better Auth inspects the Prisma client schema, so local development could report `SCHEMA_MISMATCH` even though the SQLite columns existed.

This archive removes committed `generated/prisma` output and regenerates it automatically:

- `postinstall`: `prisma generate`
- `predev`: `prisma db push && prisma generate`
- `build`: `prisma generate && next build`
- manual sync: `pnpm db:sync`

After extracting over an old working directory, delete `.next` once or use a clean folder, then run `pnpm install` and `pnpm dev`.
