import type { BridgeRuntime, EffinDomRuntimeConfig, WasmHandleLike } from '@effindomv2/runtime';

import type { HostEventsDefinition } from '../host-events';
import type { HostServicesDefinition } from '../host-services';
import type { WorkerHostServicesBundleConfig } from '../worker-types';

export interface HarnessState {
  readonly commandWordCount: number;
  readonly commandWords: readonly number[];
  readonly rootHandle: string | null;
}

export interface HarnessExports {
  readonly memory: WebAssembly.Memory;
  __flushRenders(): void;
  __fui_capture_persisted_ui_state?(): void;
  __fui_debug_pointer_event?(eventType: number, handle: bigint, x: number, y: number, modifiers: number): void;
  __fui_debug_focus_changed?(handle: bigint, focused: boolean): void;
  __fui_debug_key_event?(eventType: number, keyPtr: number, keyLen: number, modifiers: number): void;
  __fui_debug_scroll?(
    handle: bigint,
    offsetX: number,
    offsetY: number,
    contentWidth: number,
    contentHeight: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void;
  __fui_on_pointer_event(eventType: number, handle: bigint, x: number, y: number, modifiers: number): void;
  __fui_on_external_drag_event(
    eventType: number,
    handle: bigint,
    x: number,
    y: number,
    modifiers: number,
    payloadPtr: number,
    payloadLen: number,
  ): number;
  __fui_on_fetch_complete(
    requestId: number,
    ok: boolean,
    status: number,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_fetch_error(requestId: number, payloadPtr: number, payloadLen: number): void;
  __fui_on_file_pick_result(requestId: number, status: number, payloadPtr: number, payloadLen: number): void;
  __fui_on_file_read_result(
    requestId: number,
    status: number,
    offsetBytes: bigint,
    fileSizeBytes: bigint,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_file_save_result(
    requestId: number,
    status: number,
    writtenBytes: bigint,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_file_writer_created(requestId: number, status: number, payloadPtr: number, payloadLen: number): void;
  __fui_on_file_write_result(
    requestId: number,
    status: number,
    writtenBytes: bigint,
    totalWrittenBytes: bigint,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_file_finish_result(
    requestId: number,
    status: number,
    writtenBytes: bigint,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_file_worker_process_progress(
    requestId: number,
    copiedBytes: bigint,
    totalBytes: bigint,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_file_worker_process_chunk(
    requestId: number,
    offsetBytes: bigint,
    fileSizeBytes: bigint,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_file_worker_process_complete(
    requestId: number,
    writtenBytes: bigint,
    payloadPtr: number,
    payloadLen: number,
  ): void;
  __fui_on_file_worker_process_error(requestId: number, status: number, payloadPtr: number, payloadLen: number): void;
  __fui_on_context_menu(handle: bigint, x: number, y: number): void;
  __fui_hide_active_context_menu(): void;
  __fui_key_buffer(): number;
  __fui_text_buffer(): number;
  __fui_text_buffer_size(): number;
  __fui_on_focus_changed(handle: bigint, focused: boolean): void;
  __fui_on_text_changed(handle: bigint, textPtr: number, textLen: number): void;
  __fui_on_text_replaced(handle: bigint, start: number, end: number, textPtr: number, textLen: number): void;
  __fui_on_selection_changed(handle: bigint, start: number, end: number): void;
  __fui_on_key_event(eventType: number, keyPtr: number, keyLen: number, modifiers: number): number;
  __fui_on_scroll(
    handle: bigint,
    offsetX: number,
    offsetY: number,
    contentWidth: number,
    contentHeight: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void;
  __fui_on_cross_selection_changed(handle: bigint, textPtr: number, textLen: number): void;
  __fui_on_route_changed(routePtr: number, routeLen: number): void;
  __fui_on_viewport_changed(width: number, height: number): void;
  __fui_on_system_dark_mode_changed(isDark: boolean): void;
  __fui_on_svg_loaded(svgId: number, width: number, height: number): void;
  __fui_on_svg_failed(svgId: number, errorPtr: number, errorLen: number): void;
  __fui_on_texture_loaded(textureId: number, width: number, height: number): void;
  __fui_on_texture_failed(textureId: number, errorPtr: number, errorLen: number): void;
  __fui_on_frame(timestampMs: number): void;
  __fui_on_timer(timerId: number): void;
  __fui_on_worker_progress(workerId: number, textPtr: number, textLen: number): void;
  __fui_on_worker_complete(workerId: number, textPtr: number, textLen: number): void;
  __fui_on_worker_error(workerId: number, textPtr: number, textLen: number): void;
  __fui_restore_persisted_ui_state?(): void;
  fui_dispatch_custom_draw?(handle: bigint, canvasPtr: number): void;
}

export interface HarnessContext<Exports extends HarnessExports> {
  readonly runtime: BridgeRuntime;
  readonly exports: Exports;
  waitForFrame(): Promise<void>;
}

export interface HarnessOptions<Exports extends HarnessExports> {
  wasmPath: string;
  run?(exports: Exports): void;
  onStateUpdated?(state: HarnessState): void;
  onReady?(context: HarnessContext<Exports>): void | Promise<void>;
  onDispose?(exports: Exports): void;
  onError?(error: unknown): void;
  showLoadingOverlay?: boolean;
  hostEvents?: HostEventsDefinition;
  hostServices?: HostServicesDefinition;
  workerHostServices?: WorkerHostServicesBundleConfig;
  persistedRestoreMode?: 'initial' | 'pop' | 'none';
}

export interface HarnessAppOptions<Exports extends HarnessExports> extends HarnessOptions<Exports> {
  run(exports: Exports): void;
}

export type HarnessNavigationMode = 'push' | 'replace' | 'pop';

export interface HarnessController {
  readonly runtime: BridgeRuntime;
  waitForFrame(): Promise<void>;
  loadApp<Exports extends HarnessExports>(options: HarnessAppOptions<Exports>): Promise<HarnessContext<Exports>>;
  unloadApp(): Promise<void>;
  recreateRuntime(): Promise<BridgeRuntime>;
  setSameOriginNavigationHandler(
    handler: ((target: URL, mode: HarnessNavigationMode) => void | Promise<void>) | null,
  ): void;
}

export interface ManagedHarnessOptions {
  onReady?(controller: HarnessController): void | Promise<void>;
  onError?(error: unknown): void;
}

export interface ManagedHistoryState {
  readonly href: string;
  readonly uiSnapshotId?: string;
}

export interface HarnessDebugApi {
  flush(): Promise<void>;
  pointerEvent(type: number, handle: WasmHandleLike, x: number, y: number, modifiers?: number): Promise<void>;
  focusChanged(handle: WasmHandleLike, focused: boolean): Promise<void>;
  keyEvent(type: number, key: string, modifiers?: number): Promise<void>;
  navigateTo(target: string): Promise<void>;
  scroll(
    handle: WasmHandleLike,
    offsetX: number,
    offsetY: number,
    contentWidth: number,
    contentHeight: number,
    viewportWidth: number,
    viewportHeight: number,
  ): Promise<void>;
}

declare global {
  interface Window {
    __effindomRuntime?: EffinDomRuntimeConfig;
    __fui_debug?: HarnessDebugApi;
    __fuiUrlPreviewText?: string;
  }
}
