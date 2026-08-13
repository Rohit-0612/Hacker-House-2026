"use client";

import { useCallback, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PercentCrop } from "react-image-crop";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { NormalisedPhoto } from "@/lib/pass";
import { ACCEPT_ATTR } from "@/lib/validate";

interface Props {
  photo: NormalisedPhoto | null;
  aspect: number;
  crop: Crop | undefined;
  onCropChange: (crop: Crop, percent: PercentCrop) => void;
  onCropComplete: (percent: PercentCrop) => void;
  onFile: (file: File) => void;
  onClear: () => void;
  busy: boolean;
  disabled: boolean;
}

export function PhotoStep({
  photo,
  aspect,
  crop,
  onCropChange,
  onCropComplete,
  onFile,
  onClear,
  busy,
  disabled,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  /** Opens with a centred selection at the locked aspect, so the common case is
   *  one confirm rather than a drag. */
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const next = centerCrop(
        makeAspectCrop({ unit: "%", width: 84 }, aspect, width, height),
        width,
        height,
      );
      onCropChange(next, next);
      onCropComplete(next);
    },
    [aspect, onCropChange, onCropComplete],
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="label text-lemon">Builder photo</p>

      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files);
          // Reset so picking the same file twice still fires a change event.
          e.target.value = "";
        }}
      />

      {!photo ? (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            take(e.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-lemon bg-lemon/8" : "border-jungle-line bg-jungle-panel hover:border-lemon/60",
            (disabled || busy) && "pointer-events-none opacity-50",
          )}
        >
          {busy ? (
            <>
              <Spinner className="size-6 text-lemon" />
              <span className="label text-lemon">Reading your photo…</span>
            </>
          ) : (
            <>
              <span aria-hidden className="text-3xl">
                🎞
              </span>
              <span className="font-condensed text-lg tracking-[0.1em] text-paper uppercase">
                Add a photo
              </span>
              <span className="label text-muted">JPG · PNG · WEBP · HEIC · up to 12MB</span>
            </>
          )}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border-2 border-jungle-line bg-ink/40 p-2">
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={(_, percent) => onCropComplete(percent)}
              aspect={aspect}
              keepSelection
              minWidth={40}
              disabled={disabled}
              className="max-h-[46vh] w-full"
            >
              {/* Plain <img>: the source is an object URL of pixels this app
                  already decoded, so the image optimizer has nothing to add. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Your photo, ready to crop"
                onLoad={onImageLoad}
                className="max-h-[46vh] w-full object-contain"
              />
            </ReactCrop>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="label text-muted">Drag to reframe</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => input.current?.click()}
                disabled={disabled}
                className="label min-h-11 text-lemon underline underline-offset-4 transition-colors hover:text-paper disabled:opacity-50"
              >
                Change photo
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="label min-h-11 text-muted underline underline-offset-4 transition-colors hover:text-magenta disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
