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
    const ctx = new DrawContext(canvasPtr);
    (node as CustomDrawable).draw(ctx);
  }
}
