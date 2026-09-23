"use client";

import { useState, type ReactNode } from "react";
import { Bell, Bot, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TriggerIcon = "bell" | "plus" | "bot";

const triggerIcons = {
  bell: Bell,
  plus: Plus,
  bot: Bot
};

export function Modal({
  triggerLabel,
  triggerIcon,
  triggerBadge,
  triggerVariant = "default",
  title,
  description,
  children
}: {
  triggerLabel: string;
  triggerIcon?: TriggerIcon;
  triggerBadge?: number;
  triggerVariant?: "default" | "outline" | "secondary";
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = triggerIcon ? triggerIcons[triggerIcon] : null;

  return (
    <>
      <Button type="button" variant={triggerVariant} className={cn(triggerVariant === "outline" && "bg-white")} onClick={() => setIsOpen(true)}>
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {triggerLabel}
        {triggerBadge ? <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{triggerBadge}</span> : null}
      </Button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-[min(92vw,620px)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close popup">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
          </section>
        </div>
      ) : null}
    </>
  );
}
