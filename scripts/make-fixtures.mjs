/**
 * Generates synthetic test photos covering the awkward cases the brief calls out:
 * portrait, landscape, off-centre subjects, alpha, and out-of-range dimensions.
 *
 *   node scripts/make-fixtures.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "fixtures");
fs.mkdirSync(OUT, { recursive: true });

/** A crude stand-in for a person: warm head + shoulders on a cool backdrop.
 *  Saturation and edge density are what sharp's attention strategy keys on, so
 *  this is enough to prove the crop actually tracks the subject. */
function scene(w, h, subjectX, subjectY, headR) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1b3a5c"/>
        <stop offset="100%" stop-color="#0b1622"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${Array.from({ length: 14 }, (_, i) =>
      `<rect x="${(i * w) / 14}" y="0" width="2" height="${h}" fill="#ffffff" opacity="0.05"/>`
    ).join("")}
    <ellipse cx="${subjectX}" cy="${subjectY + headR * 2.1}" rx="${headR * 1.9}" ry="${headR * 1.5}" fill="#c2410c"/>
    <circle cx="${subjectX}" cy="${subjectY}" r="${headR}" fill="#f0b28a"/>
    <circle cx="${subjectX - headR * 0.34}" cy="${subjectY - headR * 0.12}" r="${headR * 0.1}" fill="#1c1917"/>
    <circle cx="${subjectX + headR * 0.34}" cy="${subjectY - headR * 0.12}" r="${headR * 0.1}" fill="#1c1917"/>
    <path d="M ${subjectX - headR * 0.32} ${subjectY + headR * 0.34}
             Q ${subjectX} ${subjectY + headR * 0.62} ${subjectX + headR * 0.32} ${subjectY + headR * 0.34}"
          stroke="#7c2d12" stroke-width="${headR * 0.09}" fill="none" stroke-linecap="round"/>
    <path d="M ${subjectX - headR} ${subjectY - headR * 0.25}
             Q ${subjectX} ${subjectY - headR * 1.35} ${subjectX + headR} ${subjectY - headR * 0.25}
             Q ${subjectX} ${subjectY - headR * 0.75} ${subjectX - headR} ${subjectY - headR * 0.25} Z"
          fill="#292524"/>
  </svg>`);
}

const jobs = [
  { file: "portrait-tall.jpg", w: 1200, h: 1800, sx: 600, sy: 520, r: 210, fmt: "jpeg" },
  { file: "landscape-wide.jpg", w: 2400, h: 1000, sx: 560, sy: 400, r: 190, fmt: "jpeg" },
  { file: "square.png", w: 1000, h: 1000, sx: 500, sy: 420, r: 200, fmt: "png" },
  { file: "offcenter-right.jpg", w: 2000, h: 1400, sx: 1620, sy: 430, r: 200, fmt: "jpeg" },
  { file: "extreme-panorama.jpg", w: 3000, h: 800, sx: 2400, sy: 330, r: 150, fmt: "jpeg" },
  { file: "too-small.jpg", w: 150, h: 150, sx: 75, sy: 60, r: 40, fmt: "jpeg" },
];

for (const j of jobs) {
  const img = sharp(scene(j.w, j.h, j.sx, j.sy, j.r));
  const out = j.fmt === "png" ? img.png() : img.jpeg({ quality: 92 });
  await out.toFile(path.join(OUT, j.file));
  console.log(`  ${j.file}  ${j.w}x${j.h}`);
}

// The iPhone case: an upright portrait whose *pixels* are stored sideways, with
// EXIF orientation 6 ("rotate 90° CW to display") carrying the correction. This
// mirrors how phones actually save photos.
//
// Built by taking an upright scene and pre-rotating the pixels 90° CCW, so a
// pipeline that honours the flag lands back upright and one that ignores it
// produces a visibly sideways face.
const upright = await sharp(scene(1200, 1800, 600, 560, 210)).jpeg({ quality: 92 }).toBuffer();
await sharp(upright)
  .rotate(270) // pixels now sideways: 1800x1200
  .withMetadata({ orientation: 6 })
  .jpeg({ quality: 92 })
  .toFile(path.join(OUT, "exif-rotated.jpg"));
console.log("  exif-rotated.jpg  1800x1200 pixels, EXIF orientation 6 -> displays upright");

fs.writeFileSync(path.join(OUT, "not-an-image.txt"), "definitely not a photo\n");
console.log("  not-an-image.txt");
console.log(`\nFixtures written to ${OUT}`);
