import type { PassFields, PassIdentity } from "@/lib/types";

/**
 * Ticket data — PNR, seat, coach and so on — derived from the pass contents.
 *
 * Deterministic on purpose: the same builder regenerating the same pass gets the
 * same numbers back. Random-per-render values would mean the printed ticket
 * number stops matching the one on the share page, which is exactly the sort of
 * detail that makes a fake ticket read as fake.
 */

/** FNV-1a. Not cryptographic — this only needs to spread the input evenly. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** xorshift32 — one seeded stream so every field comes from the same draw. */
function stream(seed: number): () => number {
  let state = seed || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

const digits = (rng: () => number, n: number): string =>
  Array.from({ length: n }, () => Math.floor(rng() * 10)).join("");

/** Draws `n` characters from an alphabet using the seeded stream. */
const chars = (rng: () => number, alphabet: string, n: number): string =>
  Array.from({ length: n }, () => alphabet.charAt(Math.floor(rng() * alphabet.length))).join("");

/** Crockford-ish alphabet: no I, O, 0 or 1, so a PNR can be read aloud. */
const PNR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function deriveIdentity(fields: PassFields, salt = ""): PassIdentity {
  const seed = hash32(
    [fields.name, fields.team, fields.role, fields.city, salt].join("|").toUpperCase(),
  );
  const rng = stream(seed);

  return {
    ticketNo: `HH26-${digits(rng, 6)}`,
    builderId: `HH26-${chars(rng, "0123456789ABCDEF", 4)}`,
    pnr: `HH26-${chars(rng, PNR_ALPHABET, 5)}`,
    seat: `BUILD-${String(Math.floor(rng() * 89) + 10)}`,
    coach: `B-${String(Math.floor(rng() * 9) + 21)}`,
    platform: String(Math.floor(rng() * 9) + 1).padStart(2, "0"),
  };
}

/**
 * Bar widths for the stub's barcode. Not a scannable symbology — the brief calls
 * for a decorative one — but seeded from the ticket number so a given ticket
 * always prints the same bars.
 */
export function barcodePattern(ticketNo: string, count = 44): number[] {
  const rng = stream(hash32(ticketNo));
  return Array.from({ length: count }, () => 1 + Math.floor(rng() * 4));
}
