import "dotenv/config";
import { createProvisionedUser, normalizeUsername } from "../src/lib/accounts";
import { prisma } from "../src/lib/db";
import { gradeObjectiveAnswer } from "../src/domain/grading";
import { calculateFinalScore, calculateTotalPoints } from "../src/domain/scoring";

async function createUser(input: {
  name: string;
  username: string;
  password: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  preferredLocale?: "vi" | "en";
}) {
  const username = normalizeUsername(input.username);
  const existing = await prisma.user.findUnique({ where: { username } });
  let user = existing;
  if (!user) {
    user = await createProvisionedUser({
      name: input.name,
      username,
      password: input.password,
      role: input.role,
      preferredLocale: input.preferredLocale ?? "vi"
    }) as never;
  }
  return prisma.user.update({
    where: { id: user.id },
    data: {
      name: input.name,
      username,
      displayUsername: input.username,
      role: input.role,
      status: input.status,
      preferredLocale: input.preferredLocale ?? "vi",
      emailVerified: true
    }
  });
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const teacherPassword = process.env.SEED_TEACHER_PASSWORD ?? "ChangeMe123!";
  const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "ChangeMe123!";

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.criterionGrade.deleteMany();
  await prisma.manualGrade.deleteMany();
  await prisma.attemptAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.examAssignment.deleteMany();
  await prisma.examQuestionOption.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.questionGroup.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.examVersion.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.rubricCriterion.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.questionBankOption.deleteMany();
  await prisma.questionBankItem.deleteMany();
  await prisma.readingPassage.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.classMembership.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacherTask.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.school.deleteMany();

  const admin = await createUser({
    name: process.env.SEED_ADMIN_NAME ?? "Admin trangg",
    username: process.env.SEED_ADMIN_USERNAME ?? "admin",
    password: adminPassword,
    role: "ADMIN",
    status: "APPROVED"
  });
  const teacher = await createUser({
    name: "Trang Nguyen",
    username: process.env.SEED_TEACHER_USERNAME ?? "trang.teacher",
    password: teacherPassword,
    role: "TEACHER",
    status: "APPROVED"
  });
  await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      teacherCode: "TCH-TRANG",
      displayName: "Ms. Trang",
      specialization: "IELTS Foundation, secondary English"
    }
  });

  const schoolInputs = [
    { name: "THCS Nguyen Trai", code: "NT-JHS", address: "Ha Noi" },
    { name: "THPT Le Quy Don", code: "LQD-HS", address: "Da Nang" },
    { name: "THPT Tran Phu", code: "TP-HS", address: "Ho Chi Minh City" },
    { name: "THCS Nguyen Hue", code: "NH-JHS", address: "Hue" }
  ];
  const schools = new Map<string, { id: string; name: string }>();
  for (const school of schoolInputs) {
    const created = await prisma.school.create({ data: school });
    schools.set(created.name, created);
  }

  const academicYear = await prisma.academicYear.create({
    data: {
      name: "2026-2027",
      startDate: new Date("2026-08-01T00:00:00+07:00"),
      endDate: new Date("2027-05-31T23:59:59+07:00"),
      active: true
    }
  });
  const teacherSchool = schools.get("THCS Nguyen Trai")!;
  await prisma.teacherProfile.update({ where: { userId: teacher.id }, data: { schoolId: teacherSchool.id } });

  const studentInputs = [
    ["Nguyen Minh Anh", "minhanh", "Grade 9", "THCS Nguyen Trai"],
    ["Tran Gia Huy", "giahuy", "Grade 10", "THCS Nguyen Trai"],
    ["Le Khanh Linh", "khanhlinh", "Grade 11", "THCS Nguyen Trai"],
    ["Pham Duc Anh", "ducanh", "Grade 9", "THCS Nguyen Trai"]
  ] as const;
  const students = [];
  for (const [name, username, gradeLevel, schoolName] of studentInputs) {
    const student = await createUser({ name, username, password: studentPassword, role: "STUDENT", status: "APPROVED" });
    const school = schools.get(schoolName);
    await prisma.studentProfile.upsert({
      where: { userId: student.id },
      update: { gradeLevel, schoolName, schoolId: school?.id },
      create: {
        userId: student.id,
        studentCode: `HS-${username.toUpperCase()}`,
        gradeLevel,
        schoolId: school?.id,
        schoolName,
        englishLevel: "A2"
      }
    });
    students.push(student);
  }
  const classA = await prisma.class.create({ data: { name: "IELTS Foundation A1", description: "Evening class for A2-B1 learners.", teacherId: teacher.id, schoolId: teacherSchool.id, academicYearId: academicYear.id } });
  const classB = await prisma.class.create({ data: { name: "Grade 9 English", description: "School-life and exam practice.", teacherId: teacher.id, schoolId: teacherSchool.id, academicYearId: academicYear.id } });
  await prisma.classMembership.createMany({
    data: [
      { classId: classA.id, studentId: students[0].id },
      { classId: classA.id, studentId: students[1].id },
      { classId: classB.id, studentId: students[2].id },
      { classId: classB.id, studentId: students[3].id }
    ]
  });

  const single = await prisma.questionBankItem.create({
    data: {
      title: "Daily routine choice",
      prompt: "What time does Lan usually go to school?",
      skill: "LISTENING",
      questionType: "LISTENING_CHOICE",
      difficulty: "EASY",
      points: 1,
      tagsJson: JSON.stringify(["daily routines"]),
      createdById: teacher.id,
      options: {
        create: [
          { label: "At 6:30", value: "6:30", isCorrect: true, sortOrder: 1 },
          { label: "At 7:45", value: "7:45", sortOrder: 2 },
          { label: "At 8:15", value: "8:15", sortOrder: 3 }
        ]
      }
    }
  });
  const reading = await prisma.questionBankItem.create({
    data: {
      title: "School club detail",
      prompt: "Why did Minh join the environment club?",
      skill: "READING",
      questionType: "READING_SINGLE_CHOICE",
      difficulty: "MEDIUM",
      points: 1,
      tagsJson: JSON.stringify(["environment", "school life"]),
      createdById: teacher.id,
      options: {
        create: [
          { label: "To make new friends and help the school recycle", value: "friends-recycle", isCorrect: true, sortOrder: 1 },
          { label: "To avoid homework", value: "avoid-homework", sortOrder: 2 },
          { label: "To learn guitar", value: "guitar", sortOrder: 3 }
        ]
      }
    }
  });
  const fill = await prisma.questionBankItem.create({
    data: {
      title: "Technology blank",
      prompt: "Complete the sentence: My brother uses a tablet to ____ English videos.",
      skill: "WRITING",
      questionType: "FILL_BLANK",
      difficulty: "EASY",
      points: 1,
      tagsJson: JSON.stringify(["technology", "vocabulary"]),
      correctAnswersJson: JSON.stringify([["watch", "view"]]),
      settingsJson: JSON.stringify({ caseSensitive: false, trimWhitespace: true }),
      createdById: teacher.id
    }
  });
  const essay = await prisma.questionBankItem.create({
    data: {
      title: "Short essay about hobbies",
      prompt: "Write about a hobby that helps you learn English.",
      skill: "WRITING",
      questionType: "ESSAY",
      difficulty: "MEDIUM",
      points: 4,
      tagsJson: JSON.stringify(["hobbies", "writing"]),
      createdById: teacher.id
    }
  });
  const speaking = await prisma.questionBankItem.create({
    data: {
      title: "Speaking introduction",
      prompt: "Record a one-minute introduction about your school.",
      skill: "SPEAKING",
      questionType: "SPEAKING_RECORDING",
      difficulty: "MEDIUM",
      points: 4,
      tagsJson: JSON.stringify(["school life", "speaking"]),
      createdById: teacher.id
    }
  });

  const passage = await prisma.readingPassage.create({
    data: {
      title: "A greener school day",
      instructions: "Read the passage and answer the questions.",
      body: "Minh joined the environment club because he wanted to make new friends and help his school recycle more paper. Every Friday, the club collects used notebooks and teaches younger students how to save water."
    }
  });

  const exam = await prisma.exam.create({
    data: {
      title: "School Life Skills Check",
      description: "Listening, reading, writing, and speaking demo exam.",
      createdById: teacher.id,
      versions: {
        create: {
          versionNumber: 1,
          status: "PUBLISHED",
          title: "School Life Skills Check",
          description: "Listening, reading, writing, and speaking demo exam.",
          instructions: "Answer all questions. Objective questions are graded automatically.",
          timeLimitMinutes: 45,
          attemptsAllowed: 2,
          showScoreAfterSubmit: true,
          showCorrectAnswersAfterSubmit: false,
          resultsReleaseMode: "IMMEDIATE",
          publishedAt: new Date(),
          sections: {
            create: [
              { skill: "LISTENING", title: "Listening", sortOrder: 1 },
              { skill: "READING", title: "Reading", sortOrder: 2 },
              { skill: "WRITING", title: "Writing", sortOrder: 3 },
              { skill: "SPEAKING", title: "Speaking", sortOrder: 4 }
            ]
          }
        }
      }
    },
    include: { versions: { include: { sections: true } } }
  });
  const version = exam.versions[0];
  const sectionBySkill = Object.fromEntries(version.sections.map((section) => [section.skill, section]));
  async function snapshotQuestion(itemId: string, sectionSkill: "LISTENING" | "READING" | "WRITING" | "SPEAKING", extra?: { passageId?: string }) {
    const item = await prisma.questionBankItem.findUniqueOrThrow({ where: { id: itemId }, include: { options: true } });
    return prisma.questionGroup.create({
      data: {
        sectionId: sectionBySkill[sectionSkill].id,
        title: `${sectionSkill} group`,
        readingPassageId: extra?.passageId,
        questions: {
          create: {
            bankItemId: item.id,
            title: item.title,
            prompt: item.prompt,
            instructions: item.instructions,
            skill: item.skill,
            questionType: item.questionType,
            difficulty: item.difficulty,
            points: item.points,
            tagsJson: item.tagsJson,
            correctAnswersJson: item.correctAnswersJson,
            settingsJson: item.settingsJson,
            options: {
              create: item.options.map((option) => ({
                label: option.label,
                value: option.value,
                isCorrect: option.isCorrect,
                sortOrder: option.sortOrder
              }))
            }
          }
        }
      },
      include: { questions: { include: { options: true } } }
    });
  }
  await snapshotQuestion(single.id, "LISTENING");
  await snapshotQuestion(reading.id, "READING", { passageId: passage.id });
  await snapshotQuestion(fill.id, "WRITING");
  const g4 = await snapshotQuestion(essay.id, "WRITING");
  await snapshotQuestion(speaking.id, "SPEAKING");

  const assignment = await prisma.examAssignment.create({
    data: {
      examId: exam.id,
      versionId: version.id,
      targetType: "CLASS",
      classId: classA.id,
      academicYearId: academicYear.id,
      createdById: teacher.id
    }
  });

  const practiceExam = await prisma.exam.create({
    data: {
      title: "Daily English Practice",
      description: "Bài luyện tập ngắn có thể làm lại không giới hạn để theo dõi tiến bộ.",
      createdById: teacher.id,
      versions: {
        create: {
          versionNumber: 1,
          status: "PUBLISHED",
          mode: "PRACTICE",
          title: "Daily English Practice",
          description: "Luyện tập từ vựng hằng ngày.",
          instructions: "Bạn có thể làm lại bao nhiêu lần tùy ý. Mỗi lượt đều được lưu vào lịch sử tiến bộ.",
          attemptsAllowed: 1,
          showScoreAfterSubmit: true,
          showCorrectAnswersAfterSubmit: true,
          resultsReleaseMode: "IMMEDIATE",
          publishedAt: new Date(),
          sections: {
            create: {
              skill: "READING",
              title: "Reading practice",
              sortOrder: 1,
              groups: {
                create: {
                  title: "Daily vocabulary",
                  sortOrder: 1,
                  questions: {
                    create: {
                      title: "Daily vocabulary",
                      prompt: "Choose the word closest in meaning to 'quick'.",
                      skill: "READING",
                      questionType: "SINGLE_CHOICE",
                      difficulty: "EASY",
                      points: 1,
                      tagsJson: JSON.stringify(["vocabulary", "daily-practice"]),
                      sortOrder: 1,
                      options: {
                        create: [
                          { label: "fast", value: "fast", isCorrect: true, sortOrder: 1 },
                          { label: "slow", value: "slow", isCorrect: false, sortOrder: 2 },
                          { label: "quiet", value: "quiet", isCorrect: false, sortOrder: 3 }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    include: { versions: true }
  });
  const practiceVersion = practiceExam.versions[0];
  const practiceAssignment = await prisma.examAssignment.create({
    data: {
      examId: practiceExam.id,
      versionId: practiceVersion.id,
      targetType: "CLASS",
      classId: classA.id,
      academicYearId: academicYear.id,
      createdById: teacher.id
    }
  });
  const practiceQuestion = await prisma.examQuestion.findFirstOrThrow({
    where: { group: { section: { versionId: practiceVersion.id } } },
    include: { options: true }
  });
  const correctPracticeOption = practiceQuestion.options.find((option) => option.isCorrect)!;
  const wrongPracticeOption = practiceQuestion.options.find((option) => !option.isCorrect)!;
  for (const [index, score] of [0, 1, 1].entries()) {
    const submittedAt = new Date(Date.now() - (3 - index) * 24 * 60 * 60 * 1000);
    await prisma.examAttempt.create({
      data: {
        assignmentId: practiceAssignment.id,
        studentId: students[0].id,
        versionId: practiceVersion.id,
        attemptNumber: index + 1,
        startedAt: new Date(submittedAt.getTime() - 6 * 60 * 1000),
        submittedAt,
        status: "GRADED",
        autoScore: score,
        finalScore: score,
        totalPoints: 1,
        timeSpentSec: 360 - index * 60,
        releaseResults: true,
        answers: {
          create: {
            questionId: practiceQuestion.id,
            selectedOptionIdsJson: JSON.stringify([score ? correctPracticeOption.id : wrongPracticeOption.id]),
            score
          }
        }
      }
    });
  }

  await prisma.teacherTask.createMany({
    data: [
      {
        teacherId: teacher.id,
        title: "Soạn 5 câu Reading chủ đề Environment",
        description: "Dùng cho lớp IELTS Foundation A1, độ khó A2-B1.",
        priority: "HIGH",
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        teacherId: teacher.id,
        title: "Chấm bài viết hobby của Minh Anh",
        description: "Tập trung feedback coherence và vocabulary.",
        priority: "MEDIUM",
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        teacherId: teacher.id,
        title: "Chuẩn bị speaking prompts cho Grade 9 English",
        priority: "LOW"
      }
    ]
  });

  const questions = await prisma.examQuestion.findMany({ where: { group: { section: { versionId: version.id } } }, include: { options: true } });
  const totalPoints = calculateTotalPoints(questions);
  for (const [index, student] of students.slice(0, 2).entries()) {
    const attempt = await prisma.examAttempt.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        versionId: version.id,
        attemptNumber: 1,
        startedAt: new Date(Date.now() - (index + 1) * 86_400_000),
        submittedAt: new Date(Date.now() - (index + 1) * 82_000_000),
        status: "GRADED",
        totalPoints,
        releaseResults: true,
        timeSpentSec: 2100 + index * 200
      }
    });
    let autoScore = 0;
    for (const question of questions.filter((q) => q.questionType !== "ESSAY" && q.questionType !== "SPEAKING_RECORDING")) {
      const correctOption = question.options.find((option) => option.isCorrect);
      const answerPayload =
        question.questionType === "FILL_BLANK"
          ? { blankAnswers: [index === 0 ? "watch" : "see"] }
          : { selectedOptionIds: correctOption ? [correctOption.id] : [] };
      const score = gradeObjectiveAnswer(question, answerPayload) ?? 0;
      autoScore += score;
      await prisma.attemptAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedOptionIdsJson: "selectedOptionIds" in answerPayload ? JSON.stringify(answerPayload.selectedOptionIds) : null,
          blankAnswersJson: "blankAnswers" in answerPayload ? JSON.stringify(answerPayload.blankAnswers) : null,
          score
        }
      });
    }
    const essayQuestion = g4.questions[0];
    await prisma.attemptAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: essayQuestion.id,
        textAnswer: "My hobby is watching short English videos after school. I write new words in my notebook and try to use them when I talk with friends.",
        score: index === 0 ? 3 : 2.5
      }
    });
    const manualScore = index === 0 ? 3 : 2.5;
    await prisma.manualGrade.create({
      data: {
        attemptId: attempt.id,
        teacherId: teacher.id,
        score: manualScore,
        comments: index === 0 ? "Good detail and clear examples." : "Good effort. Add more connectors next time.",
        finalizedAt: new Date()
      }
    });
    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        autoScore,
        manualScore,
        finalScore: calculateFinalScore({ autoScore, manualScore })
      }
    });
  }

  await prisma.notification.createMany({
    data: [
      { userId: students[0].id, type: "EXAM_ASSIGNED", title: "New exam assigned", href: `/vi/student/exams/${assignment.id}` },
      { userId: students[0].id, type: "EXAM_ASSIGNED", title: "New practice assigned", href: `/vi/student/exams/${practiceAssignment.id}` },
      { userId: teacher.id, type: "SUBMISSION_RECEIVED", title: "Submissions ready to review", href: "/vi/teacher/grading" }
    ]
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "SEED_DATA_CREATED",
      entityType: "System",
      entityId: "seed",
      metadata: JSON.stringify({ examId: exam.id, classIds: [classA.id, classB.id] })
    }
  });

  console.log("Seed complete");
  console.log(`Admin: ${admin.username} / ${adminPassword}`);
  console.log(`Teacher: ${teacher.username} / ${teacherPassword}`);
  console.log(`Student: ${students[0].username} / ${studentPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
