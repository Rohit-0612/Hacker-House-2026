"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Crop, PercentCrop } from "react-image-crop";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import {
  CROP_ASPECT,
  FULL_CROP,
  newPassId,
  normalisePhoto,
  PhotoError,
  renderArtwork,
  revokePhoto,
  type Artwork,
  type CropRect,
  type NormalisedPhoto,
} from "@/lib/pass";
import type { Format, PassFields } from "@/lib/types";
import { fieldsSchema, sanitizeText, validateFile } from "@/lib/validate";
import { BOARDING_MS, BoardingOverlay } from "./BoardingOverlay";
import { PassResult } from "./PassResult";
import { PhotoStep } from "./PhotoStep";

type Phase = "editing" | "boarding" | "done";

const EMPTY: PassFields = { name: "", team: "", role: "", city: "" };

const FORMATS: { value: Format; label: string; hint: string }[] = [
  { value: "pass", label: "Baggage label", hint: "Post it" },
  { value: "pfp", label: "PFP frame", hint: "Wear it" },
];

export function Generator() {
  const [format, setFormat] = useState<Format>("pass");
  const [photo, setPhoto] = useState<NormalisedPhoto | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [cropRect, setCropRect] = useState<CropRect>(FULL_CROP);
  const [fields, setFields] = useState<PassFields>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PassFields, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [phase, setPhase] = useState<Phase>("editing");
  const [artwork, setArtwork] = useState<Artwork | null>(null);

  // Object URLs pin whole decoded bitmaps in memory — a real cost on a phone —
  // so they are revoked on replace and on unmount.
  const photoRef = useRef<NormalisedPhoto | null>(null);
  const artworkRef = useRef<Artwork | null>(null);
  useEffect(() => {
    photoRef.current = photo;
  }, [photo]);
  useEffect(() => {
    artworkRef.current = artwork;
  }, [artwork]);
  useEffect(
    () => () => {
      revokePhoto(photoRef.current);
      if (artworkRef.current) URL.revokeObjectURL(artworkRef.current.main.url);
    },
    [],
  );

  const selectFile = useCallback(async (incoming: File) => {
    setError(null);

    const problem = validateFile(incoming);
    if (problem) {
      setError(problem);
      return;
    }

    setReading(true);
    try {
      const next = await normalisePhoto(incoming);
      setPhoto((old) => {
        revokePhoto(old);
        return next;
      });
      // A new photo invalidates the old selection; PhotoStep re-centres on load.
      setCrop(undefined);
      setCropRect(FULL_CROP);
    } catch (err) {
      setError(
        err instanceof PhotoError ? err.message : "We couldn't read that photo. Try a JPG or PNG.",
      );
    } finally {
      setReading(false);
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setPhoto((old) => {
      revokePhoto(old);
      return null;
    });
    setCrop(undefined);
    setCropRect(FULL_CROP);
  }, []);

  const changeFormat = useCallback((next: Format) => {
    setFormat(next);
    // The crop aspect is locked per format, so the old selection no longer fits.
    setCrop(undefined);
    setCropRect(FULL_CROP);
  }, []);

  const generate = useCallback(async () => {
    if (!photo) {
      setError("Add a photo to get started.");
      return;
    }

    const cleaned: PassFields = {
      name: sanitizeText(fields.name, 24),
      team: sanitizeText(fields.team, 24),
      role: sanitizeText(fields.role, 26),
      city: sanitizeText(fields.city, 20),
    };

    // The PFP frame carries no user text, so it does not gate on the form.
    if (format === "pass") {
      const parsed = fieldsSchema.safeParse(cleaned);
      if (!parsed.success) {
        const next: Partial<Record<keyof PassFields, string>> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof PassFields;
          if (key && !next[key]) next[key] = issue.message;
        }
        setFieldErrors(next);
        return;
      }
    }

    setFieldErrors({});
    setError(null);
    setPhase("boarding");

    try {
      // Paint and theatre run together: the overlay never finishes ahead of the
      // artwork, and a slow phone extends it rather than flashing an empty state.
      const [next] = await Promise.all([
        renderArtwork({
          format,
          fields: cleaned,
          photo,
          crop: cropRect,
          id: newPassId(),
          origin: window.location.origin,
        }),
        new Promise((resolve) => setTimeout(resolve, BOARDING_MS)),
      ]);

      setArtwork((old) => {
        if (old) URL.revokeObjectURL(old.main.url);
        return next;
      });
      setFields(cleaned);
      setPhase("done");
    } catch (err) {
      console.error("[generator] render failed", err);
      setError(
        err instanceof PhotoError ? err.message : "Something broke while drawing your pass. Try again.",
      );
      setPhase("editing");
    }
  }, [photo, fields, format, cropRect]);

  const restart = useCallback(() => {
    setArtwork((old) => {
      if (old) URL.revokeObjectURL(old.main.url);
      return null;
    });
    setPhase("editing");
    setError(null);
    // No explicit behavior: the CSS scroll-behavior in globals.css already
    // falls back to instant under prefers-reduced-motion.
    document.getElementById("pass")?.scrollIntoView();
  }, []);

  const busy = phase === "boarding";

  return (
    <section id="pass" className="relative isolate scroll-mt-4 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-10 flex flex-col gap-3">
          <p className="label text-magenta">Step aboard</p>
          <h2 className="font-display text-4xl font-bold text-lemon sm:text-5xl">
            {phase === "done" ? "Your builder pass" : "Create my pass"}
          </h2>
          <p className="max-w-lg font-mono text-sm leading-relaxed text-muted">
            Upload a photo, add your details, board the builder journey. Everything is drawn in your
            browser — nothing leaves it unless you share a link.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-jungle-line bg-jungle-panel/60 p-5 sm:p-8">
          {phase === "done" && artwork ? (
            <PassResult artwork={artwork} fields={fields} onRestart={restart} />
          ) : (
            <div className="flex flex-col gap-8">
              <fieldset className="flex flex-col gap-3">
                <legend className="label mb-3 text-lemon">Output</legend>
                <div className="grid grid-cols-2 gap-3">
                  {FORMATS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => changeFormat(option.value)}
                      disabled={busy}
                      aria-pressed={format === option.value}
                      className={cn(
                        "flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-lg border-2 px-4 transition-colors disabled:opacity-50",
                        format === option.value
                          ? "border-lemon bg-lemon/10"
                          : "border-jungle-line hover:border-lemon/50",
                      )}
                    >
                      <span className="font-condensed text-base tracking-[0.1em] text-paper uppercase">
                        {option.label}
                      </span>
                      <span className="label text-muted">{option.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-8 md:grid-cols-2 md:gap-10">
                <PhotoStep
                  photo={photo}
                  aspect={CROP_ASPECT[format]}
                  crop={crop}
                  onCropChange={(next: Crop) => setCrop(next)}
                  onCropComplete={(percent: PercentCrop) => setCropRect(percent)}
                  onFile={selectFile}
                  onClear={clearPhoto}
                  busy={reading}
                  disabled={busy}
                />

                <AnimatePresence initial={false} mode="wait">
                  {format === "pass" ? (
                    <motion.div
                      key="fields"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-5"
                    >
                      <Field
                        label="Name"
                        hint="Passenger"
                        value={fields.name}
                        onChange={(v) => setFields((f) => ({ ...f, name: v }))}
                        placeholder="Your full name"
                        maxLength={24}
                        error={fieldErrors.name}
                        disabled={busy}
                        autoComplete="name"
                      />
                      <Field
                        label="Team"
                        hint="Coach"
                        value={fields.team}
                        onChange={(v) => setFields((f) => ({ ...f, team: v }))}
                        placeholder="Your team, or solo"
                        maxLength={24}
                        error={fieldErrors.team}
                        disabled={busy}
                      />
                      <Field
                        label="Role / stack"
                        hint="Class"
                        value={fields.role}
                        onChange={(v) => setFields((f) => ({ ...f, role: v }))}
                        placeholder="What you build"
                        maxLength={26}
                        error={fieldErrors.role}
                        disabled={busy}
                      />
                      <Field
                        label="Origin"
                        hint="From"
                        value={fields.city}
                        onChange={(v) => setFields((f) => ({ ...f, city: v }))}
                        placeholder="City you're travelling from"
                        maxLength={20}
                        error={fieldErrors.city}
                        disabled={busy}
                        autoComplete="address-level2"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pfp-note"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col justify-center gap-3 rounded-xl border-2 border-dashed border-jungle-line p-6"
                    >
                      <p className="font-condensed text-lg tracking-[0.08em] text-paper uppercase">
                        No details needed
                      </p>
                      <p className="font-mono text-sm leading-relaxed text-muted">
                        The PFP frame carries the event lockup, not your name. Crop to taste and set
                        it as your avatar — a 2000×2000 PNG, so it stays sharp everywhere.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border-2 border-magenta bg-magenta/10 px-4 py-3 font-mono text-sm text-paper"
                >
                  {error}
                </p>
              )}

              <Button onClick={generate} disabled={!photo || busy || reading} className="w-full sm:w-auto sm:self-start sm:px-10">
                Generate my pass
              </Button>
            </div>
          )}
        </div>
      </div>

      <BoardingOverlay open={busy} />
    </section>
  );
}
