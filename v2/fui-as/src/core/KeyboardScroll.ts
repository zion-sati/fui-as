import { EventRouter } from "./EventRouter";
import {
  getKeyboardScrollFallbackCandidates,
  getKeyboardScrollSelectedCandidate,
} from "./KeyboardScrollTracker";
import { Node } from "./Node";
import { ScrollView, Text } from "../nodes";

const KEYBOARD_SCROLL_LINE_STEP: f32 = 40.0;
const KEYBOARD_SCROLL_PAGE_OVERLAP: f32 = 40.0;
const KEYBOARD_SCROLL_TOLERANCE: f32 = 0.5;

function isKeyboardScrollKey(key: string): bool {
  return key == "ArrowLeft" ||
    key == "ArrowRight" ||
    key == "ArrowUp" ||
    key == "ArrowDown" ||
    key == "PageUp" ||
    key == "PageDown" ||
    key == "Home" ||
    key == "End";
}

function isHorizontalKeyboardScrollKey(key: string): bool {
  return key == "ArrowLeft" || key == "ArrowRight";
}

function isVerticalKeyboardScrollKey(key: string): bool {
  return key == "ArrowUp" ||
    key == "ArrowDown" ||
    key == "PageUp" ||
    key == "PageDown" ||
    key == "Home" ||
    key == "End";
}

function shouldSkipTextOwnedFallback(node: Text, key: string): bool {
  if (key == "Home" || key == "End") {
    return true;
  }
  return node.isEditableText &&
    (key == "ArrowLeft" || key == "ArrowRight" || key == "ArrowUp" || key == "ArrowDown");
}

function pageStep(viewportHeight: f32): f32 {
  if (viewportHeight <= 0.0) {
    return 0.0;
  }
  if (viewportHeight > KEYBOARD_SCROLL_PAGE_OVERLAP) {
    return viewportHeight - KEYBOARD_SCROLL_PAGE_OVERLAP;
  }
  return viewportHeight * 0.875;
}

function clamp(value: f32, minValue: f32, maxValue: f32): f32 {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
}

function tryScrollViewport(view: ScrollView, key: string): bool {
  const state = view.scrollState;
  if (isHorizontalKeyboardScrollKey(key)) {
    if (!view.isHorizontalScrollEnabled) {
      return false;
    }
    const viewportWidth = state.viewportWidth.value;
    const maxOffsetX = <f32>Math.max(0.0, state.contentWidth.value - viewportWidth);
    if (maxOffsetX <= KEYBOARD_SCROLL_TOLERANCE) {
      return false;
    }
    const currentOffsetX = clamp(state.offsetX.value, 0.0, maxOffsetX);
    let nextOffsetX = currentOffsetX;
    if (key == "ArrowLeft") {
      nextOffsetX = currentOffsetX - KEYBOARD_SCROLL_LINE_STEP;
    } else if (key == "ArrowRight") {
      nextOffsetX = currentOffsetX + KEYBOARD_SCROLL_LINE_STEP;
    } else {
      return false;
    }
    nextOffsetX = clamp(nextOffsetX, 0.0, maxOffsetX);
    if (Math.abs(nextOffsetX - currentOffsetX) <= KEYBOARD_SCROLL_TOLERANCE) {
      return false;
    }
    view.scrollOffset(nextOffsetX, state.offsetY.value);
    return true;
  }

  if (!isVerticalKeyboardScrollKey(key) || !view.isVerticalScrollEnabled) {
    return false;
  }
  const viewportHeight = state.viewportHeight.value;
  const maxOffsetY = <f32>Math.max(0.0, state.contentHeight.value - viewportHeight);
  if (maxOffsetY <= KEYBOARD_SCROLL_TOLERANCE) {
    return false;
  }

  const currentOffsetY = clamp(state.offsetY.value, 0.0, maxOffsetY);
  let nextOffsetY = currentOffsetY;
  if (key == "ArrowUp") {
    nextOffsetY = currentOffsetY - KEYBOARD_SCROLL_LINE_STEP;
  } else if (key == "ArrowDown") {
    nextOffsetY = currentOffsetY + KEYBOARD_SCROLL_LINE_STEP;
  } else if (key == "PageUp") {
    nextOffsetY = currentOffsetY - pageStep(viewportHeight);
  } else if (key == "PageDown") {
    nextOffsetY = currentOffsetY + pageStep(viewportHeight);
  } else if (key == "Home") {
    nextOffsetY = 0.0;
  } else if (key == "End") {
    nextOffsetY = maxOffsetY;
  } else {
    return false;
  }

  nextOffsetY = clamp(nextOffsetY, 0.0, maxOffsetY);
  if (Math.abs(nextOffsetY - currentOffsetY) <= KEYBOARD_SCROLL_TOLERANCE) {
    return false;
  }

  view.scrollOffset(state.offsetX.value, nextOffsetY);
  return true;
}

export function handleKeyboardScrollFallback(key: string, modifiers: u32): bool {
  if (modifiers != 0 || !isKeyboardScrollKey(key)) {
    return false;
  }

  const focusedNode = EventRouter.getFocusedNode();
  if (focusedNode !== null) {
    if (focusedNode instanceof Text && shouldSkipTextOwnedFallback(changetype<Text>(focusedNode), key)) {
      return false;
    }

    let current: Node | null = focusedNode;
    while (current !== null) {
      if (current instanceof ScrollView && tryScrollViewport(changetype<ScrollView>(current), key)) {
        return true;
      }
      current = current.parentNode;
    }
  }

  const selectedCandidate = getKeyboardScrollSelectedCandidate();
  if (selectedCandidate !== null && tryScrollViewport(selectedCandidate, key)) {
    return true;
  }

  const fallbackCandidates = getKeyboardScrollFallbackCandidates();
  for (let index = 0; index < fallbackCandidates.length; ++index) {
    if (tryScrollViewport(unchecked(fallbackCandidates[index]), key)) {
      return true;
    }
  }
  return false;
}
