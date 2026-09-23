-- CreateTable
CREATE TABLE "TeacherTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherTask_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TeacherTask_teacherId_completedAt_idx" ON "TeacherTask"("teacherId", "completedAt");

-- CreateIndex
CREATE INDEX "TeacherTask_dueAt_idx" ON "TeacherTask"("dueAt");
