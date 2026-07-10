import * as ffi from "../core/ffi";
import { ImageSampling } from "../core/ImageSampling";
import { error } from "../core/Logger";
import { Node } from "../core/Node";
import { TextLayout } from "../text/TextLayout";
import { Paint } from "./Paint";
import { Path } from "./Path";

const OP_SAVE: u32 = 1;
const OP_RESTORE: u32 = 2;
const OP_TRANSLATE: u32 = 3;
const OP_SCALE: u32 = 4;
const OP_ROTATE: u32 = 5;
const OP_CLIP_RECT: u32 = 6;
const OP_CLIP_ROUND_RECT: u32 = 7;
const OP_DRAW_RECT: u32 = 10;
const OP_DRAW_CIRCLE: u32 = 11;
const OP_DRAW_LINE: u32 = 12;
const OP_DRAW_ROUND_RECT: u32 = 13;
const OP_DRAW_PATH: u32 = 20;
const OP_DRAW_TEXT_NODE: u32 = 30;
const OP_DRAW_IMAGE: u32 = 31;
const OP_DRAW_SVG: u32 = 32;

/**
 * Immediate-mode drawing context wrapping an opaque Skia canvas pointer.
 *
 * Obtained during the render pass via `CustomDrawable.draw(ctx)` or from
 * `Bitmap.canvas()` for off-screen drawing. The canvas pointer is opaque —
 * all drawing goes through the `fui_canvas_*` FFI functions.
 */
export class DrawContext {
  private words: Array<u32> = new Array<u32>();

  constructor(private canvasPtr: usize) {}

  private pushFloat(value: f32): void {
    this.words.push(reinterpret<u32>(value));
  }

  flush(): void {
    if (this.words.length == 0) {
      return;
    }
    ffi.fui_canvas_draw_batch(
      this.canvasPtr,
      this.words.dataStart,
      <u32>this.words.length,
    );
    this.words = new Array<u32>();
  }

  /* ── State ──────────────────────────────────────────────────── */

  save(): void { this.words.push(OP_SAVE); }
  restore(): void { this.words.push(OP_RESTORE); }
  translate(x: f32, y: f32): void {
    this.words.push(OP_TRANSLATE);
    this.pushFloat(x);
    this.pushFloat(y);
  }
  scale(sx: f32, sy: f32): void {
    this.words.push(OP_SCALE);
    this.pushFloat(sx);
    this.pushFloat(sy);
  }
  rotate(degrees: f32): void {
    this.words.push(OP_ROTATE);
    this.pushFloat(degrees);
  }
  clipRect(x: f32, y: f32, w: f32, h: f32): void {
    this.words.push(OP_CLIP_RECT);
    this.pushFloat(x);
    this.pushFloat(y);
    this.pushFloat(w);
    this.pushFloat(h);
  }
  clipRoundRect(x: f32, y: f32, w: f32, h: f32, radius: f32): void {
    this.clipRoundedRect(x, y, w, h, radius, radius, radius, radius);
  }
  clipRoundedRect(x: f32, y: f32, w: f32, h: f32, topLeft: f32, topRight: f32, bottomRight: f32, bottomLeft: f32): void {
    this.words.push(OP_CLIP_ROUND_RECT);
    this.pushFloat(x);
    this.pushFloat(y);
    this.pushFloat(w);
    this.pushFloat(h);
    this.pushFloat(topLeft);
    this.pushFloat(topRight);
    this.pushFloat(bottomRight);
    this.pushFloat(bottomLeft);
  }

  /* ── Primitives ─────────────────────────────────────────────── */

  drawRect(x: f32, y: f32, w: f32, h: f32, paint: Paint): void {
    this.words.push(OP_DRAW_RECT);
    this.pushFloat(x);
    this.pushFloat(y);
    this.pushFloat(w);
    this.pushFloat(h);
    this.words.push(paint.fillColor);
    this.words.push(paint.strokeColor);
    this.pushFloat(paint.strokeWidth);
  }

  drawCircle(cx: f32, cy: f32, radius: f32, paint: Paint): void {
    this.words.push(OP_DRAW_CIRCLE);
    this.pushFloat(cx);
    this.pushFloat(cy);
    this.pushFloat(radius);
    this.words.push(paint.fillColor);
    this.words.push(paint.strokeColor);
    this.pushFloat(paint.strokeWidth);
  }

  drawLine(x1: f32, y1: f32, x2: f32, y2: f32, color: u32, strokeWidth: f32): void {
    this.words.push(OP_DRAW_LINE);
    this.pushFloat(x1);
    this.pushFloat(y1);
    this.pushFloat(x2);
    this.pushFloat(y2);
    this.words.push(color);
    this.pushFloat(strokeWidth);
  }

  drawRoundRect(x: f32, y: f32, w: f32, h: f32, rx: f32, ry: f32, paint: Paint): void {
    this.words.push(OP_DRAW_ROUND_RECT);
    this.pushFloat(x);
    this.pushFloat(y);
    this.pushFloat(w);
    this.pushFloat(h);
    this.pushFloat(rx);
    this.pushFloat(ry);
    this.words.push(paint.fillColor);
    this.words.push(paint.strokeColor);
    this.pushFloat(paint.strokeWidth);
  }

  /* ── Path ───────────────────────────────────────────────────── */

  drawPath(path: Path, paint: Paint): void {
    this.words.push(OP_DRAW_PATH);
    this.words.push(path._pathId);
    this.words.push(paint.fillColor);
    this.words.push(paint.strokeColor);
    this.pushFloat(paint.strokeWidth);
  }

  /* ── Text ───────────────────────────────────────────────────── */

  drawTextNode(node: Node, x: f32, y: f32): void {
    const handle = node.builtHandle;
    this.words.push(OP_DRAW_TEXT_NODE);
    this.words.push(<u32>handle);
    this.words.push(<u32>(handle >> 32));
    this.pushFloat(x);
    this.pushFloat(y);
  }

  drawTextLayout(layout: TextLayout, x: f32, y: f32): void {
    if (!layout.isReady) {
      error("TextLayout", "DrawContext.drawTextLayout() called before the TextLayout was ready; register onReady/onReadyWith and draw after the callback.");
      return;
    }
    this.drawTextNode(layout._drawNode(), x, y);
  }

  /* ── Image / SVG ─────────────────────────────────────────────── */

  drawImage(textureId: u32, x: f32, y: f32, w: f32, h: f32, sampling: ImageSampling = ImageSampling.linear()): void {
    this.words.push(OP_DRAW_IMAGE);
    this.words.push(textureId);
    this.pushFloat(x);
    this.pushFloat(y);
    this.pushFloat(w);
    this.pushFloat(h);
    this.words.push(<u32>sampling.kind);
    this.words.push(sampling.maxAniso);
  }

  drawSvg(svgId: u32, x: f32, y: f32, w: f32, h: f32): void {
    this.words.push(OP_DRAW_SVG);
    this.words.push(svgId);
    this.pushFloat(x);
    this.pushFloat(y);
    this.pushFloat(w);
    this.pushFloat(h);
  }
}
