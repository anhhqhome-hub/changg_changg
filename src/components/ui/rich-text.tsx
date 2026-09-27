import type { ReactNode } from "react";

export function RichText({ value, className = "" }: { value: string; className?: string }) {
  const lines = value.split(/\r?\n/);
  return (
    <span className={className}>
      {lines.map((line, index) => (
        <span key={`${index}-${line}`}>
          {index > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </span>
  );
}

function renderInline(value: string): ReactNode[] {
  return value.split(/(\*\*[\s\S]*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={`${index}-${part}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${index}-${part}`}>{part}</span>;
  });
}
