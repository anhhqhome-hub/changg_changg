import Link from "next/link";
import { ArrowLeft, Check, FileSpreadsheet, FileText, ShieldCheck } from "lucide-react";
import { importExamFromFileAction } from "@/actions/teacher-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportExamForm } from "@/components/teacher/import-exam-form";

export default async function ImportExamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const text = isEn
    ? {
        eyebrow: "Fast exam creation",
        title: "Create an exam from a file",
        subtitle: "Upload your existing Word, Excel or CSV file. We will create a draft that you can review before publishing.",
        upload: "Import exam",
        name: "1. Name your exam",
        titlePlaceholder: "Mini test Unit 3 - School life",
        choose: "2. Choose your file",
        limit: "Word, Excel or CSV · maximum 5MB",
        aiReview: "Let AI check and clean up the questions",
        submit: "Import and open builder",
        submitting: "Importing...",
        noFile: "Choose an exam file before continuing.",
        invalidFile: "Use a .docx, .xlsx, .xls or .csv file.",
        fileTooLarge: "The file must be 5MB or smaller.",
        back: "Back to exam workspace",
        guideTitle: "Prepare your file",
        guideSubtitle: "A little structure helps us import your questions accurately.",
        excel: "Excel / CSV",
        excelHint: "One question per row",
        word: "Word",
        wordHint: "Supports Q:/--- and Quizzi Word format with underlined correct answers",
        draftNote: "Your exam is created as a draft. You can edit questions, answers and points in the builder.",
        steps: ["Upload file", "Check questions", "Review draft"]
      }
    : {
        eyebrow: "Tạo đề nhanh",
        title: "Tạo đề từ file có sẵn",
        subtitle: "Upload file Word, Excel hoặc CSV. Hệ thống sẽ tạo bản nháp để bạn rà soát trước khi xuất bản.",
        upload: "Import đề",
        name: "1. Đặt tên cho đề",
        titlePlaceholder: "Bài kiểm tra Unit 3 - School life",
        choose: "2. Chọn file đề",
        limit: "Word, Excel hoặc CSV · tối đa 5MB",
        aiReview: "Nhờ AI kiểm tra và làm sạch câu hỏi",
        submit: "Import và mở trình soạn đề",
        submitting: "Đang import...",
        noFile: "Hãy chọn file đề trước khi tiếp tục.",
        invalidFile: "Hãy dùng file .docx, .xlsx, .xls hoặc .csv.",
        fileTooLarge: "File phải có dung lượng tối đa 5MB.",
        back: "Quay lại kho đề",
        guideTitle: "Chuẩn bị file",
        guideSubtitle: "File có cấu trúc rõ sẽ được import chính xác hơn.",
        excel: "Excel / CSV",
        excelHint: "Mỗi dòng là một câu hỏi",
        word: "Word",
        wordHint: "Hỗ trợ Q:/--- và Word Quizzi; đáp án gạch chân được nhận tự động",
        draftNote: "Đề sẽ được tạo ở trạng thái bản nháp. Bạn có thể sửa câu hỏi, đáp án và điểm trong trình soạn đề.",
        steps: ["Chọn file", "Kiểm tra câu hỏi", "Rà soát bản nháp"]
      };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href={`/${locale}/teacher/exams`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-700">
        <ArrowLeft className="h-4 w-4" /> {text.back}
      </Link>
      <section className="rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-100 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-100">{text.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black md:text-3xl">{text.title}</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-indigo-100">{text.subtitle}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {text.steps.map((step, index) => (
            <div key={step} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs text-indigo-700">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{text.upload}</CardTitle>
          </CardHeader>
          <CardContent>
            <ImportExamForm action={importExamFromFileAction} locale={locale} text={text} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{text.guideTitle}</CardTitle>
              <p className="text-sm text-slate-500">{text.guideSubtitle}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <GuideRow icon={FileSpreadsheet} title={text.excel} hint={text.excelHint} />
              <GuideRow icon={FileText} title={text.word} hint={text.wordHint} />
              <div className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                {text.draftNote}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GuideRow({
  icon: Icon,
  title,
  hint
}: {
  icon: typeof FileText;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-xs font-medium text-slate-500">{hint}</p>
      </div>
      <Check className="ml-auto h-4 w-4 text-emerald-600" />
    </div>
  );
}
