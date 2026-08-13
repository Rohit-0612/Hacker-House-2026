/** The two things the generator can draw. */
export type Format = "pass" | "pfp";

/**
 * `pass` / `pfp` are the download artefacts; `og` is the 1200×630 board the
 * chosen artefact is centred on so X unfurls it whole instead of cropping it.
 */
export type OutputVariant = Format | "og";

export const OUTPUT_SIZES: Record<OutputVariant, { width: number; height: number }> = {
  pass: { width: 3200, height: 1800 },
  pfp: { width: 2000, height: 2000 },
  // 2× the 1200×630 board. X accepts it and the extra density is what keeps
  // small mono type on the ticket legible in a timeline unfurl.
  og: { width: 2400, height: 1260 },
};

export interface PassFields {
  name: string;
  team: string;
  role: string;
  city: string;
}

/** Ticket data derived deterministically from the fields — see lib/pass/identity.ts. */
export interface PassIdentity {
  ticketNo: string;
  builderId: string;
  pnr: string;
  seat: string;
  coach: string;
  platform: string;
}

export interface ShareImage {
  variant: OutputVariant;
  /** Blob URL when storage is configured, otherwise served by the dev-only local store. */
  url: string;
  width: number;
  height: number;
}

export interface ApiError {
  error: string;
  code: "bad_id" | "bad_fields" | "no_image" | "too_large" | "exists" | "no_store" | "failed";
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && "code" in value;
}
