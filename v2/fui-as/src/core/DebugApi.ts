import {
  __fui_on_focus_changed,
  __fui_on_key_event,
  __fui_on_pointer_event,
  __fui_on_scroll,
} from "./event_exports";

export function __fui_debug_pointer_event(eventType: u32, handle: u64, x: f32, y: f32, modifiers: u32 = 0): void {
  __fui_on_pointer_event(eventType, handle, x, y, modifiers);
}

export function __fui_debug_focus_changed(handle: u64, focused: bool): void {
  __fui_on_focus_changed(handle, focused);
}

export function __fui_debug_key_event(eventType: u32, keyPtr: usize, keyLen: u32, modifiers: u32): void {
  __fui_on_key_event(eventType, keyPtr, keyLen, modifiers);
}

export function __fui_debug_scroll(
  handle: u64,
  offsetX: f32,
  offsetY: f32,
  contentWidth: f32,
  contentHeight: f32,
  viewportWidth: f32,
  viewportHeight: f32,
): void {
  __fui_on_scroll(handle, offsetX, offsetY, contentWidth, contentHeight, viewportWidth, viewportHeight);
}
