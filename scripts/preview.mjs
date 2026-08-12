/**
 * Renders the real generator pipeline straight to PNG files, so the artwork can
 * be iterated on without booting Next or clicking through the UI.
 *
 *   node --experimental-strip-types scripts/preview.mjs [fixture.jpg]
 *
 * Output lands in preview-out/.
 */
import fs from "node:fs";
import path from "node:path";

const { processPhoto } = await import("../src/lib/render/photo.ts");
const { renderPfpSvg } = await import("../src/lib/render/pfp.ts");
const { renderCardPng } = await import("../src/lib/render/card.ts");
const { rasterize } = await import("../src/lib/render/rasterize.ts");

const OUT = path.join(process.cwd(), "preview-out");
fs.mkdirSync(OUT, { recursive: true });

const fixtures = process.argv[2]
  ? [process.argv[2]]
  : ["portrait-tall.jpg", "landscape-wide.jpg", "offcenter-right.jpg", "exif-rotated.jpg"];

for (const name of fixtures) {
  const file = path.isAbsolute(name) ? name : path.join(process.cwd(), "fixtures", name);
  const input = fs.readFileSync(file);
  const base = path.basename(name, path.extname(name));

  const t0 = performance.now();
  const photo = await processPhoto(input, 900);
  const pfp = rasterize(renderPfpSvg(photo.dataUri), { width: 1000 });
  fs.writeFileSync(path.join(OUT, `${base}--pfp.png`), pfp);

  const cardPhoto = await processPhoto(input, 520);
  const landscape = await renderCardPng(cardPhoto.dataUri, {
    name: "Aditi Raikar",
    stack: "Full-stack · TypeScript",
    title: "Midnight Shipper",
  }, "landscape");
  fs.writeFileSync(path.join(OUT, `${base}--card.png`), landscape);

  const square = await renderCardPng(cardPhoto.dataUri, {
    name: "Aditi Raikar",
    stack: "Full-stack · TypeScript",
    title: "Midnight Shipper",
  }, "square");
  fs.writeFileSync(path.join(OUT, `${base}--square.png`), square);

  console.log(`${base}: ${Math.round(performance.now() - t0)}ms`);
}

console.log(`\nWrote ${OUT}`);
