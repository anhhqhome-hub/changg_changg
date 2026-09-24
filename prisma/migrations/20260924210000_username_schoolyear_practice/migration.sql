-- Username-only account UX (email remains an internal Better Auth credential field).
ALTER TABLE "user" ADD COLUMN "username" TEXT;
ALTER TABLE "user" ADD COLUMN "displayUsername" TEXT;
-- Backfill existing accounts from the local-part of their legacy email.
UPDATE "user"
SET "username" = lower(substr("email", 1, instr("email", '@') - 1)),
    "displayUsername" = substr("email", 1, instr("email", '@') - 1)
WHERE "username" IS NULL AND instr("email", '@') > 1;
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
-- Email is retained only as a Better Auth internal compatibility field.
UPDATE "user" SET "email" = "username" || '@local.invalid', "emailVerified" = true WHERE "username" IS NOT NULL;

-- Teachers belong to a school.
ALTER TABLE "TeacherProfile" ADD COLUMN "schoolId" TEXT REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "TeacherProfile_schoolId_idx" ON "TeacherProfile"("schoolId");

-- Academic years separate classes and reporting periods.
CREATE TABLE "AcademicYear" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "startDate" DATETIME,
  "endDate" DATETIME,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");
INSERT INTO "AcademicYear" ("id", "name", "startDate", "endDate", "active", "updatedAt")
VALUES ('ay_2026_2027', '2026-2027', '2026-08-01T00:00:00.000Z', '2027-05-31T16:59:59.000Z', true, CURRENT_TIMESTAMP);

ALTER TABLE "Class" ADD COLUMN "schoolId" TEXT REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Class" ADD COLUMN "academicYearId" TEXT REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");
CREATE INDEX "Class_academicYearId_idx" ON "Class"("academicYearId");
CREATE UNIQUE INDEX "Class_teacherId_name_academicYearId_key" ON "Class"("teacherId", "name", "academicYearId");
UPDATE "Class" SET "academicYearId" = 'ay_2026_2027' WHERE "academicYearId" IS NULL;
UPDATE "Class"
SET "schoolId" = (
  SELECT sp."schoolId"
  FROM "ClassMembership" cm
  JOIN "StudentProfile" sp ON sp."userId" = cm."studentId"
  WHERE cm."classId" = "Class"."id" AND sp."schoolId" IS NOT NULL
  LIMIT 1
)
WHERE "schoolId" IS NULL;
UPDATE "TeacherProfile"
SET "schoolId" = (SELECT c."schoolId" FROM "Class" c WHERE c."teacherId" = "TeacherProfile"."userId" AND c."schoolId" IS NOT NULL LIMIT 1)
WHERE "schoolId" IS NULL;

-- TEST is attempt-limited, PRACTICE is unlimited and all attempts are retained.
ALTER TABLE "ExamVersion" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'TEST';

-- Store the reporting period directly on assignments so individual assignments can still be reported by year.
ALTER TABLE "ExamAssignment" ADD COLUMN "academicYearId" TEXT REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ExamAssignment_academicYearId_idx" ON "ExamAssignment"("academicYearId");
UPDATE "ExamAssignment"
SET "academicYearId" = COALESCE(
  (SELECT c."academicYearId" FROM "Class" c WHERE c."id" = "ExamAssignment"."classId"),
  'ay_2026_2027'
)
WHERE "academicYearId" IS NULL;
