import { EventRouter } from "./EventRouter";
import { ContextMenuManager } from "./ContextMenuManager";
import { handleFetchComplete, handleFetchError } from "./Fetch";
import { handleKeyboardScrollFallback } from "./KeyboardScroll";
import { KeyEventType, PointerEventType } from "./ffi";
import {
  BrowserFile,
  BrowserFileWriter,
  createBrowserFileWriter,
  FileCapabilities,
  FileReadChunk,
  FileSaveMode,
  FileSaveResult,
  handleFileWorkerProcessChunk,
  handleFileWorkerProcessComplete,
  handleFileWorkerProcessError,
  handleFileWorkerProcessProgress,
  FileWriteProgress,
  handleFilePickResult,
  handleFileReadChunkResult,
  handleFileSaveResult,
  handleFileWriterCreated,
  handleFileWriterFinished,
  handleFileWriterProgress,
  registerBrowserFile,
} from "./File";
import { handleRouteChanged } from "./Navigation";
import { handleSystemAccentColorChanged, handleSystemDarkModeChanged } from "./Theme";
import { handleTimer } from "./Timers";
import { handleWorkerComplete, handleWorkerError, handleWorkerProgress } from "./Worker";
import { tickAnimations } from "./Animation";
import { ExternalDragEventType } from "./ExternalDropManager";
import {
  describeHandle,
  describeKeyEventType,
  describePointerEventType,
  error,
  log,
  warn,
} from "./Logger";
import { Signal } from "./Signal";
import { DragDropEffects, ExternalDropItemInfo, ExternalDropItemKind, GestureEventKind, GestureEventPhase, PointerType, WheelDeltaMode } from "./Node";

const KEY_BUFFER = new Uint8Array(256);
const TEXT_BUFFER = new Uint8Array(1024 * 1024);
let focusedHandle: u64 = 0;
export const viewportWidthSignal = new Signal<f32>(0.0);
export const viewportHeightSignal = new Signal<f32>(0.0);
export const frameTimeSignal = new Signal<f64>(0.0);

export function __fui_key_buffer(): usize {
  return KEY_BUFFER.dataStart;
}

export function __fui_text_buffer(): usize {
  return TEXT_BUFFER.dataStart;
}

export function __fui_text_buffer_size(): u32 {
  return <u32>TEXT_BUFFER.length;
}

export function __fui_on_pointer_event_with_metadata(
  eventType: u32,
  handle: u64,
  x: f32,
  y: f32,
  modifiers: u32,
  pointerId: i32,
  pointerType: u32,
  button: i32,
  buttons: u32,
  pressure: f32,
  width: f32,
  height: f32,
  clickCount: i32,
): bool {
  log(
    "Event",
    "pointer type=" + describePointerEventType(<PointerEventType>eventType) +
      " handle=" + describeHandle(handle) +
      " x=" + x.toString() +
      " y=" + y.toString() +
      " modifiers=" + modifiers.toString() +
      " pointerId=" + pointerId.toString() +
      " pointerType=" + pointerType.toString() +
      " button=" + button.toString() +
      " buttons=" + buttons.toString() +
      " pressure=" + pressure.toString() +
      " width=" + width.toString() +
      " height=" + height.toString() +
      " clickCount=" + clickCount.toString(),
  );
  ContextMenuManager.trackPointerEvent(<PointerEventType>eventType, handle);
  return EventRouter.dispatchPointerEvent(
    handle,
    <PointerEventType>eventType,
    x,
    y,
    modifiers,
    pointerId,
    <PointerType>pointerType,
    button,
    buttons,
    pressure,
    width,
    height,
    clickCount,
  );
}

export function __fui_on_wheel_event(
  handle: u64,
  x: f32,
  y: f32,
  deltaX: f32,
  deltaY: f32,
  deltaMode: u32,
  modifiers: u32,
): bool {
  log(
    "Event",
    "wheel handle=" + describeHandle(handle) +
      " x=" + x.toString() +
      " y=" + y.toString() +
      " deltaX=" + deltaX.toString() +
      " deltaY=" + deltaY.toString() +
      " modifiers=" + modifiers.toString(),
  );
  return EventRouter.dispatchWheelEvent(handle, x, y, deltaX, deltaY, <WheelDeltaMode>deltaMode, modifiers);
}

export function __fui_resolve_gesture_owner(handle: u64): u64 {
  return EventRouter.resolveGestureOwner(handle);
}

export function __fui_get_gesture_intent(handle: u64): u32 {
  return <u32>EventRouter.getGestureIntent(handle);
}

export function __fui_resolve_long_press_owner(handle: u64): u64 {
  return EventRouter.resolveLongPressOwner(handle);
}

export function __fui_get_long_press_minimum_duration_ms(handle: u64): i32 {
  return EventRouter.getLongPressMinimumDurationMs(handle);
}

export function __fui_get_long_press_movement_tolerance(handle: u64): f32 {
  return EventRouter.getLongPressMovementTolerance(handle);
}

export function __fui_long_press_continues_pointer_events(handle: u64): bool {
  return EventRouter.longPressContinuesPointerEvents(handle);
}

export function __fui_on_gesture_event(
  handle: u64,
  phase: u32,
  kind: u32,
  x: f32,
  y: f32,
  deltaX: f32,
  deltaY: f32,
  scale: f32,
  pointerCount: i32,
): bool {
  return EventRouter.dispatchGestureEvent(handle, <GestureEventPhase>phase, <GestureEventKind>kind, x, y, deltaX, deltaY, scale, pointerCount);
}

export function __fui_on_long_press_event(
  handle: u64,
  x: f32,
  y: f32,
  pointerId: i32,
  pointerType: u32,
  modifiers: u32,
  durationMs: i32,
): bool {
  return EventRouter.dispatchLongPressEvent(handle, x, y, pointerId, <PointerType>pointerType, modifiers, durationMs);
}

export function __fui_on_viewport_changed(w: f32, h: f32): void {
  log("Event", "viewport width=" + w.toString() + " height=" + h.toString());
  viewportWidthSignal.value = w;
  viewportHeightSignal.value = h;
}

export function __fui_on_frame(timestampMs: f64): void {
  frameTimeSignal.value = timestampMs;
  tickAnimations(timestampMs);
}

export function __fui_on_timer(timerId: u32): void {
  log("Event", "timer fired id=" + timerId.toString());
  handleTimer(timerId);
}

export function __fui_on_worker_progress(workerId: u32, textPtr: usize, textLen: u32): void {
  const progress = String.UTF8.decodeUnsafe(textPtr, <usize>textLen, false);
  log("Event", "worker progress id=" + workerId.toString() + " value=" + progress);
  handleWorkerProgress(workerId, progress);
}

export function __fui_on_worker_complete(workerId: u32, textPtr: usize, textLen: u32): void {
  const result = String.UTF8.decodeUnsafe(textPtr, <usize>textLen, false);
  log("Event", "worker complete id=" + workerId.toString() + " value=" + result);
  handleWorkerComplete(workerId, result);
}

export function __fui_on_worker_error(workerId: u32, textPtr: usize, textLen: u32): void {
  const message = String.UTF8.decodeUnsafe(textPtr, <usize>textLen, false);
  log("Event", "worker error id=" + workerId.toString() + " value=" + message);
  handleWorkerError(workerId, message);
}

export function __fui_on_fetch_complete(
  requestId: u32,
  ok: bool,
  status: i32,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  const payload = readTextPartsPayload(payloadPtr, payloadLen);
  handleFetchComplete(
    requestId,
    ok,
    status,
    payload.length > 0 ? unchecked(payload[0]) : "",
    payload.length > 1 ? unchecked(payload[1]) : "",
  );
}

export function __fui_on_fetch_error(requestId: u32, payloadPtr: usize, payloadLen: u32): void {
  handleFetchError(requestId, readHostMessage(payloadPtr, payloadLen));
}

function readHostMessage(payloadPtr: usize, payloadLen: u32): string | null {
  if (payloadPtr == 0 || payloadLen == 0) {
    return null;
  }
  return String.UTF8.decodeUnsafe(payloadPtr, <usize>payloadLen, false);
}

function readBrowserFiles(payloadPtr: usize, payloadLen: u32): Array<BrowserFile> {
  const files = new Array<BrowserFile>();
  if (payloadPtr == 0 || payloadLen == 0 || payloadLen < sizeof<u32>()) {
    return files;
  }
  const end = payloadPtr + <usize>payloadLen;
  let cursor = payloadPtr;
  const count = load<u32>(cursor);
  cursor += sizeof<u32>();
  for (let index: u32 = 0; index < count; index += 1) {
    if (cursor + sizeof<u32>() > end) {
      warn("File", "Truncated file id length at index " + index.toString() + ".");
      return files;
    }
    const idLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>idLen > end) {
      warn("File", "Truncated file id at index " + index.toString() + ".");
      return files;
    }
    const id = idLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>idLen, false) : "";
    cursor += <usize>idLen;

    if (cursor + sizeof<u64>() + sizeof<u64>() > end) {
      warn("File", "Truncated file size metadata at index " + index.toString() + ".");
      return files;
    }
    const sizeBytes = load<u64>(cursor);
    cursor += sizeof<u64>();
    const lastModifiedMs = load<u64>(cursor);
    cursor += sizeof<u64>();

    if (cursor + sizeof<u32>() > end) {
      warn("File", "Truncated file name length at index " + index.toString() + ".");
      return files;
    }
    const nameLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>nameLen > end) {
      warn("File", "Truncated file name at index " + index.toString() + ".");
      return files;
    }
    const name = nameLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>nameLen, false) : "";
    cursor += <usize>nameLen;

    if (cursor + sizeof<u32>() > end) {
      warn("File", "Truncated file MIME length at index " + index.toString() + ".");
      return files;
    }
    const mimeLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>mimeLen > end) {
      warn("File", "Truncated file MIME at index " + index.toString() + ".");
      return files;
    }
    const mimeType = mimeLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>mimeLen, false) : null;
    cursor += <usize>mimeLen;
    files.push(registerBrowserFile(id, name, mimeType, sizeBytes, lastModifiedMs));
  }
  return files;
}

function readWriterPayload(payloadPtr: usize, payloadLen: u32): Array<string> {
  const values = new Array<string>();
  if (payloadPtr == 0 || payloadLen < sizeof<u32>()) {
    return values;
  }
  const end = payloadPtr + <usize>payloadLen;
  let cursor = payloadPtr;
  const mode = load<u32>(cursor);
  if (mode != <u32>FileSaveMode.Download && mode != <u32>FileSaveMode.NativePicker) {
    warn("File", "Unknown file save mode " + mode.toString() + ".");
  }
  values.push(mode.toString());
  cursor += sizeof<u32>();
  while (cursor < end) {
    if (cursor + sizeof<u32>() > end) {
      return values;
    }
    const partLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>partLen > end) {
      return values;
    }
    values.push(partLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>partLen, false) : "");
    cursor += <usize>partLen;
  }
  return values;
}

function readTextPartsPayload(payloadPtr: usize, payloadLen: u32): Array<string> {
  const values = new Array<string>();
  if (payloadPtr == 0 || payloadLen < sizeof<u32>()) {
    return values;
  }
  const end = payloadPtr + <usize>payloadLen;
  let cursor = payloadPtr;
  const count = load<u32>(cursor);
  cursor += sizeof<u32>();
  for (let index: u32 = 0; index < count; index += 1) {
    if (cursor + sizeof<u32>() > end) {
      return values;
    }
    const partLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>partLen > end) {
      return values;
    }
    values.push(partLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>partLen, false) : "");
    cursor += <usize>partLen;
  }
  return values;
}

export function __fui_on_file_pick_result(requestId: u32, status: u32, payloadPtr: usize, payloadLen: u32): void {
  handleFilePickResult(
    requestId,
    status,
    status == 1 ? readBrowserFiles(payloadPtr, payloadLen) : new Array<BrowserFile>(),
    status == 1 ? null : readHostMessage(payloadPtr, payloadLen),
  );
}

export function __fui_on_file_read_result(
  requestId: u32,
  status: u32,
  offsetBytes: u64,
  fileSizeBytes: u64,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  let chunk: FileReadChunk | null = null;
  if (status == 1) {
    const bytes = new Uint8Array(payloadLen);
    if (payloadLen > 0) {
      memory.copy(bytes.dataStart, payloadPtr, <usize>payloadLen);
    }
    chunk = new FileReadChunk(offsetBytes, fileSizeBytes, bytes);
  }
  handleFileReadChunkResult(requestId, status, chunk, status == 1 ? null : readHostMessage(payloadPtr, payloadLen));
}

export function __fui_on_file_save_result(
  requestId: u32,
  status: u32,
  writtenBytes: u64,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  let result: FileSaveResult | null = null;
  if (status == 1) {
    const payload = readWriterPayload(payloadPtr, payloadLen);
    const mode = payload.length > 0 ? <FileSaveMode>I32.parseInt(unchecked(payload[0])) : FileSaveMode.Download;
    const fileName = payload.length > 1 ? unchecked(payload[1]) : "";
    result = new FileSaveResult(fileName, mode, writtenBytes);
  }
  handleFileSaveResult(requestId, status, result, status == 1 ? null : readHostMessage(payloadPtr, payloadLen));
}

export function __fui_on_file_writer_created(requestId: u32, status: u32, payloadPtr: usize, payloadLen: u32): void {
  let writer = null as BrowserFileWriter | null;
  if (status == 1) {
    const payload = readWriterPayload(payloadPtr, payloadLen);
    const mode = payload.length > 0 ? <FileSaveMode>I32.parseInt(unchecked(payload[0])) : FileSaveMode.NativePicker;
    const writerId = payload.length > 1 ? unchecked(payload[1]) : "";
    const fileName = payload.length > 2 ? unchecked(payload[2]) : "";
    writer = createBrowserFileWriter(writerId, fileName, mode);
  }
  handleFileWriterCreated(requestId, status, writer, status == 1 ? null : readHostMessage(payloadPtr, payloadLen));
}

export function __fui_on_file_write_result(
  requestId: u32,
  status: u32,
  writtenBytes: u64,
  totalWrittenBytes: u64,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  const progress = status == 1 ? new FileWriteProgress(writtenBytes, totalWrittenBytes) : null;
  handleFileWriterProgress(requestId, status, progress, status == 1 ? null : readHostMessage(payloadPtr, payloadLen));
}

export function __fui_on_file_finish_result(
  requestId: u32,
  status: u32,
  writtenBytes: u64,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  let result: FileSaveResult | null = null;
  if (status == 1) {
    const payload = readWriterPayload(payloadPtr, payloadLen);
    const mode = payload.length > 0 ? <FileSaveMode>I32.parseInt(unchecked(payload[0])) : FileSaveMode.NativePicker;
    const fileName = payload.length > 1 ? unchecked(payload[1]) : "";
    result = new FileSaveResult(fileName, mode, writtenBytes);
  }
  handleFileWriterFinished(requestId, status, result, status == 1 ? null : readHostMessage(payloadPtr, payloadLen));
}

export function __fui_on_file_worker_process_progress(
  requestId: u32,
  processedBytes: u64,
  totalBytes: u64,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  const outputFileName = readHostMessage(payloadPtr, payloadLen);
  handleFileWorkerProcessProgress(
    requestId,
    processedBytes,
    totalBytes,
    outputFileName,
  );
}

export function __fui_on_file_worker_process_chunk(
  requestId: u32,
  offsetBytes: u64,
  fileSizeBytes: u64,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  const bytes = new Uint8Array(payloadLen);
  if (payloadLen > 0) {
    memory.copy(bytes.dataStart, payloadPtr, <usize>payloadLen);
  }
  handleFileWorkerProcessChunk(requestId, new FileReadChunk(offsetBytes, fileSizeBytes, bytes));
}

export function __fui_on_file_worker_process_complete(
  requestId: u32,
  processedBytes: u64,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  const raw = readHostMessage(payloadPtr, payloadLen);
  let outputFileName: string | null = null;
  let workerResult: string | null = null;
  if (raw !== null) {
    const nullPos = raw.indexOf("\0");
    if (nullPos >= 0) {
      const before = raw.substring(0, nullPos);
      const after = raw.substring(nullPos + 1);
      outputFileName = before.length > 0 ? before : null;
      workerResult = after.length > 0 ? after : null;
    } else {
      outputFileName = raw.length > 0 ? raw : null;
    }
  }
  handleFileWorkerProcessComplete(
    requestId,
    processedBytes,
    outputFileName,
    workerResult,
  );
}

export function __fui_on_file_worker_process_error(requestId: u32, status: u32, payloadPtr: usize, payloadLen: u32): void {
  handleFileWorkerProcessError(requestId, status, readHostMessage(payloadPtr, payloadLen));
}

export function __fui_on_system_dark_mode_changed(isDark: bool): void {
  log("Event", "system dark mode changed=" + (isDark ? "true" : "false"));
  handleSystemDarkModeChanged(isDark);
}

export function __fui_on_system_accent_color_changed(color: u32): void {
  log("Event", "system accent color changed=" + color.toString());
  handleSystemAccentColorChanged(color);
}

export function __fui_on_route_changed(routePtr: usize, routeLen: u32): void {
  const route = String.UTF8.decodeUnsafe(routePtr, <usize>routeLen, false);
  log("Event", "route changed=" + route);
  handleRouteChanged(route);
}

export function __fui_on_focus_changed(handle: u64, focused: bool): void {
  log(
    "Event",
    "focus handle=" + describeHandle(handle) + " focused=" + (focused ? "true" : "false"),
  );
  if (focused) {
    focusedHandle = handle;
  } else if (focusedHandle == handle) {
    focusedHandle = 0;
  }
  EventRouter.dispatchFocusChanged(handle, focused);
}

export function __fui_on_key_event(eventType: u32, keyPtr: usize, keyLen: u32, modifiers: u32): bool {
  const key = String.UTF8.decodeUnsafe(keyPtr, <usize>keyLen, false);
  log(
    "Event",
    "key type=" + describeKeyEventType(<KeyEventType>eventType) +
      " key=" + key +
      " modifiers=" + modifiers.toString(),
  );
  if (EventRouter.dispatchGlobalKeyEvent(<KeyEventType>eventType, key, modifiers)) {
    return true;
  }
  if (focusedHandle == 0) {
    if (<KeyEventType>eventType == KeyEventType.Down) {
      return handleKeyboardScrollFallback(key, modifiers);
    }
    return false;
  }
  if (EventRouter.dispatchKeyEvent(focusedHandle, <KeyEventType>eventType, key, modifiers)) {
    return true;
  }
  if (<KeyEventType>eventType == KeyEventType.Down) {
    return handleKeyboardScrollFallback(key, modifiers);
  }
  return false;
}

export function __fui_on_context_menu(handle: u64, x: f32, y: f32): void {
  ContextMenuManager.showForCurrentSelection(handle, x, y);
}

export function __fui_can_show_context_menu(handle: u64): bool {
  return ContextMenuManager.canShowForHandle(handle);
}

export function __fui_hide_active_context_menu(): void {
  ContextMenuManager.hideActiveMenu();
}

export function __fui_on_scroll(
  handle: u64,
  offsetX: f32,
  offsetY: f32,
  contentWidth: f32,
  contentHeight: f32,
  viewportWidth: f32,
  viewportHeight: f32,
): void {
  log(
    "Event",
    "scroll handle=" + describeHandle(handle) +
      " offsetX=" + offsetX.toString() +
      " offsetY=" + offsetY.toString(),
  );
  EventRouter.dispatchScroll(handle, offsetX, offsetY, contentWidth, contentHeight, viewportWidth, viewportHeight);
}

export function __fui_on_text_changed(handle: u64, textPtr: usize, textLen: u32): void {
  const text = String.UTF8.decodeUnsafe(textPtr, <usize>textLen, false);
  log("Event", "text-changed handle=" + describeHandle(handle) + " text=" + text);
  EventRouter.dispatchTextChanged(handle, text);
}

export function __fui_on_text_replaced(handle: u64, start: u32, end: u32, textPtr: usize, textLen: u32): void {
  const text = String.UTF8.decodeUnsafe(textPtr, <usize>textLen, false);
  log(
    "Event",
    "text-replaced handle=" + describeHandle(handle) +
      " start=" + start.toString() +
      " end=" + end.toString() +
      " text=" + text,
  );
  EventRouter.dispatchTextReplaced(handle, start, end, text);
}

export function __fui_on_selection_changed(handle: u64, start: u32, end: u32): void {
  log(
    "Event",
    "selection-changed handle=" + describeHandle(handle) +
      " start=" + start.toString() +
      " end=" + end.toString(),
  );
  EventRouter.dispatchSelectionChanged(handle, start, end);
}

export function __fui_on_cross_selection_changed(handle: u64, textPtr: usize, textLen: u32): void {
  const text = String.UTF8.decodeUnsafe(textPtr, <usize>textLen, false);
  log("Event", "cross-selection handle=" + describeHandle(handle) + " text=" + text);
  ContextMenuManager.handleSelectionChanged(text);
  EventRouter.dispatchCrossSelectionChanged(handle, text);
}

function readExternalDropItems(payloadPtr: usize, payloadLen: u32): Array<ExternalDropItemInfo> {
  const items = new Array<ExternalDropItemInfo>();
  if (payloadPtr == 0 || payloadLen == 0) {
    return items;
  }
  const end = payloadPtr + <usize>payloadLen;
  if (end < payloadPtr || payloadLen < 4) {
    warn("ExternalDrop", "Malformed external drop payload header.");
    return items;
  }
  let cursor = payloadPtr;
  const itemCount = load<u32>(cursor);
  cursor += sizeof<u32>();
  for (let index: u32 = 0; index < itemCount; index += 1) {
    if (cursor + sizeof<u32>() + sizeof<f64>() > end) {
      warn("ExternalDrop", "Truncated external drop item header at index " + index.toString() + ".");
      return items;
    }
    const kind = <ExternalDropItemKind>load<u32>(cursor);
    cursor += sizeof<u32>();
    const sizeBytes = load<f64>(cursor);
    cursor += sizeof<f64>();

    if (cursor + sizeof<u32>() > end) {
      warn("ExternalDrop", "Truncated external drop item id length at index " + index.toString() + ".");
      return items;
    }
    const idLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>idLen > end) {
      warn("ExternalDrop", "Truncated external drop item id at index " + index.toString() + ".");
      return items;
    }
    const id = idLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>idLen, false) : "";
    cursor += <usize>idLen;

    if (cursor + sizeof<u32>() > end) {
      warn("ExternalDrop", "Truncated external drop item name length at index " + index.toString() + ".");
      return items;
    }
    const nameLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>nameLen > end) {
      warn("ExternalDrop", "Truncated external drop item name at index " + index.toString() + ".");
      return items;
    }
    const name = nameLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>nameLen, false) : "";
    cursor += <usize>nameLen;

    if (cursor + sizeof<u32>() > end) {
      warn("ExternalDrop", "Truncated external drop item mime length at index " + index.toString() + ".");
      return items;
    }
    const mimeLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>mimeLen > end) {
      warn("ExternalDrop", "Truncated external drop item mime at index " + index.toString() + ".");
      return items;
    }
    const mimeType = mimeLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>mimeLen, false) : null;
    cursor += <usize>mimeLen;

    const file = kind == ExternalDropItemKind.File && id.length > 0
      ? registerBrowserFile(id, name, mimeType, <u64>sizeBytes, 0)
      : null;
    items.push(new ExternalDropItemInfo(id, kind, name, mimeType, sizeBytes, file));
  }
  return items;
}

export function __fui_on_external_drag_event(
  eventType: u32,
  handle: u64,
  x: f32,
  y: f32,
  modifiers: u32,
  payloadPtr: usize,
  payloadLen: u32,
): u32 {
  const items = readExternalDropItems(payloadPtr, payloadLen);
  const effect = EventRouter.dispatchExternalDropEvent(
    handle,
    <ExternalDragEventType>eventType,
    x,
    y,
    modifiers,
    items,
  );
  if (payloadPtr != 0 && payloadLen > 0 && items.length == 0) {
    error("ExternalDrop", "Dropped malformed external payload for handle " + describeHandle(handle) + ".");
  }
  log(
    "Event",
    "external-drag type=" + eventType.toString() +
      " handle=" + describeHandle(handle) +
      " items=" + items.length.toString() +
      " effect=" + (<u32>effect).toString(),
  );
  return <u32>effect;
}

import { FontFace } from "./Typography";

export function __fui_on_font_loaded(fontId: u32): void {
  FontFace._dispatchFontLoaded(fontId);
}
