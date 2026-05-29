import {
  fui_copy_persisted_state,
  fui_set_persisted_scroll_offset,
  fui_set_persisted_state,
  fui_try_get_persisted_scroll_offset,
} from "./ffi";
import { __fui_text_buffer, __fui_text_buffer_size } from "./event_exports";
import { ScrollState } from "../nodes/ScrollState";

export class PersistedScrollOffset {
  constructor(
    readonly x: f32,
    readonly y: f32,
  ) {}
}

export class PersistedTextState {
  constructor(
    readonly version: u32,
    readonly payload: string,
  ) {}
}

const persistedScrollRestoreBuffer = new Float32Array(2);
const persistedTextStateVersionBuffer = new Uint32Array(1);

function encodeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

function axisRestoreReady(desiredOffset: f32, contentSize: f32, viewportSize: f32, enabled: bool): bool {
  if (!enabled || desiredOffset == 0.0) {
    return true;
  }
  return viewportSize > 0.0 && contentSize > viewportSize;
}

function clampAxisOffset(offset: f32, contentSize: f32, viewportSize: f32, enabled: bool): f32 {
  if (!enabled) {
    return 0.0;
  }
  const maxOffset = contentSize > viewportSize ? contentSize - viewportSize : 0.0;
  if (offset < 0.0) {
    return 0.0;
  }
  if (offset > maxOffset) {
    return maxOffset;
  }
  return offset;
}

export function storePersistedScrollOffset(nodeId: string, x: f32, y: f32): void {
  const bytes = encodeUtf8(nodeId);
  fui_set_persisted_scroll_offset(bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length, x, y);
}

export function storePersistedTextState(nodeId: string, kind: string, version: u32, payload: string): void {
  const nodeIdBytes = encodeUtf8(nodeId);
  const kindBytes = encodeUtf8(kind);
  const payloadBytes = encodeUtf8(payload);
  fui_set_persisted_state(
    nodeIdBytes.length > 0 ? nodeIdBytes.dataStart : 0,
    <u32>nodeIdBytes.length,
    kindBytes.length > 0 ? kindBytes.dataStart : 0,
    <u32>kindBytes.length,
    version,
    payloadBytes.length > 0 ? payloadBytes.dataStart : 0,
    <u32>payloadBytes.length,
  );
}

export function tryLoadPersistedScrollOffset(nodeId: string): PersistedScrollOffset | null {
  const bytes = encodeUtf8(nodeId);
  const basePtr = persistedScrollRestoreBuffer.dataStart;
  if (!fui_try_get_persisted_scroll_offset(
    bytes.length > 0 ? bytes.dataStart : 0,
    <u32>bytes.length,
    basePtr,
    basePtr + sizeof<f32>(),
  )) {
    return null;
  }
  return new PersistedScrollOffset(
    persistedScrollRestoreBuffer[0],
    persistedScrollRestoreBuffer[1],
  );
}

export function tryLoadPersistedTextState(nodeId: string, kind: string): PersistedTextState | null {
  const nodeIdBytes = encodeUtf8(nodeId);
  const kindBytes = encodeUtf8(kind);
  const versionPtr = persistedTextStateVersionBuffer.dataStart;
  const payloadPtr = __fui_text_buffer();
  const payloadCapacity = __fui_text_buffer_size();
  const copied = fui_copy_persisted_state(
    nodeIdBytes.length > 0 ? nodeIdBytes.dataStart : 0,
    <u32>nodeIdBytes.length,
    kindBytes.length > 0 ? kindBytes.dataStart : 0,
    <u32>kindBytes.length,
    versionPtr,
    payloadPtr,
    payloadCapacity,
  );
  if (copied < 0) {
    return null;
  }
  if (<u32>copied > payloadCapacity) {
    throw new Error(
      "Persisted state payload for " +
      kind +
      " on " +
      nodeId +
      " exceeded the shared text buffer capacity.",
    );
  }
  return new PersistedTextState(
    persistedTextStateVersionBuffer[0],
    copied == 0 ? "" : String.UTF8.decodeUnsafe(payloadPtr, <usize>copied, false),
  );
}

export function canRestorePersistedScrollOffset(
  state: ScrollState,
  offset: PersistedScrollOffset,
  enableX: bool,
  enableY: bool,
): bool {
  return axisRestoreReady(offset.x, state.contentWidth.value, state.viewportWidth.value, enableX) &&
    axisRestoreReady(offset.y, state.contentHeight.value, state.viewportHeight.value, enableY);
}

export function clampPersistedScrollOffset(
  state: ScrollState,
  offset: PersistedScrollOffset,
  enableX: bool,
  enableY: bool,
): PersistedScrollOffset {
  return new PersistedScrollOffset(
    clampAxisOffset(offset.x, state.contentWidth.value, state.viewportWidth.value, enableX),
    clampAxisOffset(offset.y, state.contentHeight.value, state.viewportHeight.value, enableY),
  );
}
