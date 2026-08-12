"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ACCEPT_ATTR } from "@/lib/validate";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
  /** Object URL of the current photo, if one is selected. */
  preview: string | null;
  busy?: boolean;
}

export function Dropzone({ onFile, disabled, preview, busy }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) take(e.dataTransfer.files);
      }}
    >
      {/* A real <button> rather than a div with a click handler, so the whole
          dropzone is reachable and activatable from the keyboard for free. */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-describedby="dropzone-hint"
        className={cn(
          "group relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-10",
          dragging
            ? "border-coral bg-coral/10 scale-[1.01]"
            : "border-white/15 hover:border-white/30 hover:bg-white/[0.03]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Your selected photo"
              className="size-36 rounded-full object-cover shadow-[0_20px_50px_-18px_rgba(255,77,109,0.8)] ring-4 ring-coral/50 sm:size-44"
            />
            <p className="font-display text-sm font-bold text-ink">
              {busy ? "Reading photo…" : "Looking good"}
            </p>
            <p className="text-xs text-muted">Tap to choose a different photo</p>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="flex size-14 items-center justify-center rounded-2xl bg-sunset-full text-2xl shadow-[0_16px_40px_-14px_rgba(255,77,109,0.9)] transition-transform duration-300 motion-safe:group-hover:scale-110"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-7 text-night">
                <path
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="font-display text-base font-bold text-ink sm:text-lg">
              Drop a photo, or tap to upload
            </span>
            <span id="dropzone-hint" className="text-xs text-muted sm:text-sm">
              JPG, PNG, WEBP or HEIC · up to 10MB
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        // Deliberately no `capture` attribute: setting it forces the camera and
        // removes the photo library, which is the wrong default. Omitting it
        // makes iOS and Android offer both "Take Photo" and "Photo Library".
        className="sr-only"
        onChange={(e) => {
          take(e.target.files);
          // Reset so re-picking the same file still fires onChange.
          e.target.value = "";
        }}
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
