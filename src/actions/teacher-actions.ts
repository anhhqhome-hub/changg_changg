"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { z } from "zod";
import type { QuestionType, Skill } from "@/generated/prisma/enums";
import { gradeObjectiveAnswer, isManualQuestion } from "@/domain/grading";
import { calculateFinalScore, calculateTotalPoints } from "@/domain/scoring";
import { askTeacherAgent, generateQuestionsWithGroq, reviewImportedQuestionsWithGroq, type AiQuestion } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { getOrCreateCurrentAcademicYear } from "@/lib/academic-year";
import { requireRole } from "@/lib/permissions";
import { parseQuizziWordText, quizziHtmlToMarkedText } from "@/lib/quizzi-import";
import { parseJson } from "@/lib/utils";

const localeSchema = z.string().default("vi");
const supportedSkills = ["LISTENING", "SPEAKING", "READING", "WRITING"] as const;
const supportedQuestionTypes = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
  "SHORT_ANSWER",
  "ESSAY",
  "MATCHING",
  "ORDERING",
  "LISTENING_CHOICE",
  "LISTENING_FILL_BLANK",
  "SPEAKING_RECORDING",
  "READING_SINGLE_CHOICE",
  "READING_MULTIPLE_CHOICE"
] as const;

type ImportedQuestion = {
  title: string;
  prompt: string;
  skill: Skill;
  questionType: QuestionType;
  options: string[];
  answer: string;
  points: number;
  groupKey?: string;
  groupTitle?: string;
  groupInstructions?: string;
  passageTitle?: string;
  passageBody?: string;
  sourceNumber?: string;
};

const aiGenerateSchema = z.object({
  topic: z.string().min(2).max(240),
  count: z.coerce.number().int().min(1).max(20).default(8),
  level: z.string().min(1).max(80).default("A2-B1"),
  skill: z.string().min(1).max(80).default("MIXED"),
  questionType: z.string().min(1).max(80).default("MIXED")
});

function optionalDateFromForm(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function createClassAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const name = z.string().min(2).parse(formData.get("name"));
  const description = z.string().optional().parse(formData.get("description") || undefined);
  const profile = await prisma.teacherProfile.findUniqueOrThrow({ where: { userId: teacher.id }, select: { schoolId: true } });
  if (!profile.schoolId) throw new Error("TEACHER_SCHOOL_REQUIRED");
  const academicYear = await getOrCreateCurrentAcademicYear();
  await prisma.class.create({
    data: { name, description, teacherId: teacher.id, schoolId: profile.schoolId, academicYearId: academicYear.id }
  });
  revalidatePath(`/${locale}/teacher/classes`);
}

export async function updateClassAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const classId = z.string().min(1).parse(formData.get("classId"));
  const name = z.string().min(2).parse(formData.get("name"));
  const description = z.string().optional().parse(formData.get("description") || undefined);
  await prisma.class.findFirstOrThrow({ where: { id: classId, teacherId: teacher.id } });
  await prisma.class.update({ where: { id: classId }, data: { name, description: description || null } });
  revalidatePath(`/${locale}/teacher/classes`);
  revalidatePath(`/${locale}/teacher/classes/${classId}`);
}

export async function toggleClassArchivedAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const classId = z.string().min(1).parse(formData.get("classId"));
  const klass = await prisma.class.findFirstOrThrow({ where: { id: classId, teacherId: teacher.id } });
  await prisma.class.update({ where: { id: classId }, data: { archivedAt: klass.archivedAt ? null : new Date() } });
  await prisma.auditLog.create({
    data: {
      actorUserId: teacher.id,
      action: klass.archivedAt ? "CLASS_RESTORED" : "CLASS_ARCHIVED",
      entityType: "Class",
      entityId: classId,
      metadata: JSON.stringify({ name: klass.name })
    }
  });
  revalidatePath(`/${locale}/teacher/classes`);
  revalidatePath(`/${locale}/teacher/classes/${classId}`);
}

export async function removeStudentFromClassAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const classId = z.string().min(1).parse(formData.get("classId"));
  const studentId = z.string().min(1).parse(formData.get("studentId"));
  await prisma.class.findFirstOrThrow({ where: { id: classId, teacherId: teacher.id } });
  await prisma.classMembership.deleteMany({ where: { classId, studentId } });
  revalidatePath(`/${locale}/teacher/classes/${classId}`);
}

export type TeacherAgentActionState = {
  answer?: string;
  error?: string;
};

export async function askTeacherAgentAction(
  _state: TeacherAgentActionState,
  formData: FormData
): Promise<TeacherAgentActionState> {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  await requireRole("TEACHER", locale);
  const question = z.string().trim().min(2).max(1000).safeParse(formData.get("question"));
  if (!question.success) return { error: locale === "en" ? "Please enter a question." : "Hãy nhập câu hỏi." };

  try {
    const answer = await askTeacherAgent({
      question: question.data,
      language: locale === "en" ? "English" : "Vietnamese"
    });
    return { answer };
  } catch (error) {
    console.error("Teacher agent request failed", error);
    return {
      error:
        error instanceof Error && error.message === "GROQ_API_KEY_MISSING"
          ? locale === "en"
            ? "The AI assistant is not configured yet."
            : "Trợ lý AI chưa được cấu hình."
          : locale === "en"
            ? "The assistant is temporarily unavailable. Please try again."
            : "Trợ lý đang tạm thời không khả dụng. Hãy thử lại."
    };
  }
}

export async function createTeacherTaskAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const title = z.string().min(2).max(160).parse(formData.get("title"));
  const description = z.string().max(500).optional().parse(formData.get("description") || undefined);
  const priority = z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM").parse(formData.get("priority") || "MEDIUM");
  await prisma.teacherTask.create({
    data: {
      teacherId: teacher.id,
      title,
      description,
      priority,
      dueAt: optionalDateFromForm(formData.get("dueAt"))
    }
  });
  revalidatePath(`/${locale}/teacher`);
}

export async function toggleTeacherTaskAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const taskId = z.string().min(1).parse(formData.get("taskId"));
  const task = await prisma.teacherTask.findFirstOrThrow({
    where: { id: taskId, teacherId: teacher.id },
    select: { id: true, completedAt: true }
  });
  await prisma.teacherTask.update({
    where: { id: task.id },
    data: { completedAt: task.completedAt ? null : new Date() }
  });
  revalidatePath(`/${locale}/teacher`);
}

export type ImportExamActionState = {
  error?: string;
};

export async function importExamFromFileAction(
  _state: ImportExamActionState,
  formData: FormData
): Promise<ImportExamActionState> {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const file = formData.get("file");
  const titleResult = z.string().min(2).max(160).safeParse(formData.get("title") || "Đề import từ file");
  const useAiReview = formData.get("aiReview") === "on";

  if (!titleResult.success) {
    return { error: locale === "en" ? "Enter an exam name between 2 and 160 characters." : "Tên đề phải có từ 2 đến 160 ký tự." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: locale === "en" ? "Choose a file to import." : "Hãy chọn file đề cần import." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: locale === "en" ? "The file must be 5MB or smaller." : "File phải có dung lượng tối đa 5MB." };
  }

  let examId: string | null = null;
  try {
    let importedQuestions = await parseExamImportFile(file);
    if (importedQuestions.length === 0) throw new Error("IMPORT_EMPTY");
    validateImportedQuestions(importedQuestions);
    console.info("[exam-import] Parsed source file", {
      fileName: file.name,
      questionCount: importedQuestions.length,
      groupCount: new Set(importedQuestions.map((question) => question.groupKey).filter(Boolean)).size,
      answeredCount: importedQuestions.filter((question) => question.answer.trim()).length
    });

    const checks = [
      `Parsed ${importedQuestions.length} questions from ${file.name}`,
      `Detected ${new Set(importedQuestions.map((question) => question.groupKey).filter(Boolean)).size || importedQuestions.length} question groups`,
      "Created a draft exam for teacher review"
    ];

    if (useAiReview) {
      if (canReviewImportWithAi(importedQuestions)) {
        try {
          const reviewed = await reviewImportedQuestionsWithGroq(importedQuestions.map(importedToAiQuestion));
          if (reviewed.questions.length !== importedQuestions.length) throw new Error("AI_REVIEW_COUNT_MISMATCH");
          importedQuestions = reviewed.questions.map((question, index) => mergeAiReview(importedQuestions[index], question));
          checks.unshift(...reviewed.checks);
        } catch (error) {
          console.error("[exam-import] AI review skipped after request failure", safeImportError(error));
          checks.unshift("AI review was unavailable; imported the parsed draft without AI changes.");
        }
      } else {
        const missingAnswerEntries = importedQuestions
          .map((question, index) => ({ question, index }))
          .filter(({ question }) => !question.answer.trim() && question.options.length >= 2);

        if (missingAnswerEntries.length > 0 && canReviewMissingAnswersWithAi(missingAnswerEntries.map(({ question }) => question))) {
          try {
            const reviewed = await reviewImportedQuestionsWithGroq(
              missingAnswerEntries.map(({ question }) => importedToAiQuestion(question))
            );
            let filled = 0;
            reviewed.questions.forEach((reviewedQuestion, reviewIndex) => {
              const entry = missingAnswerEntries[reviewIndex];
              if (!entry) return;
              const answer = safeReviewedChoiceAnswer(reviewedQuestion.answer, entry.question.options);
              if (!answer) return;
              importedQuestions[entry.index] = { ...entry.question, answer };
              filled += 1;
            });
            checks.unshift(`Large import: deterministic parsing kept the full file; AI filled ${filled}/${missingAnswerEntries.length} missing choice answers only.`);
          } catch (error) {
            console.error("[exam-import] Missing-answer AI fallback skipped after request failure", safeImportError(error));
            checks.unshift("Large import completed without AI fallback. Answers detected from the source file were preserved.");
          }
        } else {
          checks.unshift("AI review skipped for this large import. The full draft and source-marked answers were preserved without a large AI request.");
        }
      }
    }

    const exam = await createExamFromImportedQuestions({
      teacherId: teacher.id,
      title: titleResult.data,
      description: `Được tạo từ file ${file.name}. ${checks[0] ?? ""}`.trim(),
      sourceLabel: file.name,
      questions: importedQuestions
    });
    examId = exam.id;

    await prisma.auditLog.create({
      data: {
        actorUserId: teacher.id,
        action: "EXAM_IMPORTED",
        entityType: "Exam",
        entityId: exam.id,
        metadata: JSON.stringify({ fileName: file.name, questionCount: importedQuestions.length, aiReview: useAiReview, checks })
      }
    });
  } catch (error) {
    console.error("[exam-import] Import failed", safeImportError(error));
    return { error: importErrorMessage(error, locale) };
  }

  if (!examId) {
    return { error: locale === "en" ? "The import did not create an exam." : "Import chưa tạo được đề." };
  }
  revalidatePath(`/${locale}/teacher/exams`);
  redirect(`/${locale}/teacher/exams/${examId}/builder`);
}

async function legacyImportExamFromFileAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const file = formData.get("file");
  const title = z.string().min(2).max(160).parse(formData.get("title") || "Đề import từ file");
  if (!(file instanceof File) || file.size === 0) throw new Error("IMPORT_FILE_REQUIRED");
  if (file.size > 5 * 1024 * 1024) throw new Error("IMPORT_FILE_TOO_LARGE");

  const importedQuestions = await parseExamImportFile(file);
  if (importedQuestions.length === 0) throw new Error("IMPORT_EMPTY");

  const exam = await prisma.exam.create({
    data: {
      title,
      description: `Được tạo từ file ${file.name}`,
      createdById: teacher.id,
      versions: {
        create: {
          versionNumber: 1,
          title,
          description: `Được tạo từ file ${file.name}`,
          instructions: "Đề được import tự động. Giáo viên nên kiểm tra lại nội dung, đáp án và điểm trước khi xuất bản.",
          sections: {
            create: supportedSkills
              .filter((skill) => importedQuestions.some((question) => question.skill === skill))
              .map((skill, index) => ({
                skill,
                title: skillTitle(skill),
                sortOrder: index + 1
              }))
          }
        }
      }
    },
    include: { versions: { include: { sections: true } } }
  });

  const version = exam.versions[0];
  const sectionBySkill = new Map(version.sections.map((section) => [section.skill, section.id]));
  for (const [index, question] of importedQuestions.entries()) {
    const sectionId = sectionBySkill.get(question.skill);
    if (!sectionId) continue;
    await prisma.questionGroup.create({
      data: {
        sectionId,
        title: `Import ${index + 1}`,
        sortOrder: index + 1,
        questions: {
          create: {
            title: question.title,
            prompt: question.prompt,
            skill: question.skill,
            questionType: question.questionType,
            points: question.points,
            sortOrder: 1,
            tagsJson: JSON.stringify(["import"]),
            correctAnswersJson: correctAnswerJson(question),
            settingsJson: JSON.stringify({ caseSensitive: false, trimWhitespace: true }),
            options: {
              create: question.options.map((option, optionIndex) => ({
                label: option,
                value: option,
                sortOrder: optionIndex + 1,
                isCorrect: isCorrectOption(question.answer, option, optionIndex)
              }))
            }
          }
        }
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: teacher.id,
      action: "EXAM_IMPORTED",
      entityType: "Exam",
      entityId: exam.id,
      metadata: JSON.stringify({ fileName: file.name, questionCount: importedQuestions.length })
    }
  });
  revalidatePath(`/${locale}/teacher/exams`);
  redirect(`/${locale}/teacher/exams/${exam.id}/builder`);
}

void legacyImportExamFromFileAction;

export async function addStudentToClassAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const classId = z.string().parse(formData.get("classId"));
  const studentId = z.string().parse(formData.get("studentId"));
  const klass = await prisma.class.findFirstOrThrow({
    where: { id: classId, teacherId: teacher.id },
    select: { id: true, schoolId: true }
  });
  const student = await prisma.user.findFirstOrThrow({
    where: { id: studentId, role: "STUDENT", status: "APPROVED" },
    include: { studentProfile: true }
  });
  if (klass.schoolId && student.studentProfile?.schoolId && student.studentProfile.schoolId !== klass.schoolId) {
    throw new Error("STUDENT_BELONGS_TO_ANOTHER_SCHOOL");
  }
  if (klass.schoolId) {
    const school = await prisma.school.findUnique({ where: { id: klass.schoolId }, select: { name: true } });
    if (student.studentProfile) {
      if (!student.studentProfile.schoolId) {
        await prisma.studentProfile.update({
          where: { userId: student.id },
          data: { schoolId: klass.schoolId, schoolName: school?.name ?? student.studentProfile.schoolName }
        });
      }
    } else {
      await prisma.studentProfile.create({
        data: {
          userId: student.id,
          studentCode: `HS-${(student.username ?? student.id.slice(0, 8)).toUpperCase()}-${student.id.slice(0, 6).toUpperCase()}`,
          schoolId: klass.schoolId,
          schoolName: school?.name ?? null
        }
      });
    }
  }
  await prisma.classMembership.upsert({
    where: { classId_studentId: { classId, studentId: student.id } },
    update: {},
    create: { classId, studentId: student.id }
  });
  revalidatePath(`/${locale}/teacher/classes/${classId}`);
}

export async function createQuestionAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const title = z.string().min(2).parse(formData.get("title"));
  const prompt = z.string().min(2).parse(formData.get("prompt"));
  const questionType = z.string().parse(formData.get("questionType"));
  const skill = z.string().parse(formData.get("skill"));
  const points = z.coerce.number().positive().parse(formData.get("points") || 1);
  const optionsRaw = z.string().parse(formData.get("options") || "");
  const correctRaw = z.string().optional().parse(formData.get("correctAnswers") || "");
  const options = optionsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({ label: line, value: line, sortOrder: index, isCorrect: false }));
  const created = await prisma.questionBankItem.create({
    data: {
      title,
      prompt,
      questionType: questionType as never,
      skill: skill as never,
      points,
      correctAnswersJson: correctRaw ? correctRaw : null,
      createdById: teacher.id,
      options: { create: options }
    }
  });
  revalidatePath(`/${locale}/teacher/question-bank`);
  redirect(`/${locale}/teacher/question-bank?created=${created.id}`);
}

export async function generateQuestionBankWithAIAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const input = aiGenerateSchema.parse({
    topic: formData.get("topic"),
    count: formData.get("count") || 6,
    level: formData.get("level") || "A2-B1",
    skill: formData.get("skill") || "MIXED",
    questionType: formData.get("questionType") || "MIXED"
  });
  const result = await generateQuestionsWithGroq({ ...input, language: locale === "en" ? "English" : "Vietnamese" });
  const questions = result.questions.map(aiToImportedQuestion);

  for (const question of questions) {
    await prisma.questionBankItem.create({
      data: {
        title: question.title,
        prompt: question.prompt,
        skill: question.skill,
        questionType: question.questionType,
        points: question.points,
        correctAnswersJson: correctAnswerJson(question),
        settingsJson: JSON.stringify({ aiGenerated: true, trimWhitespace: true, caseSensitive: false }),
        tagsJson: JSON.stringify(["ai", input.topic]),
        createdById: teacher.id,
        options: {
          create: question.options.map((option, optionIndex) => ({
            label: option,
            value: option,
            sortOrder: optionIndex + 1,
            isCorrect: isCorrectOption(question.answer, option, optionIndex)
          }))
        }
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: teacher.id,
      action: "AI_QUESTIONS_GENERATED",
      entityType: "QuestionBankItem",
      entityId: teacher.id,
      metadata: JSON.stringify({ topic: input.topic, count: questions.length, checks: result.checks })
    }
  });
  revalidatePath(`/${locale}/teacher/question-bank`);
  redirect(`/${locale}/teacher/question-bank?ai=created`);
}

export async function createExamAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const title = z.string().min(2).parse(formData.get("title"));
  const description = z.string().optional().parse(formData.get("description") || undefined);
  const mode = z.enum(["TEST", "PRACTICE"]).default("TEST").parse(formData.get("mode") || "TEST");
  const exam = await prisma.exam.create({
    data: {
      title,
      description,
      createdById: teacher.id,
      versions: {
        create: {
          versionNumber: 1,
          mode,
          title,
          description,
          attemptsAllowed: mode === "PRACTICE" ? 1 : 1,
          showScoreAfterSubmit: true,
          showCorrectAnswersAfterSubmit: mode === "PRACTICE",
          resultsReleaseMode: "IMMEDIATE",
          instructions: mode === "PRACTICE"
            ? "Luyện tập không giới hạn lượt. Hệ thống lưu toàn bộ quá trình để giáo viên theo dõi tiến bộ."
            : "Đọc kỹ câu hỏi. Đây là bài kiểm tra và số lượt làm bị giới hạn.",
          sections: {
            create: [
              { skill: "READING", title: "Reading", sortOrder: 1 },
              { skill: "WRITING", title: "Writing", sortOrder: 2 }
            ]
          }
        }
      }
    },
    include: { versions: true }
  });
  redirect(`/${locale}/teacher/exams/${exam.id}/builder`);
}

export async function generateExamWithAIAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const title = z.string().min(2).max(160).parse(formData.get("title"));
  const description = z.string().max(500).optional().parse(formData.get("description") || undefined);
  const input = aiGenerateSchema.parse({
    topic: formData.get("topic") || title,
    count: formData.get("count") || 10,
    level: formData.get("level") || "A2-B1",
    skill: formData.get("skill") || "MIXED",
    questionType: formData.get("questionType") || "MIXED"
  });
  const result = await generateQuestionsWithGroq({ ...input, language: locale === "en" ? "English" : "Vietnamese" });
  const exam = await createExamFromImportedQuestions({
    teacherId: teacher.id,
    title,
    description: description ?? `AI draft: ${input.topic}`,
    sourceLabel: "AI Groq",
    questions: result.questions.map(aiToImportedQuestion)
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: teacher.id,
      action: "AI_EXAM_GENERATED",
      entityType: "Exam",
      entityId: exam.id,
      metadata: JSON.stringify({ topic: input.topic, count: result.questions.length, checks: result.checks })
    }
  });
  revalidatePath(`/${locale}/teacher/exams`);
  redirect(`/${locale}/teacher/exams/${exam.id}/builder`);
}

export async function addQuestionToExamAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const examId = z.string().parse(formData.get("examId"));
  const sectionId = z.string().parse(formData.get("sectionId"));
  const bankItemId = z.string().parse(formData.get("bankItemId"));
  const version = await prisma.examVersion.findFirstOrThrow({
    where: { examId, status: "DRAFT", exam: { createdById: teacher.id } }
  });
  const bankItem = await prisma.questionBankItem.findFirstOrThrow({
    where: { id: bankItemId, createdById: teacher.id },
    include: { options: true }
  });
  const group = await prisma.questionGroup.create({
    data: {
      sectionId,
      title: bankItem.skill === "READING" ? "Passage questions" : "Question group",
      questions: {
        create: {
          bankItemId,
          title: bankItem.title,
          prompt: bankItem.prompt,
          instructions: bankItem.instructions,
          skill: bankItem.skill,
          questionType: bankItem.questionType,
          difficulty: bankItem.difficulty,
          points: bankItem.points,
          tagsJson: bankItem.tagsJson,
          correctAnswersJson: bankItem.correctAnswersJson,
          settingsJson: bankItem.settingsJson,
          sortOrder: 1,
          options: {
            create: bankItem.options.map((option) => ({
              label: option.label,
              value: option.value,
              isCorrect: option.isCorrect,
              sortOrder: option.sortOrder
            }))
          }
        }
      }
    }
  });
  await prisma.examVersion.update({ where: { id: version.id }, data: { updatedAt: new Date() } });
  revalidatePath(`/${locale}/teacher/exams/${examId}/builder`);
  void group.id;
}

export async function updateExamModeAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const examId = z.string().min(1).parse(formData.get("examId"));
  const versionId = z.string().min(1).parse(formData.get("versionId"));
  const mode = z.enum(["TEST", "PRACTICE"]).parse(formData.get("mode"));
  const attemptsAllowed = mode === "TEST"
    ? z.coerce.number().int().min(1).max(20).parse(formData.get("attemptsAllowed") || 1)
    : 1;
  const version = await prisma.examVersion.findFirstOrThrow({
    where: { id: versionId, examId, exam: { createdById: teacher.id } }
  });
  await prisma.examVersion.update({
    where: { id: version.id },
    data: {
      mode,
      attemptsAllowed,
      showScoreAfterSubmit: true,
      showCorrectAnswersAfterSubmit: mode === "PRACTICE" ? true : version.showCorrectAnswersAfterSubmit,
      resultsReleaseMode: mode === "PRACTICE" ? "IMMEDIATE" : version.resultsReleaseMode
    }
  });
  revalidatePath(`/${locale}/teacher/exams/${examId}/builder`);
  revalidatePath(`/${locale}/teacher/exams`);
  revalidatePath(`/${locale}/student`);
}

export async function publishExamAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const examId = z.string().parse(formData.get("examId"));
  const version = await prisma.examVersion.findFirstOrThrow({
    where: { examId, status: "DRAFT", exam: { createdById: teacher.id } },
    include: { sections: { include: { groups: { include: { questions: true } } } } }
  });
  const questionCount = version.sections.flatMap((section) => section.groups.flatMap((group) => group.questions)).length;
  if (questionCount === 0) throw new Error("EXAM_NEEDS_QUESTIONS");
  await prisma.examVersion.update({
    where: { id: version.id },
    data: { status: "PUBLISHED", publishedAt: new Date() }
  });
  await prisma.auditLog.create({
    data: { actorUserId: teacher.id, action: "EXAM_PUBLISHED", entityType: "ExamVersion", entityId: version.id }
  });
  revalidatePath(`/${locale}/teacher/exams/${examId}/builder`);
  revalidatePath(`/${locale}/teacher/exams/${examId}/assign`);
}

export async function updateExamTimingAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const examId = z.string().min(1).parse(formData.get("examId"));
  const versionId = z.string().min(1).parse(formData.get("versionId"));
  const timeLimitRaw = formData.get("timeLimitMinutes");
  const deadlineRaw = formData.get("deadline");
  const timeLimitMinutes = timeLimitRaw === "" || timeLimitRaw === null
    ? null
    : z.coerce.number().int().min(1).max(1440).parse(timeLimitRaw);
  const deadline = deadlineRaw === "" || deadlineRaw === null
    ? null
    : z.coerce.date().parse(deadlineRaw);

  const version = await prisma.examVersion.findFirstOrThrow({
    where: { id: versionId, examId, exam: { createdById: teacher.id } },
    select: { id: true }
  });
  await prisma.examVersion.update({
    where: { id: version.id },
    data: { timeLimitMinutes, deadline }
  });
  revalidatePath(`/${locale}/teacher/exams/${examId}/builder`);
  revalidatePath(`/${locale}/teacher/exams/${examId}/assign`);
  revalidatePath(`/${locale}/student`);
}

export type AssignExamActionState = {
  error?: string;
  success?: string;
};

export async function assignExamAction(formData: FormData): Promise<void> {
  void (await assignExamActionWithState({}, formData));
}

export async function assignExamActionWithState(_state: AssignExamActionState, formData: FormData): Promise<AssignExamActionState> {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const examId = z.string().parse(formData.get("examId"));
  const versionId = z.string().parse(formData.get("versionId"));
  const classId = z.string().optional().parse(formData.get("classId") || undefined);
  const studentId = z.string().optional().parse(formData.get("studentId") || undefined);
  if ((!classId && !studentId) || (classId && studentId)) return { error: "ASSIGNMENT_TARGET_REQUIRED" };

  const timeLimitRaw = formData.get("timeLimitMinutes");
  const timeLimitNumber = timeLimitRaw === null || timeLimitRaw === "" ? NaN : Number(timeLimitRaw);
  const timeLimitMinutes = Number.isFinite(timeLimitNumber)
    ? Math.min(1440, Math.max(1, Math.round(timeLimitNumber)))
    : null;
  const deadlineRaw = formData.get("deadline");
  const deadlineDate = typeof deadlineRaw === "string" && deadlineRaw ? new Date(deadlineRaw) : null;
  const deadline = deadlineDate && !Number.isNaN(deadlineDate.getTime()) ? deadlineDate : null;

  const version = await prisma.examVersion.findFirstOrThrow({
    where: { id: versionId, examId, exam: { createdById: teacher.id } },
    include: { sections: { include: { groups: { include: { questions: true } } } } }
  });
  const targetClass = classId
    ? await prisma.class.findFirst({
        where: { id: classId, teacherId: teacher.id, archivedAt: null },
        select: { id: true, academicYearId: true }
      })
    : null;
  const targetStudents = classId
    ? await prisma.classMembership.findMany({
        where: { classId, class: { teacherId: teacher.id, archivedAt: null } },
        select: { studentId: true }
      })
    : await prisma.user.findMany({
        where: { id: studentId, role: "STUDENT", status: "APPROVED", memberships: { some: { class: { teacherId: teacher.id } } } },
        select: { id: true }
      }).then((users) => users.map((user) => ({ studentId: user.id })));
  const directStudentYear = !classId && studentId
    ? await prisma.classMembership.findFirst({
        where: { studentId, class: { teacherId: teacher.id, archivedAt: null, academicYearId: { not: null } } },
        orderBy: { createdAt: "desc" },
        select: { class: { select: { academicYearId: true } } }
      })
    : null;
  const academicYearId = targetClass?.academicYearId ?? directStudentYear?.class.academicYearId ?? null;
  if (targetStudents.length === 0) return { error: classId ? "CLASS_HAS_NO_STUDENTS" : "STUDENT_NOT_AVAILABLE" };
  if (version.status === "DRAFT") {
    const questionCount = version.sections.flatMap((section) => section.groups.flatMap((group) => group.questions)).length;
    if (questionCount === 0) return { error: "EXAM_NEEDS_QUESTIONS" };
    await prisma.examVersion.update({ where: { id: version.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    await prisma.auditLog.create({
      data: { actorUserId: teacher.id, action: "EXAM_PUBLISHED", entityType: "ExamVersion", entityId: version.id }
    });
  } else if (version.status !== "PUBLISHED") {
    return { error: "EXAM_NOT_ASSIGNABLE" };
  }
  await prisma.examVersion.update({ where: { id: version.id }, data: { timeLimitMinutes, deadline } });
  const assignment = await prisma.examAssignment.create({
    data: {
      examId,
      versionId,
      targetType: classId ? "CLASS" : "STUDENT",
      classId,
      studentId,
      academicYearId,
      createdById: teacher.id
    }
  });
  await prisma.notification.createMany({
    data: targetStudents.map((student) => ({
      userId: student.studentId,
      type: "EXAM_ASSIGNED",
      title: version.mode === "PRACTICE" ? "Bạn có bài luyện tập mới" : "Bạn có bài kiểm tra mới",
      href: `/${locale}/student/exams/${assignment.id}`
    }))
  });
  revalidatePath(`/${locale}/teacher/exams`);
  revalidatePath(`/${locale}/student`);
  return { success: "ASSIGNMENT_CREATED" };
}

export async function finalizeGradeAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get("locale") || "vi");
  const teacher = await requireRole("TEACHER", locale);
  const attemptId = z.string().parse(formData.get("attemptId"));
  const manualScore = z.coerce.number().min(0).parse(formData.get("manualScore") || 0);
  const comments = z.string().optional().parse(formData.get("comments") || undefined);
  const attempt = await prisma.examAttempt.findFirstOrThrow({
    where: { id: attemptId, assignment: { exam: { createdById: teacher.id } } },
    include: {
      answers: { include: { question: { include: { options: true } } } },
      version: { include: { sections: { include: { groups: { include: { questions: true } } } } } }
    }
  });
  const questions = attempt.version.sections.flatMap((section) => section.groups.flatMap((group) => group.questions));
  const autoScore = attempt.answers.reduce((sum, answer) => {
    const score = gradeObjectiveAnswer(answer.question, {
      selectedOptionIds: parseJson(answer.selectedOptionIdsJson, []),
      textAnswer: answer.textAnswer ?? undefined,
      blankAnswers: parseJson(answer.blankAnswersJson, []),
      matchingAnswers: parseJson(answer.matchingAnswersJson, {}),
      orderingAnswers: parseJson(answer.orderingAnswersJson, [])
    });
    return sum + (score ?? 0);
  }, 0);
  const totalPoints = calculateTotalPoints(questions);
  await prisma.$transaction([
    prisma.manualGrade.upsert({
      where: { attemptId },
      create: { attemptId, teacherId: teacher.id, score: manualScore, comments, finalizedAt: new Date() },
      update: { score: manualScore, comments, finalizedAt: new Date(), teacherId: teacher.id }
    }),
    prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        autoScore,
        manualScore,
        finalScore: calculateFinalScore({ autoScore, manualScore }),
        totalPoints,
        status: "GRADED",
        releaseResults: true
      }
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: teacher.id,
        action: "GRADE_FINALIZED",
        entityType: "ExamAttempt",
        entityId: attemptId,
        metadata: JSON.stringify({ manualScore, hadManualQuestions: questions.some((q) => isManualQuestion(q.questionType)) })
      }
    })
  ]);
  revalidatePath(`/${locale}/teacher/grading`);
}

async function parseExamImportFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop()?.toLocaleLowerCase() ?? "";
  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return rows.map(normalizeImportRow).filter(isImportedQuestion);
  }
  if (extension === "csv") {
    return parseCsv(buffer.toString("utf8")).map(normalizeImportRow).filter(isImportedQuestion);
  }
  if (extension === "docx") {
    // Quizzi-style Word files encode the correct choice with Word underline.
    // Mammoth ignores underline by default, so preserve it as <mark> and turn it
    // into a parser marker before stripping the rest of the HTML.
    const htmlResult = await mammoth.convertToHtml(
      { buffer },
      { styleMap: ["u => mark"] }
    );
    const markedText = quizziHtmlToMarkedText(htmlResult.value);
    const quizziQuestions = parseQuizziWordText(markedText);
    if (quizziQuestions.length > 0) {
      return quizziQuestions.map<ImportedQuestion>((question) => ({
        title: question.title,
        prompt: question.prompt,
        skill: "READING",
        questionType: question.options.length >= 2 ? "READING_SINGLE_CHOICE" : "ESSAY",
        options: question.options,
        answer: question.answer ?? "",
        points: 1,
        groupKey: question.groupKey,
        groupTitle: question.groupTitle,
        groupInstructions: question.groupInstructions,
        passageTitle: question.passageTitle,
        passageBody: question.passageBody,
        sourceNumber: question.sourceNumber
      }));
    }

    const rawResult = await mammoth.extractRawText({ buffer });
    return parseWordQuestions(rawResult.value);
  }
  throw new Error("IMPORT_UNSUPPORTED_FILE");
}

async function createExamFromImportedQuestions({
  teacherId,
  title,
  description,
  sourceLabel,
  questions
}: {
  teacherId: string;
  title: string;
  description?: string;
  sourceLabel: string;
  questions: ImportedQuestion[];
}) {
  validateImportedQuestions(questions);
  let createdExamId: string | null = null;

  try {
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        createdById: teacherId,
        versions: {
          create: {
            versionNumber: 1,
            title,
            description,
            instructions: "Đề được tạo tự động. Giáo viên nên kiểm tra lại nội dung, đáp án và điểm trước khi xuất bản.",
            sections: {
              create: supportedSkills
                .filter((skill) => questions.some((question) => question.skill === skill))
                .map((skill, index) => ({
                  skill,
                  title: skillTitle(skill),
                  sortOrder: index + 1
                }))
            }
          }
        }
      },
      include: { versions: { include: { sections: true } } }
    });
    createdExamId = exam.id;

    const version = exam.versions[0];
    if (!version) throw new Error("IMPORT_VERSION_CREATE_FAILED");
    const sectionBySkill = new Map(version.sections.map((section) => [section.skill, section.id]));
    const groups = new Map<string, { firstIndex: number; questions: ImportedQuestion[] }>();

    questions.forEach((question, index) => {
      const key = question.groupKey ? `${question.skill}:${question.groupKey}` : `${question.skill}:question-${index + 1}`;
      const group = groups.get(key);
      if (group) group.questions.push(question);
      else groups.set(key, { firstIndex: index, questions: [question] });
    });

    const orderedGroups = [...groups.values()].sort((a, b) => a.firstIndex - b.firstIndex);
    // SQLite serializes writes. Import groups sequentially to avoid SQLITE_BUSY /
    // lock contention when a large Word file creates many nested records.
    for (const group of orderedGroups) {
      const first = group.questions[0];
      const sectionId = sectionBySkill.get(first.skill);
      if (!sectionId) throw new Error(`IMPORT_SECTION_MISSING:${first.skill}`);

      const passage = first.passageBody
        ? await prisma.readingPassage.create({
            data: {
              title: first.passageTitle || first.groupTitle || `Passage ${group.firstIndex + 1}`,
              body: first.passageBody,
              instructions: first.groupInstructions || null
            }
          })
        : null;

      await prisma.questionGroup.create({
        data: {
          sectionId,
          title: first.groupTitle || `${sourceLabel} ${group.firstIndex + 1}`,
          instructions: first.groupInstructions || null,
          readingPassageId: passage?.id,
          sortOrder: group.firstIndex + 1,
          questions: {
            create: group.questions.map((question, questionIndex) => ({
              title: question.title,
              prompt: question.prompt,
              skill: question.skill,
              questionType: question.questionType,
              points: question.points,
              sortOrder: questionIndex + 1,
              tagsJson: JSON.stringify([sourceLabel.toLocaleLowerCase().includes("ai") ? "ai" : "import"]),
              correctAnswersJson: correctAnswerJson(question),
              settingsJson: JSON.stringify({ caseSensitive: false, trimWhitespace: true, sourceNumber: question.sourceNumber ?? null }),
              options: {
                create: question.options.map((option, optionIndex) => ({
                  label: option,
                  value: option,
                  sortOrder: optionIndex + 1,
                  isCorrect: isCorrectOption(question.answer, option, optionIndex)
                }))
              }
            }))
          }
        }
      });
    }

    const savedQuestionCount = await prisma.examQuestion.count({
      where: { group: { section: { version: { examId: exam.id } } } }
    });
    const savedOptionCount = await prisma.examQuestionOption.count({
      where: { question: { group: { section: { version: { examId: exam.id } } } } }
    });
    const expectedOptionCount = questions.reduce((sum, question) => sum + question.options.length, 0);

    if (savedQuestionCount !== questions.length || savedOptionCount !== expectedOptionCount) {
      throw new Error(`IMPORT_SAVE_VERIFY_FAILED:questions=${savedQuestionCount}/${questions.length};options=${savedOptionCount}/${expectedOptionCount}`);
    }

    console.info("[exam-import] Persistence verified", {
      examId: exam.id,
      questions: savedQuestionCount,
      options: savedOptionCount,
      groups: orderedGroups.length
    });
    return exam;
  } catch (error) {
    if (createdExamId) {
      try {
        await prisma.exam.delete({ where: { id: createdExamId } });
      } catch (cleanupError) {
        console.error("[exam-import] Failed to rollback partial exam", safeImportError(cleanupError));
      }
    }
    throw error;
  }
}

function validateImportedQuestions(questions: ImportedQuestion[]) {
  if (questions.length > 500) throw new Error("IMPORT_TOO_MANY_QUESTIONS");
  for (const [index, question] of questions.entries()) {
    if (!question.prompt.trim()) throw new Error(`IMPORT_INVALID_QUESTION:${index + 1}:EMPTY_PROMPT`);
    if (!Number.isFinite(question.points) || question.points <= 0) throw new Error(`IMPORT_INVALID_QUESTION:${index + 1}:POINTS`);
    const isChoice = question.questionType.includes("CHOICE") || question.questionType === "TRUE_FALSE";
    if (isChoice && question.options.length < 2) throw new Error(`IMPORT_INVALID_QUESTION:${index + 1}:OPTIONS`);
    if (question.options.length > 20) throw new Error(`IMPORT_INVALID_QUESTION:${index + 1}:TOO_MANY_OPTIONS`);
  }
}

function aiToImportedQuestion(question: AiQuestion): ImportedQuestion {
  return {
    title: question.title,
    prompt: question.prompt,
    skill: question.skill,
    questionType: question.questionType,
    options: [...question.options],
    answer: question.answer,
    points: question.points
  };
}

function importedToAiQuestion(question: ImportedQuestion): AiQuestion {
  const context = question.passageBody
    ? `CONTEXT:\n${question.passageBody}\n\nQUESTION:\n${question.prompt}`
    : question.prompt;
  return {
    title: question.title,
    prompt: context,
    skill: question.skill,
    questionType: question.questionType,
    options: question.options,
    answer: question.answer,
    points: question.points
  };
}

function mergeAiReview(original: ImportedQuestion, reviewed: AiQuestion): ImportedQuestion {
  return {
    ...original,
    skill: reviewed.skill,
    questionType: reviewed.questionType,
    options: reviewed.options.length ? reviewed.options : original.options,
    answer: reviewed.answer,
    points: reviewed.points
  };
}

function canReviewImportWithAi(questions: ImportedQuestion[]) {
  if (questions.length > 20) return false;
  const totalChars = questions.reduce((sum, question) => sum + (question.passageBody?.length ?? 0) + question.prompt.length + question.options.join(" ").length, 0);
  return totalChars <= 16_000;
}


function canReviewMissingAnswersWithAi(questions: ImportedQuestion[]) {
  if (questions.length === 0 || questions.length > 10) return false;
  const totalChars = questions.reduce(
    (sum, question) => sum + (question.passageBody?.length ?? 0) + question.prompt.length + question.options.join(" ").length,
    0
  );
  return totalChars <= 18_000;
}

function safeReviewedChoiceAnswer(answer: string, options: string[]) {
  const trimmed = answer.trim();
  const letter = trimmed.match(/^([A-D])(?:[\.)]|$)/i)?.[1]?.toUpperCase();
  if (letter && letter.charCodeAt(0) - 65 < options.length) return letter;
  const optionIndex = options.findIndex((option) => option.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  return optionIndex >= 0 ? String.fromCharCode(65 + optionIndex) : "";
}

function safeImportError(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  return { name: error.name, message: error.message, stack: error.stack?.split("\n").slice(0, 6).join("\n") };
}

function importErrorMessage(error: unknown, locale: string) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("IMPORT_UNSUPPORTED_FILE")) return locale === "en" ? "Unsupported file type." : "Định dạng file chưa được hỗ trợ.";
  if (message.includes("IMPORT_EMPTY")) return locale === "en" ? "No recognizable questions were found in this file." : "Không tìm thấy câu hỏi có cấu trúc hợp lệ trong file.";
  if (message.includes("IMPORT_TOO_MANY_QUESTIONS")) return locale === "en" ? "This file contains more than 500 questions. Split it into smaller files." : "File có hơn 500 câu hỏi. Hãy chia thành nhiều file nhỏ hơn.";
  if (message.includes("IMPORT_INVALID_QUESTION")) return locale === "en" ? "Some imported questions are incomplete or malformed. Review the Word formatting and try again." : "Một số câu hỏi import chưa đủ dữ liệu hoặc sai cấu trúc. Hãy kiểm tra định dạng Word rồi thử lại.";
  if (message.includes("IMPORT_SAVE_VERIFY_FAILED")) return locale === "en" ? "The draft was not saved completely, so the partial import was rolled back. Please try again." : "Đề chưa được lưu đầy đủ nên hệ thống đã rollback bản import dở. Hãy thử lại.";
  if (/mammoth|zip|docx/i.test(message)) return locale === "en" ? "The Word file could not be read. Try saving it again as .docx." : "Không đọc được file Word. Hãy lưu lại file dưới dạng .docx rồi thử lại.";
  return locale === "en" ? "The import could not be completed. Check the file and try again." : "Không thể import đề. Hãy kiểm tra file và thử lại.";
}

function normalizeImportRow(row: Record<string, unknown>): ImportedQuestion | null {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLocaleLowerCase(), String(value ?? "").trim()]));
  const prompt = normalized.prompt || normalized.question || normalized["câu hỏi"] || "";
  if (!prompt) return null;
  const skill = normalizeSkill(normalized.skill || normalized["kỹ năng"]);
  const questionType = normalizeQuestionType(normalized.type || normalized.questiontype || normalized["loại câu hỏi"]);
  return {
    title: normalized.title || normalized["tiêu đề"] || prompt.slice(0, 80),
    prompt,
    skill,
    questionType,
    options: splitOptions(normalized.options ?? normalized["lựa chọn"]),
    answer: normalized.answer || normalized["đáp án"] || "",
    points: Number(normalized.points || normalized["điểm"] || 1) || 1
  };
}

function parseWordQuestions(text: string) {
  const blocks = text
    .split(/\n\s*(?:---+|Q:|Question:|Câu hỏi:)\s*/i)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks.map(parseWordBlock).filter(isImportedQuestion);
}

function parseWordBlock(block: string): ImportedQuestion | null {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const optionLines = lines.filter((line) => /^[A-D][\).:-]\s+/i.test(line));
  const answerLine = lines.find((line) => /^(answer|đáp án)\s*:/i.test(line));
  const skillLine = lines.find((line) => /^skill\s*:/i.test(line));
  const typeLine = lines.find((line) => /^(type|loại)\s*:/i.test(line));
  const prompt = lines.find((line) => !/^(answer|đáp án|skill|type|loại)\s*:/i.test(line) && !/^[A-D][\).:-]\s+/i.test(line)) ?? "";
  if (!prompt) return null;
  return {
    title: prompt.slice(0, 80),
    prompt,
    skill: normalizeSkill(skillLine?.split(":").slice(1).join(":").trim()),
    questionType: normalizeQuestionType(typeLine?.split(":").slice(1).join(":").trim() || (optionLines.length ? "SINGLE_CHOICE" : "ESSAY")),
    options: optionLines.map((line) => line.replace(/^[A-D][\).:-]\s+/i, "").trim()),
    answer: answerLine?.split(":").slice(1).join(":").trim() ?? "",
    points: 1
  };
}

function parseCsv(csv: string) {
  const [headerLine, ...lines] = csv.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(headerLine).map((header) => header.trim());
  return lines.map((line) => Object.fromEntries(splitCsvLine(line).map((value, index) => [headers[index] ?? `col${index}`, value])));
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function normalizeSkill(value: string | undefined): Skill {
  const normalized = (value ?? "READING").trim().toLocaleUpperCase();
  if (supportedSkills.includes(normalized as (typeof supportedSkills)[number])) return normalized as Skill;
  if (normalized.includes("NGHE")) return "LISTENING";
  if (normalized.includes("NÓI") || normalized.includes("NOI")) return "SPEAKING";
  if (normalized.includes("VIẾT") || normalized.includes("VIET")) return "WRITING";
  return "READING";
}

function normalizeQuestionType(value: string | undefined): QuestionType {
  const normalized = (value ?? "SINGLE_CHOICE").trim().toLocaleUpperCase().replaceAll(" ", "_");
  if (supportedQuestionTypes.includes(normalized as (typeof supportedQuestionTypes)[number])) return normalized as QuestionType;
  if (normalized.includes("MULTIPLE")) return "MULTIPLE_CHOICE";
  if (normalized.includes("FILL")) return "FILL_BLANK";
  if (normalized.includes("ESSAY") || normalized.includes("TỰ_LUẬN") || normalized.includes("TU_LUAN")) return "ESSAY";
  return "SINGLE_CHOICE";
}

function splitOptions(value?: string) {
  return (value ?? "")
    .split(/\||\n|;/)
    .map((option) => option.replace(/^[A-D][\).:-]\s*/i, "").trim())
    .filter(Boolean);
}

function isImportedQuestion(question: ImportedQuestion | null): question is ImportedQuestion {
  return Boolean(question?.prompt);
}

function isCorrectOption(answer: string, option: string, optionIndex: number) {
  const answers = answer.split(/[,|;]/).map((item) => item.trim().toLocaleLowerCase()).filter(Boolean);
  const letter = String.fromCharCode(97 + optionIndex);
  return answers.includes(letter) || answers.includes(option.trim().toLocaleLowerCase());
}

function correctAnswerJson(question: ImportedQuestion) {
  if (question.questionType === "FILL_BLANK" || question.questionType === "LISTENING_FILL_BLANK") {
    return JSON.stringify([question.answer.split(/[,|;]/).map((item) => item.trim()).filter(Boolean)]);
  }
  if (question.questionType === "ORDERING") return JSON.stringify(splitOptions(question.answer));
  if (question.questionType === "MATCHING") return JSON.stringify({});
  return null;
}

function skillTitle(skill: Skill) {
  const labels: Record<Skill, string> = {
    LISTENING: "Listening",
    SPEAKING: "Speaking",
    READING: "Reading",
    WRITING: "Writing"
  };
  return labels[skill];
}
