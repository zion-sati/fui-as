export const REORDER_DRAG_FORMAT = "application/x-effindom-reorder-item-id";
export const REORDER_MARKER_HEIGHT_PX: f32 = 8.0;
export const REORDER_ROW_BODY_HEIGHT_PX: f32 = 72.0;
export const REORDER_SLOT_HEIGHT_PX: f32 = REORDER_MARKER_HEIGHT_PX + REORDER_ROW_BODY_HEIGHT_PX;
export const REORDER_END_SLOT_HEIGHT_PX: f32 = 44.0;
export const REORDER_VIEWPORT_HEIGHT_PX: f32 = 248.0;
export const REORDER_AUTOSCROLL_STEP_PX: f32 = 18.0;
export const REORDER_AUTOSCROLL_EDGE_ZONE_PX: f32 = 48.0;
export const REORDER_AUTOSCROLL_MAX_OUTSIDE_PX: f32 = 120.0;
export const REORDER_AUTOSCROLL_MIN_STEP_PX: f32 = 4.0;
export const REORDER_AUTOSCROLL_MAX_STEP_PX: f32 = 34.0;

export class ReorderDemoItem {
  constructor(
    readonly id: string,
    readonly label: string,
    readonly detail: string,
  ) {}
}

export class ReorderVisibleRange {
  constructor(
    readonly firstVisibleIndex: i32 = 0,
    readonly lastVisibleIndex: i32 = -1,
  ) {}
}

export function createReorderDemoItems(): Array<ReorderDemoItem> {
  const items = new Array<ReorderDemoItem>();
  items.push(new ReorderDemoItem("core-rename", "Document Core rename", "Keep Tier 1 references consistently renamed to Core."));
  items.push(new ReorderDemoItem("font-cache", "Audit font shard cache", "Check cache bounds, eviction, and diagnostics before release."));
  items.push(new ReorderDemoItem("drag-demo", "Add drag reorder demo", "Prove the phase-4 drag/drop controller on a real routed sample."));
  items.push(new ReorderDemoItem("nested-scroll", "Write nested scroll test", "Lock drop-target routing when a scrollable list sits inside a scrolled route."));
  items.push(new ReorderDemoItem("key-router", "Split key router", "Keep keyboard routing focused instead of growing another god file."));
  items.push(new ReorderDemoItem("semantics", "Tighten semantic ordering", "Make sure reorder status reads in the same order the canvas shows."));
  items.push(new ReorderDemoItem("find-mirror", "Probe find mirror fallback", "Double-check the hidden DOM mirror when large text windows shift."));
  items.push(new ReorderDemoItem("drop-cursor", "Validate drop cursor states", "Keep drag affordances coherent while the source stays captured."));
  return items;
}

export function findReorderItemIndex(items: Array<ReorderDemoItem>, itemId: string): i32 {
  for (let index = 0; index < items.length; index += 1) {
    if (unchecked(items[index]).id == itemId) {
      return index;
    }
  }
  return -1;
}

export function computeReorderContentHeight(itemCount: i32): f32 {
  const clampedItemCount = itemCount > 0 ? itemCount : 0;
  return (<f32>clampedItemCount * REORDER_SLOT_HEIGHT_PX) + REORDER_END_SLOT_HEIGHT_PX;
}

export function computeReorderVisibleRange(itemCount: i32, offsetY: f32, viewportHeight: f32): ReorderVisibleRange {
  if (itemCount <= 0) {
    return new ReorderVisibleRange(0, -1);
  }
  let firstVisibleIndex = <i32>Math.floor(offsetY / REORDER_SLOT_HEIGHT_PX);
  if (firstVisibleIndex < 0) {
    firstVisibleIndex = 0;
  }
  if (firstVisibleIndex > itemCount - 1) {
    firstVisibleIndex = itemCount - 1;
  }

  const effectiveViewportHeight = viewportHeight > 0.0 ? viewportHeight : REORDER_VIEWPORT_HEIGHT_PX;
  let lastVisibleIndex = <i32>Math.floor((offsetY + effectiveViewportHeight - 1.0) / REORDER_SLOT_HEIGHT_PX);
  if (lastVisibleIndex < firstVisibleIndex) {
    lastVisibleIndex = firstVisibleIndex;
  }
  if (lastVisibleIndex > itemCount - 1) {
    lastVisibleIndex = itemCount - 1;
  }
  return new ReorderVisibleRange(firstVisibleIndex, lastVisibleIndex);
}

export function normalizeReorderInsertionIndex(sourceIndex: i32, rawInsertionIndex: i32, itemCount: i32): i32 {
  if (itemCount <= 0) {
    return 0;
  }
  let clampedInsertionIndex = rawInsertionIndex;
  if (clampedInsertionIndex < 0) {
    clampedInsertionIndex = 0;
  }
  if (clampedInsertionIndex > itemCount) {
    clampedInsertionIndex = itemCount;
  }
  let normalizedIndex = clampedInsertionIndex;
  if (sourceIndex >= 0 && sourceIndex < itemCount && sourceIndex < normalizedIndex) {
    normalizedIndex -= 1;
  }
  if (normalizedIndex < 0) {
    normalizedIndex = 0;
  }
  const maxIndex = itemCount - 1;
  if (normalizedIndex > maxIndex) {
    normalizedIndex = maxIndex;
  }
  return normalizedIndex;
}

export function moveReorderItem(items: Array<ReorderDemoItem>, itemId: string, rawInsertionIndex: i32): bool {
  const sourceIndex = findReorderItemIndex(items, itemId);
  if (sourceIndex < 0 || items.length <= 1) {
    return false;
  }
  const targetIndex = normalizeReorderInsertionIndex(sourceIndex, rawInsertionIndex, items.length);
  if (targetIndex == sourceIndex) {
    return false;
  }
  const movedItem = unchecked(items[sourceIndex]);
  if (sourceIndex < targetIndex) {
    for (let index = sourceIndex; index < targetIndex; index += 1) {
      unchecked(items[index] = unchecked(items[index + 1]));
    }
  } else {
    for (let index = sourceIndex; index > targetIndex; index -= 1) {
      unchecked(items[index] = unchecked(items[index - 1]));
    }
  }
  unchecked(items[targetIndex] = movedItem);
  return true;
}

export function computeReorderMaxScrollOffset(itemCount: i32, viewportHeight: f32): f32 {
  const maxOffset = computeReorderContentHeight(itemCount) - viewportHeight;
  return maxOffset > 0.0 ? maxOffset : 0.0;
}

export function computeReorderEdgeAutoScrollDirection(
  rawInsertionIndex: i32,
  itemCount: i32,
  visibleRange: ReorderVisibleRange,
): i32 {
  if (itemCount <= 0 || visibleRange.lastVisibleIndex < 0) {
    return 0;
  }
  if (rawInsertionIndex <= visibleRange.firstVisibleIndex && visibleRange.firstVisibleIndex > 0) {
    return -1;
  }
  if (rawInsertionIndex >= visibleRange.lastVisibleIndex && visibleRange.lastVisibleIndex < itemCount - 1) {
    return 1;
  }
  if (rawInsertionIndex >= itemCount && visibleRange.lastVisibleIndex < itemCount - 1) {
    return 1;
  }
  return 0;
}

export function computeReorderEdgeInsertionIndex(
  direction: i32,
  itemCount: i32,
  visibleRange: ReorderVisibleRange,
): i32 {
  if (direction < 0) {
    return visibleRange.firstVisibleIndex;
  }
  if (direction > 0) {
    const edgeIndex = visibleRange.lastVisibleIndex + 1;
    return edgeIndex < itemCount ? edgeIndex : itemCount;
  }
  return -1;
}

function clamp01(value: f32): f32 {
  if (value < 0.0) {
    return 0.0;
  }
  if (value > 1.0) {
    return 1.0;
  }
  return value;
}

function computeReorderAutoScrollStep(activationDistance: f32): f32 {
  if (activationDistance <= 0.0) {
    return 0.0;
  }
  const maxActivation = REORDER_AUTOSCROLL_EDGE_ZONE_PX + REORDER_AUTOSCROLL_MAX_OUTSIDE_PX;
  const normalized = clamp01(activationDistance / maxActivation);
  const eased = normalized * normalized;
  return REORDER_AUTOSCROLL_MIN_STEP_PX + ((REORDER_AUTOSCROLL_MAX_STEP_PX - REORDER_AUTOSCROLL_MIN_STEP_PX) * eased);
}

export function computeReorderPointerAutoScrollDelta(pointerY: f32, viewportTopY: f32, viewportHeight: f32): f32 {
  if (viewportHeight <= 0.0) {
    return 0.0;
  }
  const viewportBottomY = viewportTopY + viewportHeight;
  const topZoneBottom = viewportTopY + REORDER_AUTOSCROLL_EDGE_ZONE_PX;
  if (pointerY <= topZoneBottom) {
    return -computeReorderAutoScrollStep(topZoneBottom - pointerY);
  }
  const bottomZoneTop = viewportBottomY - REORDER_AUTOSCROLL_EDGE_ZONE_PX;
  if (pointerY >= bottomZoneTop) {
    return computeReorderAutoScrollStep(pointerY - bottomZoneTop);
  }
  return 0.0;
}

export function computeNextReorderAutoScrollOffset(currentOffsetY: f32, deltaY: f32, itemCount: i32, viewportHeight: f32): f32 {
  if (deltaY == 0.0) {
    return currentOffsetY;
  }
  const maxOffset = computeReorderMaxScrollOffset(itemCount, viewportHeight);
  let nextOffsetY = currentOffsetY + deltaY;
  if (nextOffsetY < 0.0) {
    nextOffsetY = 0.0;
  }
  if (nextOffsetY > maxOffset) {
    nextOffsetY = maxOffset;
  }
  return nextOffsetY;
}
