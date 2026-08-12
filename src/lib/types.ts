/** The two output formats from the HH Goa 2026 brief. */
export type Format = "pfp" | "card";

/** Card aspect variants. Landscape is the share default (matches summary_large_image). */
export type CardVariant = "landscape" | "square";

export type OutputVariant = "pfp" | CardVariant;

export const OUTPUT_SIZES: Record<OutputVariant, { width: number; height: number }> = {
  pfp: { width: 1000, height: 1000 },
  landscape: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
};

export interface GenerateFields {
  name: string;
  stack: string;
  title: string;
}

export interface GeneratedImage {
  variant: OutputVariant;
  /** Blob URL when storage is configured, otherwise an inline data: URL. */
  url: string;
  width: number;
  height: number;
}

export interface GenerateResult {
  format: Format;
  images: GeneratedImage[];
  fields: GenerateFields | null;
  /** Present only when blob storage is configured; drives the /s/[id] OG share path. */
  shareId: string | null;
  /** True when images are inline data URLs (no blob storage configured). */
  inline: boolean;
  elapsedMs: number;
}

export interface ApiError {
  error: string;
  code:
    | "no_file"
    | "too_large"
    | "bad_type"
    | "too_small"
    | "too_big_dimensions"
    | "decode_failed"
    | "bad_fields"
    | "render_failed";
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && "code" in value;
}
