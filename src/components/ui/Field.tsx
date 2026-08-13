"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
  /** Small right-aligned hint inside the label row — e.g. a ticket field name. */
  hint?: string;
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  disabled,
  autoComplete,
  hint,
}: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label text-lemon">
          {label}
        </label>
        {hint && <span className="label text-muted/70">{hint}</span>}
      </div>

      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-12 w-full rounded-lg border-2 bg-jungle-panel px-4 font-condensed text-lg tracking-wide text-paper uppercase transition-colors placeholder:text-muted/45 placeholder:normal-case disabled:opacity-50",
          error ? "border-magenta" : "border-jungle-line focus:border-lemon",
        )}
      />

      {error && (
        <p id={errorId} role="alert" className="label text-magenta">
          {error}
        </p>
      )}
    </div>
  );
}
