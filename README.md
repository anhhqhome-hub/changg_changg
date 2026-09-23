# changg changg

`changg changg` is a production-shaped MVP for English teachers and students in Vietnam. It includes authentication, RBAC, student approval, class management, a reusable question bank, versioned exams, autosave attempts, grading, results, analytics, notifications, local media storage, i18n, and tests.

## Stack

- Next.js 16 App Router, React, TypeScript strict mode
- Tailwind CSS with shadcn-style local UI primitives
- Prisma ORM 7, SQLite, Better Auth
- Zod, React Hook Form-ready form architecture, Recharts, Lucide icons
- Vitest unit tests and Playwright E2E tests

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

If your global pnpm requires a newer Node version, run commands through the pinned project version:

```bash
npx pnpm@10.20.0 install
```

Open `http://localhost:3000/vi`.

## Seed Accounts

Passwords come from environment variables. The fallback development password is `ChangeMe123!`.

- Admin: `admin@trangg.local`
- Teacher: `trang.teacher@trangg.local`
- Student: `minhanh@student.trangg.local`
- Pending student: `pending@student.trangg.local`

Do not use fallback passwords outside local development.

## Scripts

- `pnpm dev`: start local development server
- `pnpm build`: production build
- `pnpm start`: run production server
- `pnpm lint`: ESLint
- `pnpm typecheck`: TypeScript
- `pnpm test`: Vitest unit tests
- `pnpm test:e2e`: Playwright critical path tests
- `pnpm db:generate`: generate Prisma Client
- `pnpm db:migrate`: apply the checked-in Prisma-generated SQLite migration SQL
- `pnpm db:seed`: seed realistic demo data
- `pnpm db:studio`: inspect SQLite data

## Architecture

Important folders:

- `src/app/[locale]`: locale-aware App Router pages for public, admin, teacher, and student areas
- `src/actions`: server actions for auth, admin, teacher, and student workflows
- `src/domain`: pure business logic for timing, grading, scoring, analytics, answer validation, permissions
- `src/lib`: auth, Prisma, env validation, storage, rate limiting, date formatting
- `src/components`: brand system, UI primitives, shell, analytics, exam runner
- `prisma`: schema and seed data
- `tests`: unit and E2E tests

## Auth And RBAC

Better Auth provides email/password signup, login, logout, sessions, secure password handling, and the mounted auth route at `app/api/auth/[...all]/route.ts`. The app extends the Better Auth user with:

- `role`: `ADMIN`, `TEACHER`, `STUDENT`
- `status`: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `preferredLocale`
- `lastLoginAt`

Protected layouts call server-side `requireRole()`. Pending, rejected, and suspended users are redirected before reaching protected features. Admin actions create audit log rows.

## Exam Architecture

The data model uses:

`Exam -> ExamVersion -> ExamSection -> QuestionGroup -> ExamQuestion -> ExamQuestionOption`

Teachers build drafts from reusable `QuestionBankItem` records. Published versions snapshot question text, options, correct answers, points, rubrics, and settings so later edits do not alter completed or in-progress attempts.

Supported question types include single choice, multiple choice, true/false, fill blank, short answer, essay, matching, ordering, listening variants, speaking recording, and reading variants. Objective grading is implemented server-side.

## Timing, Autosave, And Submission

When an attempt starts, the server calculates `expiresAt` as the earliest of `startedAt + timeLimitMinutes` and the exam deadline. Autosave posts to authenticated route handlers and rejects changes after expiry or submission. Submit is idempotent for already-closed attempts, calculates objective scores server-side, and moves manual items into grading.

## File Uploads

Media uses a `StorageProvider` interface with `LocalStorageProvider` for MVP. Uploads are stored under `storage/uploads` and excluded from git. Media browser access goes through authenticated route handlers; absolute filesystem paths are never exposed.

## SQLite Note

SQLite is intentionally used for this MVP. A local SQLite file requires persistent disk. It is not reliable on ephemeral/serverless filesystems unless the platform provides durable storage. Business logic, analytics, authorization, and storage are separated so the app can migrate later to PostgreSQL plus S3-compatible object storage. For production, also replace the in-memory rate limiter with Redis or another shared store.

This workspace uses Prisma ORM 7 with the libSQL SQLite driver adapter. The checked-in migration SQL was generated from the Prisma schema; `pnpm db:migrate` applies it through the local `sqlite3` CLI so the project remains runnable on Windows machines without native C++ build tools.

## Tests

Unit tests cover:

- exam expiry calculation
- submission status calculation
- automatic grading
- fill blank normalization
- permission rules
- analytics aggregation and no-data safety

Playwright includes a critical public route smoke test. Extend it after seeding to cover the full approval-to-result path with persisted accounts.

## Known MVP Limits

- The builder supports adding bank questions and publishing, but drag/drop reordering and inline rich editing are intentionally minimal.
- Listening seed data shows the media pathway but does not generate copyrighted or synthetic audio automatically.
- E2E coverage is a starting point; full multi-role browser tests should be expanded in Phase 2.

## Phase 2

- Rich drag/drop exam builder with inline editors
- Redis-backed rate limiting and background job queue
- S3-compatible protected media storage
- Email notification channel
- More granular rubrics and grade revision history UI
- Full Playwright scenarios for student registration, admin approval, assignment, autosave, grading, and result release

## Vercel zero-config SQLite demo mode

The app keeps SQLite for local development. When Vercel runs with a `file:` `DATABASE_URL`, the server automatically copies the bundled `prisma/dev.db` template to `/tmp/changg-changg/dev.db` and uses that writable copy. `BETTER_AUTH_URL` is also derived from Vercel when it is missing or still points to localhost, and local uploads are redirected to `/tmp/changg-changg/uploads`.

This mode is intended for demos and smoke tests only: Vercel `/tmp` storage is ephemeral and is not shared across instances, so database writes and uploaded files are not durable. For persistent production data, set `DATABASE_URL` to a remote `libsql://...` URL and optionally set `DATABASE_AUTH_TOKEN`; no code change is required.

## Vercel demo database diagnostics

When `DATABASE_URL` still uses `file:...` on Vercel, this revision boots a demo SQLite database in `/tmp` from an embedded template. This is intended only for demos/testing because Vercel function-local filesystem state is not durable or shared.

After deployment, open:

```text
/api/health/database
```

Expected demo response:

```json
{
  "ok": true,
  "databaseMode": "vercel-demo",
  "ephemeral": true,
  "hasSeedUser": true
}
```

For persistent deployment, configure a shared libSQL/Turso database:

```env
DATABASE_URL="libsql://..."
DATABASE_AUTH_TOKEN="..."
```
