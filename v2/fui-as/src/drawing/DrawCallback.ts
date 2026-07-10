import { DrawContext } from "./DrawContext";
import { CustomDrawable } from "../nodes/CustomDrawable";
import { EventRouter } from "../core/EventRouter";

/**
 * Called from the JS bridge during the render pass when Tier 1
 * encounters an OP_DRAW_CUSTOM instruction.
 *
 * @param handle - The u64 node handle (passed as i64 from JS).
 * @param canvasPtr - The opaque Skia canvas pointer (usize).
 */
export function fui_dispatch_custom_draw(handle: u64, canvasPtr: usize): void {
  const node = EventRouter.getRegisteredNode(handle);
  if (node !== null && node instanceof CustomDrawable) {
    const custom = node as CustomDrawable;
    const bounds = custom.getBounds();
    const ctx = new DrawContext(canvasPtr);
    const width = unchecked(bounds[2]);
    const height = unchecked(bounds[3]);
    const tl = custom._cornerTopLeft();
    const tr = custom._cornerTopRight();
    const br = custom._cornerBottomRight();
    const bl = custom._cornerBottomLeft();
    ctx.save();
    if (tl > 0.0 || tr > 0.0 || br > 0.0 || bl > 0.0) {
      ctx.clipRoundedRect(0, 0, width, height, tl, tr, br, bl);
    } else {
      ctx.clipRect(0, 0, width, height);
    }
    custom.draw(ctx);
    ctx.restore();
    ctx.flush();
  }
}
