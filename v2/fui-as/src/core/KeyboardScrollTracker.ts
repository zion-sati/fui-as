import * as ui from "../bindings/ui";
import { ScrollView } from "../nodes";
import { Node } from "./Node";

const BOUNDS_TOLERANCE: f32 = 0.5;

const scrollViews: Array<ScrollView> = new Array<ScrollView>();
let selectedScrollView: ScrollView | null = null;
let selectedBranchRoot: Node | null = null;

function indexOfScrollView(target: ScrollView): i32 {
  for (let index = 0; index < scrollViews.length; ++index) {
    if (unchecked(scrollViews[index]) === target) {
      return index;
    }
  }
  return -1;
}

function isUsableBounds(bounds: Float32Array | null): bool {
  return bounds !== null && unchecked(bounds[2]) > BOUNDS_TOLERANCE && unchecked(bounds[3]) > BOUNDS_TOLERANCE;
}

function isVisible(bounds: Float32Array): bool {
  const x = unchecked(bounds[0]);
  const y = unchecked(bounds[1]);
  const width = unchecked(bounds[2]);
  const height = unchecked(bounds[3]);
  const viewportWidth = ui.getViewportWidth();
  const viewportHeight = ui.getViewportHeight();
  return x + width > 0.0 &&
    y + height > 0.0 &&
    x < viewportWidth &&
    y < viewportHeight;
}

function containsPoint(bounds: Float32Array, x: f32, y: f32): bool {
  return x >= unchecked(bounds[0]) &&
    x <= unchecked(bounds[0]) + unchecked(bounds[2]) &&
    y >= unchecked(bounds[1]) &&
    y <= unchecked(bounds[1]) + unchecked(bounds[3]);
}

function area(bounds: Float32Array): f32 {
  return unchecked(bounds[2]) * unchecked(bounds[3]);
}

function distanceSquared(bounds: Float32Array, x: f32, y: f32): f32 {
  let deltaX: f32 = 0.0;
  if (x < unchecked(bounds[0])) {
    deltaX = unchecked(bounds[0]) - x;
  } else {
    const right = unchecked(bounds[0]) + unchecked(bounds[2]);
    if (x > right) {
      deltaX = x - right;
    }
  }

  let deltaY: f32 = 0.0;
  if (y < unchecked(bounds[1])) {
    deltaY = unchecked(bounds[1]) - y;
  } else {
    const bottom = unchecked(bounds[1]) + unchecked(bounds[3]);
    if (y > bottom) {
      deltaY = y - bottom;
    }
  }

  return (deltaX * deltaX) + (deltaY * deltaY);
}

function isBetterPointCandidate(
  candidateBounds: Float32Array,
  candidateContainsPoint: bool,
  bestBounds: Float32Array,
  bestContainsPoint: bool,
  pointX: f32,
  pointY: f32,
): bool {
  if (candidateContainsPoint != bestContainsPoint) {
    return candidateContainsPoint;
  }
  if (candidateContainsPoint) {
    const candidateArea = area(candidateBounds);
    const bestArea = area(bestBounds);
    if (candidateArea + BOUNDS_TOLERANCE < bestArea) {
      return true;
    }
    if (bestArea + BOUNDS_TOLERANCE < candidateArea) {
      return false;
    }
  } else {
    const candidateDistance = distanceSquared(candidateBounds, pointX, pointY);
    const bestDistance = distanceSquared(bestBounds, pointX, pointY);
    if (candidateDistance + BOUNDS_TOLERANCE < bestDistance) {
      return true;
    }
    if (bestDistance + BOUNDS_TOLERANCE < candidateDistance) {
      return false;
    }
  }
  if (unchecked(candidateBounds[1]) + BOUNDS_TOLERANCE < unchecked(bestBounds[1])) {
    return true;
  }
  if (unchecked(bestBounds[1]) + BOUNDS_TOLERANCE < unchecked(candidateBounds[1])) {
    return false;
  }
  return unchecked(candidateBounds[0]) < unchecked(bestBounds[0]);
}

function isBetterDefaultCandidate(candidateBounds: Float32Array, bestBounds: Float32Array): bool {
  if (unchecked(candidateBounds[1]) + BOUNDS_TOLERANCE < unchecked(bestBounds[1])) {
    return true;
  }
  if (unchecked(bestBounds[1]) + BOUNDS_TOLERANCE < unchecked(candidateBounds[1])) {
    return false;
  }
  return unchecked(candidateBounds[0]) < unchecked(bestBounds[0]);
}

function getUsableVisibleBounds(node: Node): Float32Array | null {
  const bounds = ui.tryGetBounds(node.builtHandle);
  if (!isUsableBounds(bounds)) {
    return null;
  }
  const rect = changetype<Float32Array>(bounds);
  if (!isVisible(rect)) {
    return null;
  }
  return rect;
}

function getDefaultOrderingAnchor(scrollView: ScrollView): Node {
  let anchor: Node = scrollView;
  let cursor = scrollView.parentNode;
  while (cursor !== null) {
    if (cursor instanceof ScrollView) {
      break;
    }
    anchor = changetype<Node>(cursor);
    cursor = cursor.parentNode;
  }
  return anchor;
}

function appendUniqueScrollView(target: Array<ScrollView>, view: ScrollView): void {
  if (indexOfScrollView(view) < 0 || getUsableVisibleBounds(view) === null) {
    return;
  }
  for (let index = 0; index < target.length; ++index) {
    if (unchecked(target[index]) === view) {
      return;
    }
  }
  target.push(view);
}

function appendDefaultOrderedCandidate(target: Array<ScrollView>, candidate: ScrollView): void {
  if (indexOfScrollView(candidate) < 0) {
    return;
  }
  const candidateBounds = getUsableVisibleBounds(candidate);
  if (candidateBounds === null) {
    return;
  }
  const anchorBounds = getUsableVisibleBounds(getDefaultOrderingAnchor(candidate));
  if (anchorBounds === null) {
    return;
  }
  let insertIndex = target.length;
  while (insertIndex > 0) {
    const current = unchecked(target[insertIndex - 1]);
    const currentAnchorBounds = getUsableVisibleBounds(getDefaultOrderingAnchor(current));
    const currentCandidateBounds = getUsableVisibleBounds(current);
    if (currentAnchorBounds === null || currentCandidateBounds === null) {
      insertIndex -= 1;
      continue;
    }
    if (isBetterDefaultCandidate(anchorBounds, currentAnchorBounds)) {
      insertIndex -= 1;
      continue;
    }
    if (
      unchecked(anchorBounds[0]) == unchecked(currentAnchorBounds[0]) &&
      unchecked(anchorBounds[1]) == unchecked(currentAnchorBounds[1]) &&
      unchecked(anchorBounds[2]) == unchecked(currentAnchorBounds[2]) &&
      unchecked(anchorBounds[3]) == unchecked(currentAnchorBounds[3]) &&
      isBetterDefaultCandidate(candidateBounds, currentCandidateBounds)
    ) {
      insertIndex -= 1;
      continue;
    }
    break;
  }
  target.push(candidate);
  for (let cursor = target.length - 1; cursor > insertIndex; --cursor) {
    unchecked(target[cursor] = unchecked(target[cursor - 1]));
  }
  unchecked(target[insertIndex] = candidate);
}

function isDescendantOf(node: Node, ancestor: Node): bool {
  let current: Node | null = node;
  while (current !== null) {
    if (current === ancestor) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

function selectDefaultCandidatesWithin(root: Node | null): Array<ScrollView> {
  const ordered = new Array<ScrollView>();
  if (root === null) {
    return ordered;
  }
  for (let index = 0; index < scrollViews.length; ++index) {
    const candidate = unchecked(scrollViews[index]);
    if (!isDescendantOf(candidate, root)) {
      continue;
    }
    appendDefaultOrderedCandidate(ordered, candidate);
  }
  return ordered;
}

function findNearestDescendantScrollBranch(node: Node | null): Node | null {
  let current = node;
  while (current !== null) {
    if (current instanceof ScrollView) {
      return null;
    }
    if (selectDefaultCandidatesWithin(current).length > 0) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function selectScrollViewByPoint(pointX: f32, pointY: f32): ScrollView | null {
  let bestView: ScrollView | null = null;
  let bestBounds: Float32Array | null = null;
  let bestContainsPoint = false;
  for (let index = 0; index < scrollViews.length; ++index) {
    const candidateView = unchecked(scrollViews[index]);
    const bounds = ui.tryGetBounds(candidateView.builtHandle);
    if (!isUsableBounds(bounds)) {
      continue;
    }
    const candidateBounds = changetype<Float32Array>(bounds);
    const candidateContainsPoint = containsPoint(candidateBounds, pointX, pointY);
    if (bestBounds === null || isBetterPointCandidate(
      candidateBounds,
      candidateContainsPoint,
      changetype<Float32Array>(bestBounds),
      bestContainsPoint,
      pointX,
      pointY,
    )) {
      bestView = candidateView;
      bestBounds = candidateBounds;
      bestContainsPoint = candidateContainsPoint;
    }
  }
  return bestView;
}

function resolveAncestorScrollView(node: Node | null): ScrollView | null {
  let current = node;
  while (current !== null) {
    if (current instanceof ScrollView) {
      return changetype<ScrollView>(current);
    }
    current = current.parentNode;
  }
  return null;
}

function appendAncestorScrollViewFallbacks(view: ScrollView | null, target: Array<ScrollView>): void {
  if (view === null) {
    return;
  }
  let current: Node | null = view.parentNode;
  while (current !== null) {
    if (current instanceof ScrollView) {
      appendUniqueScrollView(target, changetype<ScrollView>(current));
    }
    current = current.parentNode;
  }
}

function selectDefaultCandidates(): Array<ScrollView> {
  const ordered = new Array<ScrollView>();
  for (let index = 0; index < scrollViews.length; ++index) {
    appendDefaultOrderedCandidate(ordered, unchecked(scrollViews[index]));
  }
  return ordered;
}

export function registerKeyboardScrollNode(node: Node): void {
  if (!(node instanceof ScrollView)) {
    return;
  }
  const view = changetype<ScrollView>(node);
  if (indexOfScrollView(view) >= 0) {
    return;
  }
  scrollViews.push(view);
}

export function unregisterKeyboardScrollNode(node: Node): void {
  if (!(node instanceof ScrollView)) {
    return;
  }
  const view = changetype<ScrollView>(node);
  const index = indexOfScrollView(view);
  if (index < 0) {
    return;
  }
  for (let cursor = index; cursor < scrollViews.length - 1; ++cursor) {
    unchecked(scrollViews[cursor] = unchecked(scrollViews[cursor + 1]));
  }
  scrollViews.length = scrollViews.length - 1;
  if (selectedScrollView === view) {
    selectedScrollView = null;
  }
}

export function trackKeyboardScrollPointerUp(targetNode: Node | null, x: f32, y: f32): void {
  selectedBranchRoot = targetNode instanceof ScrollView
    ? changetype<Node>(targetNode)
    : findNearestDescendantScrollBranch(targetNode);
  const ancestorScrollView = resolveAncestorScrollView(targetNode);
  if (ancestorScrollView !== null) {
    if (selectedBranchRoot === null) {
      selectedBranchRoot = changetype<Node>(ancestorScrollView);
    }
    selectedScrollView = ancestorScrollView;
    return;
  }
  if (selectedBranchRoot !== null) {
    const branchCandidates = selectDefaultCandidatesWithin(selectedBranchRoot);
    selectedScrollView = branchCandidates.length > 0 ? unchecked(branchCandidates[0]) : null;
    if (selectedScrollView !== null) {
      return;
    }
  }
  selectedScrollView = selectScrollViewByPoint(x, y);
  if (selectedScrollView === null) {
    selectedBranchRoot = null;
  }
}

export function getKeyboardScrollSelectedCandidate(): ScrollView | null {
  return selectedScrollView;
}

export function getKeyboardScrollFallbackCandidates(): Array<ScrollView> {
  const ordered = new Array<ScrollView>();
  appendAncestorScrollViewFallbacks(selectedScrollView, ordered);
  if (selectedBranchRoot !== null) {
    const branchCandidates = selectDefaultCandidatesWithin(selectedBranchRoot);
    for (let index = 0; index < branchCandidates.length; ++index) {
      const candidate = unchecked(branchCandidates[index]);
      if (candidate !== selectedScrollView) {
        appendUniqueScrollView(ordered, candidate);
      }
    }
  }
  const globalCandidates = selectDefaultCandidates();
  for (let index = 0; index < globalCandidates.length; ++index) {
    const candidate = unchecked(globalCandidates[index]);
    if (candidate !== selectedScrollView) {
      appendUniqueScrollView(ordered, candidate);
    }
  }
  return ordered;
}

export function resetKeyboardScrollTracking(): void {
  scrollViews.length = 0;
  selectedScrollView = null;
  selectedBranchRoot = null;
}
