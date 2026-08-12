type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny classnames joiner — the app has no conditional-variant complexity that
 *  would justify pulling in clsx + tailwind-merge. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(" ");
}
