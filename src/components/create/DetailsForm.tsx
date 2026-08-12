"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import type { GenerateFields } from "@/lib/types";

interface Props {
  fields: GenerateFields;
  onChange: (fields: GenerateFields) => void;
  onReroll: () => void;
  errors: Partial<Record<keyof GenerateFields, string>>;
  disabled?: boolean;
}

const INPUT =
  "min-h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-coral/70 focus:bg-white/[0.07]";

export function DetailsForm({ fields, onChange, onReroll, errors, disabled }: Props) {
  const nameId = useId();
  const stackId = useId();

  return (
    <div className="flex flex-col gap-4">
      <Field
        id={nameId}
        label="Name"
        error={errors.name}
        hint={`${fields.name.length}/28`}
      >
        <input
          id={nameId}
          value={fields.name}
          onChange={(e) => onChange({ ...fields, name: e.target.value.slice(0, 28) })}
          placeholder="Aditi Raikar"
          maxLength={28}
          disabled={disabled}
          autoComplete="name"
          enterKeyHint="next"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          className={cn(INPUT, errors.name && "border-coral")}
        />
      </Field>

      <Field
        id={stackId}
        label="Stack / role"
        error={errors.stack}
        hint={`${fields.stack.length}/32`}
      >
        <input
          id={stackId}
          value={fields.stack}
          onChange={(e) => onChange({ ...fields, stack: e.target.value.slice(0, 32) })}
          placeholder="Full-stack · TypeScript"
          maxLength={32}
          disabled={disabled}
          enterKeyHint="done"
          aria-invalid={Boolean(errors.stack)}
          aria-describedby={errors.stack ? `${stackId}-error` : undefined}
          className={cn(INPUT, errors.stack && "border-coral")}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="font-display text-xs font-bold tracking-[0.16em] text-muted uppercase">
          Builder title
        </span>
        <div className="flex items-center gap-2.5">
          <p
            aria-live="polite"
            className="flex min-h-12 flex-1 items-center rounded-xl bg-sunset px-4 font-display font-bold text-night"
          >
            {fields.title}
          </p>
          <button
            type="button"
            onClick={onReroll}
            disabled={disabled}
            aria-label="Get a different builder title"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-muted transition-colors hover:border-white/25 hover:text-ink disabled:opacity-45"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
              <path
                d="M3 12a9 9 0 0 1 15.3-6.4L21 8m0 0V3m0 5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16m0 0v5m0-5h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted">Picked from 40 curated titles. Reroll for another.</p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="font-display text-xs font-bold tracking-[0.16em] text-muted uppercase"
        >
          {label}
        </label>
        {hint && <span className="text-[0.7rem] tabular-nums text-muted/70">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
