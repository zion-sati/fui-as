import * as ffi from "../core/ffi";
import { Disposable } from "../core/Disposable";

/**
 * Retained Skia path, built imperatively then drawn via DrawContext.
 *
 * Callers must `dispose()` the path when done to release the engine-side resource.
 * Paths are pooled in Tier 1 and identified by an opaque u32 ID.
 */
export class Path implements Disposable {
  // @ts-ignore: assigned in constructor via FFI
  private _id: u32;
  private disposed: bool = false;

  constructor() {
    this._id = ffi.fui_path_create();
  }

  /** @internal — exposed for DrawContext.drawPath */
  get _pathId(): u32 {
    return this._id;
  }

  moveTo(x: f32, y: f32): Path { ffi.fui_path_move_to(this._id, x, y); return this; }
  lineTo(x: f32, y: f32): Path { ffi.fui_path_line_to(this._id, x, y); return this; }
  quadTo(cx: f32, cy: f32, x: f32, y: f32): Path { ffi.fui_path_quad_to(this._id, cx, cy, x, y); return this; }
  cubicTo(cx1: f32, cy1: f32, cx2: f32, cy2: f32, x: f32, y: f32): Path {
    ffi.fui_path_cubic_to(this._id, cx1, cy1, cx2, cy2, x, y); return this;
  }
  close(): Path { ffi.fui_path_close(this._id); return this; }
  addRect(x: f32, y: f32, w: f32, h: f32): Path { ffi.fui_path_add_rect(this._id, x, y, w, h); return this; }
  addCircle(cx: f32, cy: f32, r: f32): Path { ffi.fui_path_add_circle(this._id, cx, cy, r); return this; }

  dispose(): void {
    if (!this.disposed) {
      ffi.fui_path_destroy(this._id);
      this.disposed = true;
    }
  }
}
