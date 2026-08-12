/**
 * Resolver hook so scripts/preview.mjs can import the app's TypeScript modules
 * directly. Next resolves extensionless relative imports via its bundler; plain
 * Node ESM does not, so this fills the same gap for local tooling only.
 */
import path from "node:path";

const EXTENSIONS = [".ts", ".tsx", ".js", "/index.ts"];

export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !path.extname(specifier)) {
    for (const ext of EXTENSIONS) {
      try {
        return await next(specifier + ext, context);
      } catch {
        // try the next candidate
      }
    }
  }
  return next(specifier, context);
}
