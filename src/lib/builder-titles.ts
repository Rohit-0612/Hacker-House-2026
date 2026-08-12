/**
 * Curated builder titles. Deliberately hand-written, not model-generated, so the
 * tone stays consistent and nothing embarrassing ships on someone's profile.
 */
export const BUILDER_TITLES = [
  "Prompt Architect",
  "API Wizard",
  "Bug Hunter",
  "AI Wrangler",
  "Stack Alchemist",
  "Midnight Shipper",
  "Pixel Engineer",
  "Chaos Debugger",
  "Build Machine",
  "Demo Day Survivor",
  "Latency Slayer",
  "Schema Whisperer",
  "Regex Sorcerer",
  "Deploy Daredevil",
  "Edge Case Enjoyer",
  "Commit Machine",
  "Rubber Duck Listener",
  "Caffeine Compiler",
  "Merge Conflict Medic",
  "Zero To One Operator",
  "Terminal Dweller",
  "Context Window Bender",
  "Token Optimist",
  "Race Condition Tamer",
  "Null Pointer Nemesis",
  "Refactor Romantic",
  "Cache Invalidator",
  "Yak Shaving Champion",
  "Uptime Guardian",
  "Payload Poet",
  "Dark Mode Purist",
  "Feature Flag Flipper",
  "Rate Limit Negotiator",
  "Webhook Whisperer",
  "Type Safety Zealot",
  "Hotfix Hero",
  "Localhost Legend",
  "Scope Creep Survivor",
  "Async Acrobat",
  "Ship It Evangelist",
] as const;

export type BuilderTitle = (typeof BUILDER_TITLES)[number];

/** Uniformly random title. Used on first generate and on every reroll. */
export function randomBuilderTitle(exclude?: string): string {
  const pool = exclude ? BUILDER_TITLES.filter((t) => t !== exclude) : BUILDER_TITLES;
  const list = pool.length > 0 ? pool : BUILDER_TITLES;
  return list[Math.floor(Math.random() * list.length)] as string;
}

export function isBuilderTitle(value: string): boolean {
  return (BUILDER_TITLES as readonly string[]).includes(value);
}
