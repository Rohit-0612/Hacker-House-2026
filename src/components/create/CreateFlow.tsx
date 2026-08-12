"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { randomBuilderTitle } from "@/lib/builder-titles";
import { toDisplayableImage } from "@/lib/heic";
import { isApiError, type Format, type GenerateFields, type GenerateResult } from "@/lib/types";
import { fieldsSchema, validateFile } from "@/lib/validate";
import { DetailsForm } from "./DetailsForm";
import { Dropzone } from "./Dropzone";
import { FormatPicker } from "./FormatPicker";
import { ResultPanel } from "./ResultPanel";

type Phase = "editing" | "generating" | "done";

const EMPTY_FIELDS: GenerateFields = { name: "", stack: "", title: "" };

export function CreateFlow() {
  const [format, setFormat] = useState<Format>("pfp");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [fields, setFields] = useState<GenerateFields>(() => ({
    ...EMPTY_FIELDS,
    title: randomBuilderTitle(),
  }));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof GenerateFields, string>>>({});
  const [phase, setPhase] = useState<Phase>("editing");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [progress, setProgress] = useState(0);

  // Object URLs are revoked on replace and unmount; leaking them pins the whole
  // decoded bitmap in memory, which matters on phones.
  const previewRef = useRef<string | null>(null);
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const selectFile = useCallback(async (incoming: File) => {
    setError(null);

    const problem = validateFile(incoming);
    if (problem) {
      setError(problem);
      return;
    }

    setConverting(true);
    try {
      // HEIC has to become JPEG before any browser but Safari can preview it.
      const usable = await toDisplayableImage(incoming);
      setFile(usable);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(usable);
      });
    } catch {
      setError("We couldn't read that photo. Try exporting it as JPG.");
    } finally {
      setConverting(false);
    }
  }, []);

  const generate = useCallback(async () => {
    if (!file) {
      setError("Pick a photo first.");
      return;
    }

    if (format === "card") {
      const parsed = fieldsSchema.safeParse(fields);
      if (!parsed.success) {
        const next: Partial<Record<keyof GenerateFields, string>> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof GenerateFields;
          if (key && !next[key]) next[key] = issue.message;
        }
        setFieldErrors(next);
        return;
      }
    }

    setFieldErrors({});
    setError(null);
    setPhase("generating");
    setProgress(0);

    // Eases toward 90% so the bar always feels alive; the real response snaps
    // it to 100. Honest about progress without faking completion.
    const timer = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.18));
    }, 140);

    try {
      const body = new FormData();
      body.set("photo", file);
      body.set("format", format);
      if (format === "card") {
        body.set("name", fields.name);
        body.set("stack", fields.stack);
        body.set("title", fields.title);
      }

      const res = await fetch("/api/generate", { method: "POST", body });
      const payload: unknown = await res.json();

      if (!res.ok) {
        setError(isApiError(payload) ? payload.error : "Generation failed. Try again.");
        setPhase("editing");
        return;
      }

      setProgress(100);
      setResult(payload as GenerateResult);
      setPhase("done");
    } catch {
      setError("Network hiccup. Check your connection and try again.");
      setPhase("editing");
    } finally {
      window.clearInterval(timer);
    }
  }, [file, fields, format]);

  const restart = useCallback(() => {
    setResult(null);
    setPhase("editing");
    setProgress(0);
    setError(null);
    // The photo is deliberately kept — most people generate both formats from
    // the same picture, and making them re-upload would be hostile.
    setFields((f) => ({ ...f, title: randomBuilderTitle(f.title) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const busy = phase === "generating";

  if (phase === "done" && result) {
    return <ResultPanel result={result} onRestart={restart} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <FormatPicker value={format} onChange={setFormat} disabled={busy} />

      <Dropzone onFile={selectFile} preview={preview} disabled={busy} busy={converting} />

      <AnimatePresence initial={false}>
        {format === "card" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <DetailsForm
              fields={fields}
              onChange={(next) => {
                setFields(next);
                setFieldErrors({});
              }}
              onReroll={() => setFields((f) => ({ ...f, title: randomBuilderTitle(f.title) }))}
              errors={fieldErrors}
              disabled={busy}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3.5"
        >
          <span aria-hidden className="mt-0.5 text-coral">
            <svg viewBox="0 0 24 24" fill="none" className="size-5">
              <path
                d="M12 8v5m0 3.5h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="flex-1 text-sm text-ink">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button onClick={generate} disabled={!file || busy || converting} className="w-full">
          {busy ? <Spinner /> : null}
          {busy ? "Generating…" : "Generate"}
        </Button>

        {busy && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Generating your image"
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-sunset transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {busy ? "Generating your image" : converting ? "Reading your photo" : ""}
      </p>
    </div>
  );
}
