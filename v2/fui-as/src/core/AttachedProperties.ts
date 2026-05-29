import * as ui from "../bindings/ui";

let nextAttachedPropertyKey: u32 = 1;
const gridSharedSizeScopeKeys = new Map<u32, bool>();

export function allocateAttachedPropertyKey(): u32 {
  const key = nextAttachedPropertyKey;
  nextAttachedPropertyKey += 1;
  return key;
}

export function setGridSharedSizeScope(key: u32, enabled: bool): bool {
  const hasValue = gridSharedSizeScopeKeys.has(key);
  if (enabled) {
    if (hasValue) {
      return false;
    }
    gridSharedSizeScopeKeys.set(key, true);
    return true;
  }
  if (!hasValue) {
    return false;
  }
  gridSharedSizeScopeKeys.delete(key);
  return true;
}

export function applyAttachedProperties(key: u32, handle: u64): void {
  if (gridSharedSizeScopeKeys.has(key)) {
    ui.setIsSharedSizeScope(handle, true);
  }
}
