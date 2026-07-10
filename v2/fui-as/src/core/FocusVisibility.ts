import { Signal } from "./Signal";
import { KeyEventType, KeyModifier, PointerEventType } from "./ffi";

export const keyboardFocusVisible = new Signal<bool>(true);

function isModifierKey(key: string): bool {
  return key == "Shift" || key == "Control" || key == "Alt" || key == "Meta";
}

export function showKeyboardFocusForPointerEvent(eventType: PointerEventType): void {
  if (eventType == PointerEventType.Down) {
    keyboardFocusVisible.value = false;
  }
}

function hasNonShiftModifier(modifiers: u32): bool {
  return (modifiers & (KeyModifier.Ctrl | KeyModifier.Alt | KeyModifier.Meta)) != 0;
}

function isCaretNavigationKey(key: string): bool {
  return key == "ArrowLeft" || key == "ArrowRight" || key == "ArrowUp" || key == "ArrowDown" || key == "Home" || key == "End" || key == "PageUp" || key == "PageDown";
}

export function showKeyboardFocusForKeyEvent(eventType: KeyEventType, key: string, modifiers: u32 = 0): void {
  if (eventType != KeyEventType.Down || isModifierKey(key)) {
    return;
  }
  if (hasNonShiftModifier(modifiers)) {
    return;
  }
  if (isCaretNavigationKey(key)) {
    return;
  }
  if (key == "Escape") {
    keyboardFocusVisible.value = false;
    return;
  }
  keyboardFocusVisible.value = true;
}

export function resetKeyboardFocusVisibility(): void {
  keyboardFocusVisible.value = true;
}
