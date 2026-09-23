"use client";

export function QuestionNavigator({
  current,
  total,
  answered,
  flagged,
  onSelect
}: {
  current: number;
  total: number;
  answered: Set<number>;
  flagged: Set<number>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-5">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          className={`h-10 rounded-md border text-sm font-bold ${
            current === index ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-800"
          }`}
          aria-label={`Question ${index + 1}${answered.has(index) ? " answered" : " unanswered"}${flagged.has(index) ? " flagged" : ""}`}
        >
          {index + 1}
          <span className="ml-0.5 text-[10px]">{flagged.has(index) ? "!" : answered.has(index) ? "✓" : "–"}</span>
        </button>
      ))}
    </div>
  );
}
