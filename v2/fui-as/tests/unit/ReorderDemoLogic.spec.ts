import {
  REORDER_AUTOSCROLL_EDGE_ZONE_PX,
  REORDER_VIEWPORT_HEIGHT_PX,
  ReorderDemoItem,
  computeNextReorderAutoScrollOffset,
  computeReorderPointerAutoScrollDelta,
  computeReorderContentHeight,
  computeReorderEdgeAutoScrollDirection,
  computeReorderEdgeInsertionIndex,
  computeReorderVisibleRange,
  createReorderDemoItems,
  findReorderItemIndex,
  moveReorderItem,
  normalizeReorderInsertionIndex,
} from "../../demo/src/routes/advanced-controls/reorder/ReorderDemoLogic";

function labels(items: Array<ReorderDemoItem>): string {
  let summary = "";
  for (let index = 0; index < items.length; index += 1) {
    if (index > 0) {
      summary += " | ";
    }
    summary += unchecked(items[index]).label;
  }
  return summary;
}

describe("Reorder demo logic", () => {
  it("normalizes raw insertion slots after the dragged item is removed", () => {
    expect<i32>(normalizeReorderInsertionIndex(1, 5, 8)).toBe(4);
    expect<i32>(normalizeReorderInsertionIndex(5, 1, 8)).toBe(1);
    expect<i32>(normalizeReorderInsertionIndex(7, 8, 8)).toBe(7);
  });

  it("reorders items from raw drag/drop insertion slots", () => {
    const items = createReorderDemoItems();

    expect<bool>(moveReorderItem(items, "drag-demo", 7)).toBe(true);
    expect<string>(labels(items)).toBe(
      "Document Core rename | Audit font shard cache | Write nested scroll test | Split key router | Tighten semantic ordering | Probe find mirror fallback | Add drag reorder demo | Validate drop cursor states",
    );
    expect<i32>(findReorderItemIndex(items, "drag-demo")).toBe(6);

    expect<bool>(moveReorderItem(items, "drag-demo", 0)).toBe(true);
    expect<i32>(findReorderItemIndex(items, "drag-demo")).toBe(0);
  });

  it("computes visible rows and edge autoscroll directions from the viewport", () => {
    const visibleTop = computeReorderVisibleRange(8, 0.0, REORDER_VIEWPORT_HEIGHT_PX);
    expect<i32>(visibleTop.firstVisibleIndex).toBe(0);
    expect<i32>(visibleTop.lastVisibleIndex).toBe(3);
    expect<i32>(computeReorderEdgeAutoScrollDirection(0, 8, visibleTop)).toBe(0);
    expect<i32>(computeReorderEdgeAutoScrollDirection(3, 8, visibleTop)).toBe(1);
    expect<i32>(computeReorderEdgeInsertionIndex(1, 8, visibleTop)).toBe(4);

    const visibleMid = computeReorderVisibleRange(8, 160.0, REORDER_VIEWPORT_HEIGHT_PX);
    expect<i32>(visibleMid.firstVisibleIndex).toBe(2);
    expect<i32>(visibleMid.lastVisibleIndex).toBe(5);
    expect<i32>(computeReorderEdgeAutoScrollDirection(2, 8, visibleMid)).toBe(-1);
    expect<i32>(computeReorderEdgeInsertionIndex(-1, 8, visibleMid)).toBe(2);
  });

  it("clamps timer-driven autoscroll to the valid content range", () => {
    const contentHeight = computeReorderContentHeight(8);

    expect<f32>(computeNextReorderAutoScrollOffset(0.0, -18.0, 8, REORDER_VIEWPORT_HEIGHT_PX)).toBe(0.0);
    expect<f32>(computeNextReorderAutoScrollOffset(0.0, 18.0, 8, REORDER_VIEWPORT_HEIGHT_PX)).toBeGreaterThan(0.0);
    expect<f32>(
      computeNextReorderAutoScrollOffset(contentHeight, 18.0, 8, REORDER_VIEWPORT_HEIGHT_PX),
    ).toBe(contentHeight - REORDER_VIEWPORT_HEIGHT_PX);
  });

  it("accelerates autoscroll as drag pointers approach and pass the viewport edge", () => {
    const viewportTop: f32 = 120.0;
    const viewportBottom: f32 = viewportTop + REORDER_VIEWPORT_HEIGHT_PX;
    const bottomInner = computeReorderPointerAutoScrollDelta(
      viewportBottom - REORDER_AUTOSCROLL_EDGE_ZONE_PX + <f32>4.0,
      viewportTop,
      REORDER_VIEWPORT_HEIGHT_PX,
    );
    const bottomNearEdge = computeReorderPointerAutoScrollDelta(
      viewportBottom - <f32>1.0,
      viewportTop,
      REORDER_VIEWPORT_HEIGHT_PX,
    );
    const bottomOutside = computeReorderPointerAutoScrollDelta(
      viewportBottom + <f32>36.0,
      viewportTop,
      REORDER_VIEWPORT_HEIGHT_PX,
    );
    expect<f32>(bottomInner).toBeGreaterThan(0.0);
    expect<f32>(bottomNearEdge).toBeGreaterThan(bottomInner);
    expect<f32>(bottomOutside).toBeGreaterThan(bottomNearEdge);

    const topInner = computeReorderPointerAutoScrollDelta(
      viewportTop + REORDER_AUTOSCROLL_EDGE_ZONE_PX - <f32>4.0,
      viewportTop,
      REORDER_VIEWPORT_HEIGHT_PX,
    );
    const topNearEdge = computeReorderPointerAutoScrollDelta(
      viewportTop + <f32>1.0,
      viewportTop,
      REORDER_VIEWPORT_HEIGHT_PX,
    );
    const topOutside = computeReorderPointerAutoScrollDelta(
      viewportTop - <f32>36.0,
      viewportTop,
      REORDER_VIEWPORT_HEIGHT_PX,
    );
    expect<f32>(topInner).toBeLessThan(0.0);
    expect<f32>(topNearEdge).toBeLessThan(topInner);
    expect<f32>(topOutside).toBeLessThan(topNearEdge);
  });
});
