"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function QuestionSlideNavigator({ slides, labels, previousLabel, nextLabel }: { slides: ReactNode[]; labels: string[]; previousLabel: string; nextLabel: string }) {
  const [current, setCurrent] = useState(0);
  if (!slides.length) return null;
  return (
    <div className="space-y-3">
      <div>{slides[current]}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Button type="button" variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
          <ChevronLeft className="h-4 w-4" /> {previousLabel}
        </Button>
        <div className="text-center text-xs font-black text-slate-500">
          <p>{labels[current]}</p>
          <div className="mt-2 flex justify-center gap-1.5" aria-label="Question sections">
            {slides.map((_, index) => <button key={index} type="button" aria-label={labels[index]} onClick={() => setCurrent(index)} className={`h-2 rounded-full transition-all ${index === current ? "w-8 bg-indigo-600" : "w-2 bg-slate-300 hover:bg-indigo-300"}`} />)}
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={current === slides.length - 1} onClick={() => setCurrent((value) => Math.min(slides.length - 1, value + 1))}>
          {nextLabel} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
