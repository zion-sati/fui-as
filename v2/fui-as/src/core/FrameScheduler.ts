import * as ui from "../bindings/ui";

let needsCommit: bool = false;
let flushScheduled: bool = false;
let didFirstCommit: bool = false;

// WPF-style Loaded event — fires once after the tree is built and mounted.
const loadedCallbacks = new Array<() => void>();

export function markNeedsCommit(): void {
  needsCommit = true;
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  ui.requestRender();
}

/**
 * Register a callback that fires once after the page has been mounted and
 * the first frame has been committed.  Safe to call during `buildPage()` —
 * timers started here survive `cancelAllTimers()` in `Application.mount()`.
 */
export function onLoaded(cb: () => void): void {
  if (didFirstCommit) {
    cb();
    return;
  }
  loadedCallbacks.push(cb);
}

export function fireLoadedCallbacks(): void {
  if (didFirstCommit) return;
  didFirstCommit = true;
  for (let i: i32 = 0; i < loadedCallbacks.length; i++) {
    loadedCallbacks[i]();
  }
  loadedCallbacks.length = 0;
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
  didFirstCommit = false;
}
