# Persistent database setup for Vercel

The application can open with the bundled `/tmp` SQLite demo database, but Vercel Function filesystems are not durable/shared. Any workflow that writes data and then performs another request (exam import, account CRUD, assignments, grades, etc.) needs a shared database.

## Recommended: import the ready demo SQLite database into Turso

The repository already contains `prisma/dev.db` with the current schema and demo accounts.

```bash
# Install/login to the Turso CLI, then from the project root:
turso db import ./prisma/dev.db
```

The imported database will be named from the file unless you choose another name.

Get its connection URL and create a database token with the Turso CLI/dashboard, then configure Vercel:

```env
TURSO_DATABASE_URL="libsql://YOUR-DATABASE.turso.io"
TURSO_AUTH_TOKEN="YOUR_DATABASE_TOKEN"
```

You can instead set the equivalent generic names:

```env
DATABASE_URL="libsql://YOUR-DATABASE.turso.io"
DATABASE_AUTH_TOKEN="YOUR_DATABASE_TOKEN"
```

Do **not** leave Vercel production on `DATABASE_URL=file:./prisma/dev.db` if you expect writes to persist.

After changing Vercel Environment Variables, redeploy and verify:

```text
/api/health/database
```

For a production-ready deployment the JSON should include:

```json
{
  "ok": true,
  "ephemeral": false,
  "persistent": true,
  "productionWriteReady": true
}
```

Then import the Word exam again.
