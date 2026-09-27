CREATE TABLE "TeacherSchool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherProfileId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherSchool_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TeacherSchool_teacherProfileId_schoolId_key" ON "TeacherSchool"("teacherProfileId", "schoolId");
CREATE INDEX "TeacherSchool_schoolId_idx" ON "TeacherSchool"("schoolId");

INSERT INTO "TeacherSchool" ("id", "teacherProfileId", "schoolId")
SELECT lower(hex(randomblob(16))), "id", "schoolId"
FROM "TeacherProfile"
WHERE "schoolId" IS NOT NULL;
