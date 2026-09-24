# Import V8 - persistent database + end-to-end verification

## Root cause fixed

Vercel fallback SQLite lives under `/tmp`. It is not durable/shared across function instances.
An import could be written by one invocation and then the builder redirect could land on another invocation where that exam did not exist.

V8 therefore:

- blocks exam import when Vercel is still on the ephemeral `/tmp` database;
- accepts `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` aliases for a persistent remote libSQL database;
- shows the database warning directly on the import page instead of crashing after redirect;
- makes the builder handle a missing exam gracefully instead of `findFirstOrThrow()`;
- validates imported questions before writing;
- writes question groups in bounded parallel batches;
- verifies saved question/option counts before redirecting;
- removes a partial exam if persistence fails midway;
- exposes `persistent` and `productionWriteReady` from `/api/health/database`.

## Quizzi Word verification

The supplied 37-page Word test was parsed as:

- 160 questions
- 40 groups
- 160/160 questions with four A-D options
- 159 answers detected from Word underline formatting
- 1 missing answer left for optional AI completion

A local SQLite persistence simulation wrote and read back:

- 1 Exam
- 1 ExamVersion
- 1 Reading section
- 40 QuestionGroup rows
- 160 ExamQuestion rows
- 640 ExamQuestionOption rows
- SQLite `PRAGMA integrity_check = ok`

## Production requirement

Do not use `DATABASE_URL=file:./prisma/dev.db` for persistent production data on Vercel.
Configure a shared libSQL/Turso database before enabling import/CRUD workflows.
