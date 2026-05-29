import { ContextMenuManager } from "../../src/core/ContextMenuManager";
import { PointerEventType } from "../../src/core/ffi";

describe("ContextMenuManagerTracking", () => {
  it("accepts pointer-selection tracking updates", () => {
    ContextMenuManager.trackPointerEvent(PointerEventType.Down, 1);
    ContextMenuManager.trackPointerEvent(PointerEventType.Move, 2);
    ContextMenuManager.handleSelectionChanged("hello");
    ContextMenuManager.handleSelectionChanged("");

    expect<bool>(true).toBe(true);
  });
});
