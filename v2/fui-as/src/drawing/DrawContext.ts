import * as ffi from "../core/ffi";
import { Paint } from "./Paint";
import { Path } from "./Path";

/**
 * Immediate-mode drawing context wrapping an opaque Skia canvas pointer.
 *
 * Obtained during the render pass via `CustomDrawable.draw(ctx)` or from
 * `Bitmap.canvas()` for off-screen drawing. The canvas pointer is opaque —
 * all drawing goes through the `fui_canvas_*` FFI functions.
 */
export class DrawContext {
  constructor(private canvasPtr: usize) {}

  /* ── State ──────────────────────────────────────────────────── */

  save(): void { ffi.fui_canvas_save(this.canvasPtr); }
  restore(): void { ffi.fui_canvas_restore(this.canvasPtr); }
  translate(x: f32, y: f32): void { ffi.fui_canvas_translate(this.canvasPtr, x, y); }
  scale(sx: f32, sy: f32): void { ffi.fui_canvas_scale(this.canvasPtr, sx, sy); }
  rotate(degrees: f32): void { ffi.fui_canvas_rotate(this.canvasPtr, degrees); }
  clipRect(x: f32, y: f32, w: f32, h: f32): void {
    ffi.fui_canvas_clip_rect(this.canvasPtr, x, y, w, h);
  }

  /* ── Primitives ─────────────────────────────────────────────── */

  drawRect(x: f32, y: f32, w: f32, h: f32, paint: Paint): void {
    ffi.fui_canvas_draw_rect(
      this.canvasPtr, x, y, w, h,
      paint.fillColor, paint.strokeColor, paint.strokeWidth,
    );
  }

  drawCircle(cx: f32, cy: f32, radius: f32, paint: Paint): void {
    ffi.fui_canvas_draw_circle(
      this.canvasPtr, cx, cy, radius,
      paint.fillColor, paint.strokeColor, paint.strokeWidth,
    );
  }

  drawLine(x1: f32, y1: f32, x2: f32, y2: f32, color: u32, strokeWidth: f32): void {
    ffi.fui_canvas_draw_line(this.canvasPtr, x1, y1, x2, y2, color, strokeWidth);
  }

  drawRoundRect(x: f32, y: f32, w: f32, h: f32, rx: f32, ry: f32, paint: Paint): void {
    ffi.fui_canvas_draw_round_rect(
      this.canvasPtr, x, y, w, h, rx, ry,
      paint.fillColor, paint.strokeColor, paint.strokeWidth,
    );
  }

  /* ── Path ───────────────────────────────────────────────────── */

  drawPath(path: Path, paint: Paint): void {
    ffi.fui_canvas_draw_path(
      this.canvasPtr, path._pathId,
      paint.fillColor, paint.strokeColor, paint.strokeWidth,
    );
  }

  /* ── Text ───────────────────────────────────────────────────── */

  drawText(text: string, x: f32, y: f32, fontId: u32, fontSize: f32, color: u32): void {
    const encoded = Uint8Array.wrap(String.UTF8.encode(text, false));
    ffi.fui_canvas_draw_text(
      this.canvasPtr, encoded.dataStart, encoded.byteLength,
      x, y, fontId, fontSize, color,
    );
  }

  /* ── Image / SVG ─────────────────────────────────────────────── */

  drawImage(textureId: u32, x: f32, y: f32, w: f32, h: f32): void {
    ffi.fui_canvas_draw_image(this.canvasPtr, textureId, x, y, w, h);
  }

  drawSvg(svgId: u32, x: f32, y: f32, w: f32, h: f32): void {
    ffi.fui_canvas_draw_svg(this.canvasPtr, svgId, x, y, w, h);
  }
}
