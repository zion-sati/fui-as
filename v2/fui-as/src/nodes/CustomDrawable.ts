import { FlexBox } from "./FlexBox";
import { DrawContext } from "../drawing/DrawContext";
import * as ui from "../bindings/ui";
import { markNeedsCommit } from "../core/FrameScheduler";

/**
 * A retained-mode node that draws itself procedurally via a `DrawContext`
 * during the render pass.  Extends `FlexBox` for full layout, styling, and
 * child support.
 *
 * Subclasses override `draw(ctx)` with immediate-mode Skia drawing.
 *
 * **Dirty model:** EffinDom only repaints when something is dirty — there
 * is no automatic 60fps repaint loop.  A `CustomDrawable` renders once on
 * the initial frame, then only again when `markDirty()` is called.  For
 * animations, rebind a `Signal` or timer to call `markDirty()` each frame.
 *
 * ```
 * class Gauge extends CustomDrawable {
 *   readonly value = new Signal<f32>(0);
 *
 *   constructor() {
 *     super();
 *     this.width(200).height(200);
 *     this.value.bind(this, () => this.markDirty());
 *   }
 *
 *   draw(ctx: DrawContext): void {
 *     // immediate-mode Skia drawing — called only when dirty
 *   }
 * }
 * ```
 */
export abstract class CustomDrawable extends FlexBox {
  abstract draw(ctx: DrawContext): void;

  build(): u64 {
    this.buildStyledNode(0); // 0 = NodeType.FlexBox
    ui.setCustomDrawable(this.handle, true);
    return this.handle;
  }

  /**
   * Request a redraw on the next frame.
   *
   * Call this whenever the visual state changes (e.g. a bound `Signal`
   * fires, a timer ticks, or a layout mutation occurs).  Without this
   * call the `draw()` method will not be invoked again after the initial
   * render.
   */
  markDirty(): void {
    markNeedsCommit();
  }
}
