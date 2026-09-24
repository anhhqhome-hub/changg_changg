export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTeacherReportData } from "@/lib/reporting";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const teacher = await prisma.user.findFirst({ where: { id: session.user.id, role: "TEACHER", status: "APPROVED" }, select: { id: true } });
  if (!teacher) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const academicYearId = request.nextUrl.searchParams.get("academicYearId") || undefined;
  const classId = request.nextUrl.searchParams.get("classId") || undefined;
  const studentId = request.nextUrl.searchParams.get("studentId") || undefined;
  const { attempts, summary } = await getTeacherReportData({ teacherId: teacher.id, academicYearId, classId, studentId });

  const wb = XLSX.utils.book_new();
  const summaryRows = summary.map((row) => ({
    "Học sinh": row.name,
    Username: row.username ?? "",
    "Số bài kiểm tra": row.testCount,
    "TB kiểm tra (%)": row.averageTest ?? "",
    "Lượt luyện tập": row.practiceAttempts,
    "Luyện tập tốt nhất (%)": row.bestPractice ?? "",
    "Tiến bộ luyện tập (%)": row.practiceImprovement ?? ""
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Tong hop");

  const testRows = attempts.filter((item) => item.version.mode === "TEST").map((attempt) => ({
    "Học sinh": attempt.student.name,
    Username: attempt.student.username ?? "",
    "Năm học": attempt.assignment.academicYear?.name ?? attempt.assignment.class?.academicYear?.name ?? "",
    "Lớp": attempt.assignment.class?.name ?? "Cá nhân",
    "Bài kiểm tra": attempt.version.title,
    "Lượt": attempt.attemptNumber,
    "Điểm": attempt.finalScore,
    "Tổng điểm": attempt.totalPoints,
    "Tỷ lệ (%)": attempt.totalPoints > 0 ? Math.round((attempt.finalScore / attempt.totalPoints) * 1000) / 10 : 0,
    "Bắt đầu": attempt.startedAt.toISOString(),
    "Nộp bài": attempt.submittedAt?.toISOString() ?? "",
    "Thời gian (giây)": attempt.timeSpentSec ?? ""
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(testRows), "Kiem tra");

  const practiceRows = attempts.filter((item) => item.version.mode === "PRACTICE").map((attempt) => ({
    "Học sinh": attempt.student.name,
    Username: attempt.student.username ?? "",
    "Năm học": attempt.assignment.academicYear?.name ?? attempt.assignment.class?.academicYear?.name ?? "",
    "Lớp": attempt.assignment.class?.name ?? "Cá nhân",
    "Bài luyện tập": attempt.version.title,
    "Lượt luyện": attempt.attemptNumber,
    "Điểm": attempt.finalScore,
    "Tổng điểm": attempt.totalPoints,
    "Tỷ lệ (%)": attempt.totalPoints > 0 ? Math.round((attempt.finalScore / attempt.totalPoints) * 1000) / 10 : 0,
    "Bắt đầu": attempt.startedAt.toISOString(),
    "Nộp bài": attempt.submittedAt?.toISOString() ?? "",
    "Thời gian (giây)": attempt.timeSpentSec ?? ""
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(practiceRows), "Luyen tap");

  const output = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const suffix = academicYearId ? `-${academicYearId.slice(0, 8)}` : "";
  return new NextResponse(new Uint8Array(output), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bao-cao-hoc-tap${suffix}.xlsx"`,
      "Cache-Control": "no-store"
    }
  });
}
