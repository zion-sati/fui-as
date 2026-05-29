import * as ui from "../bindings/ui";

let needsCommit: bool = false;
let flushScheduled: bool = false;

export function markNeedsCommit(): void {
  needsCommit = true;
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  ui.requestRender();
}

export function flushCommit(): bool {
  flushScheduled = false;
  if (!needsCommit) {
    return false;
  }
  needsCommit = false;
  ui.commitFrame();
  return true;
}

export function resetCommitState(): void {
  needsCommit = false;
  flushScheduled = false;
}
