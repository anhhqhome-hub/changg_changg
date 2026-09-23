"use client";

import { useActionState, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { askTeacherAgentAction, type TeacherAgentActionState } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";

type Message = { role: "teacher" | "agent"; content: string };

export function TeacherAgentChat({ locale }: { locale: string }) {
  const isEn = locale === "en";
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, formAction] = useActionState<TeacherAgentActionState, FormData>(askTeacherAgentAction, {});

  function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { role: "teacher", content: trimmed }]);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open ? (
        <div className="mb-3 flex h-[min(600px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-indigo-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="font-black">{isEn ? "Teacher assistant" : "Trợ lý giáo viên"}</p>
                <p className="text-xs text-indigo-100">{isEn ? "Ask about exams and classes" : "Hỏi về đề, lớp và học sinh"}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/10" aria-label={isEn ? "Close chat" : "Đóng chat"}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {!messages.length ? (
              <div className="rounded-xl border border-indigo-100 bg-white p-3 text-sm text-slate-600">
                <p className="font-bold text-slate-900">{isEn ? "How can I help?" : "Tôi có thể hỗ trợ gì?"}</p>
                <div className="mt-2 grid gap-2">
                  {(isEn ? ["How do I assign an exam?", "How should I format an Excel import?", "How do I set a deadline?"] : ["Làm sao để giao đề cho một lớp?", "File Excel import cần định dạng thế nào?", "Đặt hạn nộp bài ra sao?"]).map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold hover:border-indigo-300 hover:bg-indigo-50">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${message.role === "teacher" ? "ml-auto bg-indigo-600 text-white" : "bg-white text-slate-700 shadow-sm"}`}>
                {message.content}
              </div>
            ))}
            {state.answer ? <div className="max-w-[90%] whitespace-pre-wrap rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">{state.answer}</div> : null}
            {state.error ? <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700" role="alert">{state.error}</p> : null}
          </div>
          <form action={formAction} onSubmit={submitQuestion} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input type="hidden" name="locale" value={locale} />
            <input name="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={isEn ? "Ask a question..." : "Nhập câu hỏi..."} maxLength={1000} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            <Button type="submit" size="icon" aria-label={isEn ? "Send question" : "Gửi câu hỏi"} disabled={!question.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="h-12 rounded-full px-5 shadow-lg">
          <MessageCircle className="h-5 w-5" /> {isEn ? "Ask assistant" : "Hỏi trợ lý"}
        </Button>
      )}
    </div>
  );
}
