"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Shuffle, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GameQuestion = { id: string; prompt: string; options: { label: string; value: string; isCorrect: boolean }[] };

export function KnowledgeGames({ questions }: { questions: GameQuestion[] }) {
  const [mode, setMode] = useState<"choice" | "arrange">("choice");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const question = questions[index];
  const words = useMemo(() => question?.prompt.split(/\s+/).filter(Boolean).sort((a, b) => a.localeCompare(b)) ?? [], [question]);

  if (!question) {
    return <Card><CardContent className="p-6 text-sm font-semibold text-slate-600">Chưa có đủ câu hỏi từ các bài giáo viên giao để mở trò chơi.</CardContent></Card>;
  }

  function next() {
    setIndex((current) => (current + 1) % questions.length);
    setAnswered(null);
    setSelectedWords([]);
  }

  function chooseOption(isCorrect: boolean) {
    if (answered !== null) return;
    setAnswered(isCorrect);
    if (isCorrect) setScore((current) => current + 1);
  }

  function chooseWord(word: string, wordIndex: number) {
    setSelectedWords((current) => [...current, `${word}::${wordIndex}`]);
  }

  const arranged = selectedWords.map((item) => item.split("::")[0]).join(" ");
  const expected = question.prompt.trim();
  const arrangeAnswered = selectedWords.length === words.length;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div><CardTitle>Trò chơi kiến thức</CardTitle><p className="mt-1 text-sm text-slate-500">Lấy câu hỏi từ các bài giáo viên đã giao.</p></div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={mode === "choice" ? "default" : "outline"} onClick={() => { setMode("choice"); setAnswered(null); setSelectedWords([]); }}><CheckCircle2 className="h-4 w-4" />Chọn đáp án</Button>
          <Button type="button" size="sm" variant={mode === "arrange" ? "default" : "outline"} onClick={() => { setMode("arrange"); setAnswered(null); setSelectedWords([]); }}><Shuffle className="h-4 w-4" />Sắp xếp câu</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500"><span>Câu {index + 1}/{questions.length}</span><span>Điểm {score}</span></div>
        <p className="rounded-md bg-slate-50 p-4 text-base font-bold text-slate-900">{mode === "choice" ? question.prompt : "Hãy sắp xếp các từ thành câu đúng."}</p>
        {mode === "choice" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => <button key={option.value} type="button" disabled={answered !== null} onClick={() => chooseOption(option.isCorrect)} className="rounded-md border border-slate-200 bg-white p-3 text-left text-sm font-semibold transition hover:border-indigo-400 disabled:cursor-default"><span className="mr-2 font-black text-indigo-700">{option.label}</span>{option.value}</button>)}
          </div>
        ) : (
          <>
            <div className="flex min-h-12 flex-wrap gap-2 rounded-md border border-dashed border-slate-300 p-3">{selectedWords.map((item) => <span key={item} className="rounded bg-indigo-100 px-2 py-1 text-sm font-bold text-indigo-800">{item.split("::")[0]}</span>)}</div>
            <div className="flex flex-wrap gap-2">{words.map((word, wordIndex) => <Button key={`${word}-${wordIndex}`} type="button" size="sm" variant="outline" disabled={selectedWords.some((item) => item.endsWith(`::${wordIndex}`)) || arrangeAnswered} onClick={() => chooseWord(word, wordIndex)}>{word}</Button>)}</div>
            {arrangeAnswered ? <p className={`flex items-center gap-2 text-sm font-bold ${arranged === expected ? "text-emerald-700" : "text-rose-700"}`}>{arranged === expected ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {arranged === expected ? "Chính xác!" : `Đáp án: ${expected}`}</p> : null}
          </>
        )}
        {answered !== null ? <p className={`flex items-center gap-2 text-sm font-bold ${answered ? "text-emerald-700" : "text-rose-700"}`}>{answered ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{answered ? "Chính xác!" : "Chưa đúng, thử câu tiếp theo nhé."}</p> : null}
        <div className="flex flex-wrap gap-2"><Button type="button" onClick={next}><Sparkles className="h-4 w-4" />Câu tiếp theo</Button><Button type="button" variant="outline" onClick={() => { setScore(0); setIndex(0); setAnswered(null); setSelectedWords([]); }}><RotateCcw className="h-4 w-4" />Chơi lại</Button></div>
      </CardContent>
    </Card>
  );
}
