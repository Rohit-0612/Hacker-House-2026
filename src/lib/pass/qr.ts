import qrcode from "qrcode-generator";
import type { Ctx } from "./primitives";

/**
 * A real, scannable QR — not a decorative grid.
 *
 * It encodes the pass's own share URL, which is possible because the share id is
 * minted in the browser *before* the artwork is painted. Scanning a printed pass
 * therefore lands on the page that shows it.
 */
export function drawQr(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  { dark = "#0A0A0A", light = "#FFFFFF", quiet = 2 }: { dark?: string; light?: string; quiet?: number } = {},
): void {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();

  const modules = qr.getModuleCount();
  const cell = size / (modules + quiet * 2);

  ctx.save();
  ctx.fillStyle = light;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = dark;
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (!qr.isDark(row, col)) continue;
      // +0.5 on the size closes the hairline seams that appear between cells
      // once the canvas is scaled up for export.
      ctx.fillRect(
        x + (col + quiet) * cell,
        y + (row + quiet) * cell,
        cell + 0.5,
        cell + 0.5,
      );
    }
  }
  ctx.restore();
}
