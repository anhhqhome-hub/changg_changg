-- Add an optional public token for teacher-shared practice links.
ALTER TABLE "ExamVersion" ADD COLUMN "practiceShareToken" TEXT;

CREATE UNIQUE INDEX "ExamVersion_practiceShareToken_key" ON "ExamVersion"("practiceShareToken");
