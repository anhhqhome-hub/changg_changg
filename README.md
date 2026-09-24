# changg changg

`changg changg` is a school learning and assessment MVP built with Next.js 16, Prisma 7, SQLite/libSQL and Better Auth.

## Business model

The application uses username-only accounts with student self-registration:

- Users sign in with **username + password only**. End users are never asked for an email address.
- **Student** self-registers with full name, username, password, school, and class. No email is collected; the school year is automatic.
- **Admin** creates schools and has full CRUD over every account (admin/teacher/student), including reset password and account status. Academic-year rows are created automatically when the current school year changes.
- **Teacher** creates classes inside their assigned school. Every new class is automatically attached to the current school year; teachers do not choose the year manually.
- **Student** chooses their school and class during self-registration. Only classes in the current school year are available.
- **Teacher** can still adjust class membership later for transfers/corrections, but does not create or reset student accounts.
- Exams have two modes:
  - `TEST`: attempt-limited assessment.
  - `PRACTICE`: unlimited attempts; every attempt is retained so progress can be measured over time.
- Teacher reports can be filtered by academic year, class, or student and exported to Excel. The export separates test results and the full practice-attempt history.

Better Auth still requires an email-shaped field in its user storage. The app generates an internal value such as `username@local.invalid`; it is implementation detail only and is not used as a login identifier.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict mode
- Prisma ORM 7 with SQLite/libSQL adapter
- Better Auth with username plugin
- Tailwind CSS, Recharts, Lucide icons
- Vitest and Playwright

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000/vi`.

## Demo accounts

The bundled demo database uses the fallback password `ChangeMe123!`:

- Admin: `admin`
- Teacher: `trang.teacher`
- Students: `minhanh`, `giahuy`, `khanhlinh`, `ducanh`

Do not use the fallback password outside a demo environment.

## Main workflows

### Admin

1. Create a school.
2. The app automatically creates/activates the current school year (for example `2026-2027`). No manual year selection is required for operational flows.
3. Manage all accounts: create, edit username/name, assign role/status/school, reset password, or delete.
4. Review system audit logs.

### Teacher

1. Create a class. The class is automatically tied to the teacher's school and the current school year.
2. Search students who already self-registered and add them to the class. Unassigned students inherit the class school.
3. Create an exam and choose `TEST` or `PRACTICE`.
4. Publish and assign the exam to a class or one of the teacher's students.
5. Review student analytics.
6. Open **Reports** to filter by year/class/student and export Excel.

### Student

- Self-register with full name, username, password, school, and class. The academic year is selected automatically by the system.
- Sign in with username and password.
- `TEST`: can only start while attempts remain.
- `PRACTICE`: can repeat indefinitely. Each run receives an increasing attempt number and remains in history.
- View results and progress over repeated practice.

## Reporting model

Each `ExamAttempt` is retained with its `attemptNumber`, score, elapsed time, assignment, class, and academic year. Reports calculate:

- number of completed tests
- average test percentage
- number of practice attempts
- best practice percentage
- practice improvement from first to latest attempt
- full attempt history for audit/export

Excel export contains `Tong hop`, `Kiem tra`, and `Luyen tap` sheets.

## Scripts

- `pnpm dev` – local development
- `pnpm build` – Prisma generate + Next.js production build
- `pnpm typecheck` – TypeScript checking
- `pnpm test` – Vitest unit tests
- `pnpm test:e2e` – Playwright smoke/critical paths
- `pnpm db:generate` – generate Prisma Client
- `pnpm db:migrate` – apply checked-in SQLite migrations
- `pnpm db:seed` – recreate demo data
- `pnpm db:studio` – inspect data

## Vercel demo database

For a zero-config demo, when Vercel receives a `file:` database URL the app restores the bundled SQLite template to `/tmp/changg-changg/dev.db`. This is suitable only for demos because `/tmp` is ephemeral and not shared between function instances.

For persistent production data, configure a shared libSQL/Turso database:

```env
DATABASE_URL="libsql://..."
DATABASE_AUTH_TOKEN="..."
```

The Prisma schema remains SQLite-compatible, so no application-code rewrite is required.

Diagnostic endpoint:

```text
/api/health/database
```

## File uploads

The current local storage provider writes to `storage/uploads` locally and `/tmp` in the Vercel demo. Production should use durable object storage such as S3-compatible storage or Vercel Blob.

## Account workflow

Students self-register with username/password and choose their school/class at `/vi/register` or `/en/register`; the current school year is assigned automatically. Teachers can adjust class membership for transfers/corrections but do not create student accounts. Administrators have full account CRUD at `/vi/admin/users` (or the corresponding locale route). The `email` field used internally by Better Auth is generated automatically and is not part of the user-facing workflow.
