"use client";

import { cn } from "@/lib/cn";
import type { Format } from "@/lib/types";

const OPTIONS: { value: Format; label: string; hint: string }[] = [
  { value: "pfp", label: "PFP Frame", hint: "For your X profile picture" },
  { value: "card", label: "Builder ID", hint: "A card built to post" },
];

interface Props {
  value: Format;
  onChange: (format: Format) => void;
  disabled?: boolean;
}

export function FormatPicker({ value, onChange, disabled }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Output format"
      className="grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 transition-all duration-200",
              active
                ? "bg-sunset text-night shadow-[0_14px_36px_-16px_rgba(255,110,90,0.9)]"
                : "text-muted hover:bg-white/5 hover:text-ink",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <span className="font-display text-sm font-bold">{option.label}</span>
            <span className={cn("text-[0.7rem]", active ? "text-night/70" : "text-muted")}>
              {option.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
