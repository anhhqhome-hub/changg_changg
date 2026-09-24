export type AdminFieldType = "String" | "Int" | "Float" | "Boolean" | "DateTime" | "Enum";
export type AdminDataField = { name: string; type: AdminFieldType; required: boolean; hasDefault: boolean; readOnly: boolean; enumValues?: readonly string[]; relationModel?: string; };
export type AdminDataEntity = { key: string; model: string; delegate: string; labelVi: string; labelEn: string; fields: readonly AdminDataField[]; };
export const adminDataCatalog = [
  {
    key: "studentProfile", model: "StudentProfile", delegate: "studentProfile", labelVi: "Hồ sơ học sinh", labelEn: "StudentProfile",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "userId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "schoolId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "School" },
      { name: "studentCode", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "phoneNumber", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "dateOfBirth", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "gender", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "schoolName", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "gradeLevel", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "englishLevel", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "parentContact", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "notes", type: "String", required: false, hasDefault: false, readOnly: false },
    ]
  },
  {
    key: "school", model: "School", delegate: "school", labelVi: "Trường học", labelEn: "School",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "name", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "code", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "address", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "contact", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "active", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "teacherProfile", model: "TeacherProfile", delegate: "teacherProfile", labelVi: "Hồ sơ giáo viên", labelEn: "TeacherProfile",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "userId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "schoolId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "School" },
      { name: "teacherCode", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "displayName", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "bio", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "phoneNumber", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "specialization", type: "String", required: false, hasDefault: false, readOnly: false },
    ]
  },
  {
    key: "academicYear", model: "AcademicYear", delegate: "academicYear", labelVi: "Năm học", labelEn: "AcademicYear",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "name", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "startDate", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "endDate", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "active", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "class", model: "Class", delegate: "class", labelVi: "Lớp học", labelEn: "Class",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "name", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "description", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "archivedAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "teacherId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "schoolId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "School" },
      { name: "academicYearId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "AcademicYear" },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "classMembership", model: "ClassMembership", delegate: "classMembership", labelVi: "Thành viên lớp", labelEn: "ClassMembership",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "classId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "Class" },
      { name: "studentId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "mediaAsset", model: "MediaAsset", delegate: "mediaAsset", labelVi: "Tệp đa phương tiện", labelEn: "MediaAsset",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "storageKey", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "originalFilename", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "mimeType", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "sizeBytes", type: "Int", required: true, hasDefault: false, readOnly: false },
      { name: "durationSeconds", type: "Int", required: false, hasDefault: false, readOnly: false },
      { name: "uploadedById", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "protected", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "readingPassage", model: "ReadingPassage", delegate: "readingPassage", labelVi: "Bài đọc", labelEn: "ReadingPassage",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "body", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "instructions", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "imageAssetId", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "questionBankItem", model: "QuestionBankItem", delegate: "questionBankItem", labelVi: "Ngân hàng câu hỏi", labelEn: "QuestionBankItem",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "prompt", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "instructions", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "skill", type: "Enum", required: true, hasDefault: false, readOnly: false, enumValues: ["LISTENING", "SPEAKING", "READING", "WRITING"] as const },
      { name: "questionType", type: "Enum", required: true, hasDefault: false, readOnly: false, enumValues: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER", "ESSAY", "MATCHING", "ORDERING", "LISTENING_CHOICE", "LISTENING_FILL_BLANK", "SPEAKING_RECORDING", "READING_SINGLE_CHOICE", "READING_MULTIPLE_CHOICE"] as const },
      { name: "difficulty", type: "Enum", required: true, hasDefault: true, readOnly: false, enumValues: ["EASY", "MEDIUM", "HARD"] as const },
      { name: "points", type: "Float", required: true, hasDefault: true, readOnly: false },
      { name: "tagsJson", type: "String", required: true, hasDefault: true, readOnly: false },
      { name: "cefrLevel", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "topic", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "grammarArea", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "vocabularyTopic", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "correctAnswersJson", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "settingsJson", type: "String", required: true, hasDefault: true, readOnly: false },
      { name: "createdById", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "questionBankOption", model: "QuestionBankOption", delegate: "questionBankOption", labelVi: "Đáp án câu hỏi", labelEn: "QuestionBankOption",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "questionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "QuestionBankItem" },
      { name: "label", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "value", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "isCorrect", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "sortOrder", type: "Int", required: true, hasDefault: true, readOnly: false },
    ]
  },
  {
    key: "rubric", model: "Rubric", delegate: "rubric", labelVi: "Rubric", labelEn: "Rubric",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "name", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "skill", type: "Enum", required: true, hasDefault: false, readOnly: false, enumValues: ["LISTENING", "SPEAKING", "READING", "WRITING"] as const },
      { name: "description", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "createdById", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "rubricCriterion", model: "RubricCriterion", delegate: "rubricCriterion", labelVi: "Tiêu chí rubric", labelEn: "RubricCriterion",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "rubricId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "Rubric" },
      { name: "name", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "description", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "maxPoints", type: "Float", required: true, hasDefault: false, readOnly: false },
      { name: "descriptors", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "sortOrder", type: "Int", required: true, hasDefault: true, readOnly: false },
    ]
  },
  {
    key: "exam", model: "Exam", delegate: "exam", labelVi: "Bài thi", labelEn: "Exam",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "description", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "createdById", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "examVersion", model: "ExamVersion", delegate: "examVersion", labelVi: "Phiên bản bài thi", labelEn: "ExamVersion",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "examId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "Exam" },
      { name: "versionNumber", type: "Int", required: true, hasDefault: false, readOnly: false },
      { name: "status", type: "Enum", required: true, hasDefault: true, readOnly: false, enumValues: ["DRAFT", "PUBLISHED", "ARCHIVED"] as const },
      { name: "mode", type: "Enum", required: true, hasDefault: true, readOnly: false, enumValues: ["TEST", "PRACTICE"] as const },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "description", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "instructions", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "availableFrom", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "deadline", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "timeLimitMinutes", type: "Int", required: false, hasDefault: false, readOnly: false },
      { name: "attemptsAllowed", type: "Int", required: true, hasDefault: true, readOnly: false },
      { name: "passingScore", type: "Float", required: false, hasDefault: false, readOnly: false },
      { name: "shuffleQuestions", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "shuffleOptions", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "showScoreAfterSubmit", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "showCorrectAnswersAfterSubmit", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "allowLateSubmission", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "resultsReleaseMode", type: "Enum", required: true, hasDefault: true, readOnly: false, enumValues: ["IMMEDIATE", "AFTER_DEADLINE", "MANUAL"] as const },
      { name: "publishedAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "examSection", model: "ExamSection", delegate: "examSection", labelVi: "Phần thi", labelEn: "ExamSection",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "versionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamVersion" },
      { name: "skill", type: "Enum", required: true, hasDefault: false, readOnly: false, enumValues: ["LISTENING", "SPEAKING", "READING", "WRITING"] as const },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "enabled", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "sortOrder", type: "Int", required: true, hasDefault: true, readOnly: false },
    ]
  },
  {
    key: "questionGroup", model: "QuestionGroup", delegate: "questionGroup", labelVi: "Nhóm câu hỏi", labelEn: "QuestionGroup",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "sectionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamSection" },
      { name: "title", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "instructions", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "mediaAssetId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "MediaAsset" },
      { name: "readingPassageId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "ReadingPassage" },
      { name: "sortOrder", type: "Int", required: true, hasDefault: true, readOnly: false },
    ]
  },
  {
    key: "examQuestion", model: "ExamQuestion", delegate: "examQuestion", labelVi: "Câu hỏi trong đề", labelEn: "ExamQuestion",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "groupId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "QuestionGroup" },
      { name: "bankItemId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "QuestionBankItem" },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "prompt", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "instructions", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "skill", type: "Enum", required: true, hasDefault: false, readOnly: false, enumValues: ["LISTENING", "SPEAKING", "READING", "WRITING"] as const },
      { name: "questionType", type: "Enum", required: true, hasDefault: false, readOnly: false, enumValues: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER", "ESSAY", "MATCHING", "ORDERING", "LISTENING_CHOICE", "LISTENING_FILL_BLANK", "SPEAKING_RECORDING", "READING_SINGLE_CHOICE", "READING_MULTIPLE_CHOICE"] as const },
      { name: "difficulty", type: "Enum", required: true, hasDefault: true, readOnly: false, enumValues: ["EASY", "MEDIUM", "HARD"] as const },
      { name: "points", type: "Float", required: true, hasDefault: true, readOnly: false },
      { name: "tagsJson", type: "String", required: true, hasDefault: true, readOnly: false },
      { name: "correctAnswersJson", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "settingsJson", type: "String", required: true, hasDefault: true, readOnly: false },
      { name: "rubricId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "Rubric" },
      { name: "sortOrder", type: "Int", required: true, hasDefault: true, readOnly: false },
    ]
  },
  {
    key: "examQuestionOption", model: "ExamQuestionOption", delegate: "examQuestionOption", labelVi: "Đáp án trong đề", labelEn: "ExamQuestionOption",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "questionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamQuestion" },
      { name: "label", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "value", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "isCorrect", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "sortOrder", type: "Int", required: true, hasDefault: true, readOnly: false },
    ]
  },
  {
    key: "examAssignment", model: "ExamAssignment", delegate: "examAssignment", labelVi: "Giao bài", labelEn: "ExamAssignment",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "examId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "Exam" },
      { name: "versionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamVersion" },
      { name: "targetType", type: "Enum", required: true, hasDefault: false, readOnly: false, enumValues: ["CLASS", "STUDENT"] as const },
      { name: "classId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "Class" },
      { name: "studentId", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "academicYearId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "AcademicYear" },
      { name: "createdById", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "examAttempt", model: "ExamAttempt", delegate: "examAttempt", labelVi: "Lượt làm bài", labelEn: "ExamAttempt",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "assignmentId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamAssignment" },
      { name: "studentId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "versionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamVersion" },
      { name: "attemptNumber", type: "Int", required: true, hasDefault: false, readOnly: false },
      { name: "startedAt", type: "DateTime", required: true, hasDefault: true, readOnly: false },
      { name: "expiresAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "submittedAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "status", type: "Enum", required: true, hasDefault: true, readOnly: false, enumValues: ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "GRADING", "GRADED"] as const },
      { name: "autoScore", type: "Float", required: true, hasDefault: true, readOnly: false },
      { name: "manualScore", type: "Float", required: true, hasDefault: true, readOnly: false },
      { name: "finalScore", type: "Float", required: true, hasDefault: true, readOnly: false },
      { name: "totalPoints", type: "Float", required: true, hasDefault: true, readOnly: false },
      { name: "timeSpentSec", type: "Int", required: false, hasDefault: false, readOnly: false },
      { name: "releaseResults", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "attemptAnswer", model: "AttemptAnswer", delegate: "attemptAnswer", labelVi: "Bài trả lời", labelEn: "AttemptAnswer",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "attemptId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamAttempt" },
      { name: "questionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamQuestion" },
      { name: "selectedOptionIdsJson", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "textAnswer", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "blankAnswersJson", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "matchingAnswersJson", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "orderingAnswersJson", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "audioAssetId", type: "String", required: false, hasDefault: false, readOnly: false, relationModel: "MediaAsset" },
      { name: "isFlagged", type: "Boolean", required: true, hasDefault: true, readOnly: false },
      { name: "clientUpdatedAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "score", type: "Float", required: false, hasDefault: false, readOnly: false },
      { name: "feedback", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "manualGrade", model: "ManualGrade", delegate: "manualGrade", labelVi: "Điểm chấm tay", labelEn: "ManualGrade",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "attemptId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ExamAttempt" },
      { name: "teacherId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "score", type: "Float", required: true, hasDefault: true, readOnly: false },
      { name: "comments", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "finalizedAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "criterionGrade", model: "CriterionGrade", delegate: "criterionGrade", labelVi: "Điểm theo tiêu chí", labelEn: "CriterionGrade",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "gradeId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "ManualGrade" },
      { name: "criterionId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "RubricCriterion" },
      { name: "score", type: "Float", required: true, hasDefault: false, readOnly: false },
      { name: "comments", type: "String", required: false, hasDefault: false, readOnly: false },
    ]
  },
  {
    key: "notification", model: "Notification", delegate: "notification", labelVi: "Thông báo", labelEn: "Notification",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "userId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "type", type: "Enum", required: true, hasDefault: true, readOnly: false, enumValues: ["INFO", "EXAM_ASSIGNED", "DEADLINE_APPROACHING", "RESULT_RELEASED", "SUBMISSION_RECEIVED", "ACCOUNT_PENDING"] as const },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "body", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "href", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "readAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "teacherTask", model: "TeacherTask", delegate: "teacherTask", labelVi: "Công việc giáo viên", labelEn: "TeacherTask",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "teacherId", type: "String", required: true, hasDefault: false, readOnly: false, relationModel: "User" },
      { name: "title", type: "String", required: true, hasDefault: false, readOnly: false },
      { name: "description", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "priority", type: "String", required: true, hasDefault: true, readOnly: false },
      { name: "dueAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "completedAt", type: "DateTime", required: false, hasDefault: false, readOnly: false },
      { name: "createdAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
  {
    key: "siteSetting", model: "SiteSetting", delegate: "siteSetting", labelVi: "Cài đặt website", labelEn: "SiteSetting",
    fields: [
      { name: "id", type: "String", required: true, hasDefault: true, readOnly: true },
      { name: "founderName", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "founderTitle", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "founderTitleEn", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "founderQuote", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "founderQuoteEn", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "founderPhotoUrl", type: "String", required: false, hasDefault: false, readOnly: false },
      { name: "updatedAt", type: "DateTime", required: true, hasDefault: true, readOnly: true },
    ]
  },
] as const satisfies readonly AdminDataEntity[];
export type AdminDataEntityKey = (typeof adminDataCatalog)[number]["key"];
export function getAdminDataEntity(key: string): AdminDataEntity | null { return adminDataCatalog.find((item) => item.key === key) ?? null; }
