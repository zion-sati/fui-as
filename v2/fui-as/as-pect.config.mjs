const decoder = new TextDecoder();
const utf16Decoder = new TextDecoder('utf-16le');
const encoder = new TextEncoder();

const CallOp = Object.freeze({
  CreateNode: 1,
  DeleteNode: 2,
  SetWidth: 3,
  SetHeight: 4,
  SetFillWidth: 101,
  SetFillHeight: 102,
  SetFillWidthPercent: 104,
  SetFillHeightPercent: 105,
  SetMinWidth: 106,
  SetMaxWidth: 107,
  SetMinHeight: 108,
  SetMaxHeight: 109,
  SetBackgroundColor: 5,
  SetText: 6,
  SetTextStyleRuns: 84,
  SetFont: 7,
  SetLineHeight: 81,
  RegisterFontFallback: 60,
  SetTextColor: 8,
  AddChild: 9,
  SetFlexDirection: 10,
  SetJustifyContent: 11,
  SetAlignItems: 12,
  SetAlignSelf: 103,
  SetPadding: 13,
  SetMargin: 88,
  SetClipToBounds: 14,
  SetVisibility: 83,
  SetTextAlign: 15,
  SetTextVerticalAlign: 61,
  SetTextLimits: 16,
  SetTextWrapping: 74,
  SetTextOverflow: 17,
  SetTextOverflowFade: 89,
  ClearMomentumScroll: 90,
  SetScrollContentSize: 91,
  RequestSemanticAnnouncement: 92,
  SetTextObscured: 18,
  SetScrollOffset: 19,
  GridSetColumns: 20,
  GridSetRows: 21,
  GridSetColumnSharedSizeGroup: 78,
  GridSetRowSharedSizeGroup: 79,
  SetGridPlacement: 22,
  SetSemanticRole: 23,
  SetSemanticLabel: 24,
  SetSemanticChecked: 53,
  SetSemanticSelected: 54,
  SetSemanticExpanded: 55,
  SetSemanticDisabled: 56,
  SetSemanticValueRange: 57,
  SetSemanticOrientation: 58,
  SetNodeId: 25,
  SetPortal: 26,
  SetIsSharedSizeScope: 77,
  SetFlexBasis: 80,
  SetInteractive: 28,
  SetScrollEnabled: 62,
  SetShowScrollbars: 63,
  SetScrollFriction: 64,
  SetFocusable: 29,
  RequestFocus: 59,
  SetBoxStyle: 30,
  SetLayerEffect: 31,
  SetLinearGradient: 32,
  SetImage: 65,
  SetImageNine: 66,
  SetSvg: 67,
  SetBackgroundBlur: 44,
  SetDropShadow: 45,
  PushSemanticScope: 46,
  RemoveSemanticScope: 47,
  SetSelectable: 33,
  SetSelectionArea: 34,
  SetSelectionAreaBarrier: 38,
  ClearSelection: 39,
  RetargetSelection: 40,
  SetTextSelectionRange: 75,
  RemoveChild: 41,
  SetPositionType: 42,
  SetPosition: 43,
  CommitFrame: 35,
  RequestRender: 36,
  SetCursor: 37,
  ShowUrlPreview: 48,
  HideUrlPreview: 49,
  NavigateTo: 50,
  NavigateBack: 51,
  NavigateForward: 52,
  LoadSvg: 68,
  LoadTexture: 69,
  LoadFont: 82,
  SetEditable: 70,
  SetCaretColor: 71,
  StartTimer: 72,
  CancelTimer: 73,
  Log: 76,
  WorkerStartString: 85,
  WorkerCancel: 86,
  WorkerYield: 87,
  FileWorkerProcessStart: 93,
  FileWorkerProcessCancel: 94,
  FetchStart: 95,
  FetchCancel: 96,
  BitmapCommit: 97,
  BitmapRelease: 98,
  ReleaseSvg: 99,
  ReleaseTexture: 100,
  SetCustomDrawable: 110,
  SetFlexWrap: 111,
});

let calls = [];
let nextHandle = 1n;
let lastText = '';
let lastUrlPreviewText = '';
let lastNavigationTarget = '';
let lastSvgUrl = '';
let lastTextureUrl = '';
let lastFontUrl = '';
let lastLogCategory = '';
let lastLogMessage = '';
let lastWorkerEntry = '';
let lastWorkerInput = '';
let lastWorkerProgress = '';
let lastWorkerComplete = '';
let lastWorkerFailure = '';
let lastFetchMethod = '';
let lastFetchUrl = '';
let lastHostServiceCall = '';
let lastBitmapBytes = new Uint8Array(0);
let workerYieldCount = 0;
let workerCancelled = false;
let coarsePointer = false;
let currentTimerNowMs = 0;
let logsEnabled = false;
let pendingGradients = new Map();
let persistedScrollEntries = new Map();
let persistedTextEntries = new Map();
let nodeBoundsByHandle = new Map();
let activeMemory = null;

function resetRecorder() {
  calls = [];
  nextHandle = 1n;
  lastText = '';
  lastUrlPreviewText = '';
  lastNavigationTarget = '';
  lastSvgUrl = '';
  lastTextureUrl = '';
  lastFontUrl = '';
  lastLogCategory = '';
  lastLogMessage = '';
  lastWorkerEntry = '';
  lastWorkerInput = '';
  lastWorkerProgress = '';
  lastWorkerComplete = '';
  lastWorkerFailure = '';
  lastFetchMethod = '';
  lastFetchUrl = '';
  lastHostServiceCall = '';
  lastBitmapBytes = new Uint8Array(0);
  workerYieldCount = 0;
  workerCancelled = false;
  currentTimerNowMs = 0;
  logsEnabled = false;
  pendingGradients = new Map();
  persistedScrollEntries = new Map();
  persistedTextEntries = new Map();
  nodeBoundsByHandle = new Map();
}

function readUtf8(memory, ptr, len) {
  const sourceMemory = activeMemory ?? memory;
  if (len === 0) {
    return '';
  }
  const offset = toNumber(ptr);
  if (!Number.isFinite(offset) || offset < 0 || offset >= sourceMemory.buffer.byteLength) {
    return '';
  }
  const clampedLength = Math.max(0, Math.min(len, sourceMemory.buffer.byteLength - offset));
  if (clampedLength === 0) {
    return '';
  }
  return decoder.decode(new Uint8Array(sourceMemory.buffer, offset, clampedLength));
}

function readBytes(memory, ptr, len) {
  const sourceMemory = activeMemory ?? memory;
  if (len === 0) {
    return new Uint8Array(0);
  }
  const offset = toNumber(ptr);
  if (!Number.isFinite(offset) || offset < 0 || offset >= sourceMemory.buffer.byteLength) {
    return new Uint8Array(0);
  }
  const clampedLength = Math.max(0, Math.min(len, sourceMemory.buffer.byteLength - offset));
  if (clampedLength === 0) {
    return new Uint8Array(0);
  }
  return new Uint8Array(sourceMemory.buffer.slice(offset, offset + clampedLength));
}

function bytesEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function getActiveMemory(memory) {
  return activeMemory ?? memory;
}

function readFloat(memory, ptr) {
  const sourceMemory = activeMemory ?? memory;
  if (!ptr) {
    return 0;
  }
  return new DataView(sourceMemory.buffer).getFloat32(ptr, true);
}

function readByte(memory, ptr) {
  const sourceMemory = activeMemory ?? memory;
  if (!ptr) {
    return 0;
  }
  return new Uint8Array(sourceMemory.buffer, ptr, 1)[0];
}

function readUint32(memory, ptr) {
  const sourceMemory = activeMemory ?? memory;
  if (!ptr) {
    return 0;
  }
  return new DataView(sourceMemory.buffer).getUint32(ptr, true);
}

function toNumber(value) {
  return typeof value === "bigint" ? Number(value) : value;
}

function record(op, ...args) {
  calls.push({ op, args });
}

export default {
  entries: ["tests/unit/**/*.spec.ts"],
  include: ["./node_modules/@as-pect/assembly/assembly/index.ts"],
  disclude: [/node_modules/, /build\//],
  async instantiate(memory, createImports, instantiate, binary) {
    activeMemory = null;
    resetRecorder();
    return instantiate(binary, createImports({
      env: { memory },
      effindom_v2_ui: {
        ui_reset() {},
        ui_create_node(type) {
          const handle = nextHandle;
          nextHandle += 1n;
          record(CallOp.CreateNode, type, Number(handle));
          return handle;
        },
        ui_delete_node(handle) {
          record(CallOp.DeleteNode, toNumber(handle));
        },
        ui_set_node_id(handle, ptr, len) {
          record(CallOp.SetNodeId, toNumber(handle), len, readUtf8(memory, ptr, len).length);
        },
        ui_set_semantic_role(handle, role) {
          record(CallOp.SetSemanticRole, toNumber(handle), role);
        },
        ui_set_semantic_label(handle, ptr, len) {
          record(CallOp.SetSemanticLabel, toNumber(handle), len, readUtf8(memory, ptr, len).length);
        },
        ui_set_semantic_checked(handle, checkedState) {
          record(CallOp.SetSemanticChecked, toNumber(handle), checkedState);
        },
        ui_set_semantic_selected(handle, hasSelected, selected) {
          record(CallOp.SetSemanticSelected, toNumber(handle), hasSelected ? 1 : 0, selected ? 1 : 0);
        },
        ui_set_semantic_expanded(handle, hasExpanded, expanded) {
          record(CallOp.SetSemanticExpanded, toNumber(handle), hasExpanded ? 1 : 0, expanded ? 1 : 0);
        },
        ui_set_semantic_disabled(handle, hasDisabled, disabled) {
          record(CallOp.SetSemanticDisabled, toNumber(handle), hasDisabled ? 1 : 0, disabled ? 1 : 0);
        },
        ui_set_semantic_value_range(handle, hasValueRange, valueNow, valueMin, valueMax) {
          record(CallOp.SetSemanticValueRange, toNumber(handle), hasValueRange ? 1 : 0, valueNow, valueMin, valueMax);
        },
        ui_set_semantic_orientation(handle, orientation) {
          record(CallOp.SetSemanticOrientation, toNumber(handle), orientation);
        },
        ui_request_semantic_announcement(handle) {
          record(CallOp.RequestSemanticAnnouncement, toNumber(handle));
        },
        ui_push_semantic_scope(handle) {
          record(CallOp.PushSemanticScope, toNumber(handle));
          return calls.length;
        },
        ui_remove_semantic_scope(token) {
          record(CallOp.RemoveSemanticScope, token);
        },
        ui_node_add_child(parent, child) {
          record(CallOp.AddChild, toNumber(parent), toNumber(child));
        },
        ui_node_remove_child(parent, child) {
          record(CallOp.RemoveChild, toNumber(parent), toNumber(child));
        },
        ui_set_is_portal(handle, flag) {
          record(CallOp.SetPortal, toNumber(handle), flag ? 1 : 0);
        },
        ui_set_is_shared_size_scope(handle, flag) {
          record(CallOp.SetIsSharedSizeScope, toNumber(handle), flag ? 1 : 0);
        },
        ui_set_custom_drawable(handle, flag) {
          record(CallOp.SetCustomDrawable, toNumber(handle), flag ? 1 : 0);
        },
        ui_set_flex_wrap(handle, wrap) {
          record(CallOp.SetFlexWrap, toNumber(handle), wrap);
        },
        ui_set_root() {},
        ui_set_width(handle, value, unit) {
          record(CallOp.SetWidth, toNumber(handle), value, unit);
        },
        ui_set_height(handle, value, unit) {
          record(CallOp.SetHeight, toNumber(handle), value, unit);
        },
        ui_set_fill_width(handle, fill) {
          record(CallOp.SetFillWidth, toNumber(handle), fill ? 1 : 0);
        },
        ui_set_fill_height(handle, fill) {
          record(CallOp.SetFillHeight, toNumber(handle), fill ? 1 : 0);
        },
        ui_set_fill_width_percent(handle, percent) {
          record(CallOp.SetFillWidthPercent, toNumber(handle), percent);
        },
        ui_set_fill_height_percent(handle, percent) {
          record(CallOp.SetFillHeightPercent, toNumber(handle), percent);
        },
        ui_set_min_width(handle, value, unit) {
          record(CallOp.SetMinWidth, toNumber(handle), value, unit);
        },
        ui_set_max_width(handle, value, unit) {
          record(CallOp.SetMaxWidth, toNumber(handle), value, unit);
        },
        ui_set_min_height(handle, value, unit) {
          record(CallOp.SetMinHeight, toNumber(handle), value, unit);
        },
        ui_set_max_height(handle, value, unit) {
          record(CallOp.SetMaxHeight, toNumber(handle), value, unit);
        },
        ui_set_flex_direction(handle, direction) {
          record(CallOp.SetFlexDirection, toNumber(handle), direction);
        },
        ui_set_flex_basis(handle, basis) {
          record(CallOp.SetFlexBasis, toNumber(handle), basis);
        },
        ui_set_justify_content(handle, justify) {
          record(CallOp.SetJustifyContent, toNumber(handle), justify);
        },
        ui_set_align_items(handle, align) {
          record(CallOp.SetAlignItems, toNumber(handle), align);
        },
        ui_set_align_self(handle, align) {
          record(CallOp.SetAlignSelf, toNumber(handle), align);
        },
        ui_set_padding(handle, top, right, bottom, left) {
          record(CallOp.SetPadding, toNumber(handle), top, right, bottom, left);
        },
        ui_set_margin(handle, top, right, bottom, left) {
          record(CallOp.SetMargin, toNumber(handle), top, right, bottom, left);
        },
        ui_set_position_type(handle, positionType) {
          record(CallOp.SetPositionType, toNumber(handle), positionType);
        },
        ui_set_position(handle, top, right, bottom, left) {
          record(CallOp.SetPosition, toNumber(handle), top, right, bottom, left);
        },
        ui_grid_set_columns(handle, count, valuesPtr, typesPtr) {
          record(CallOp.GridSetColumns, toNumber(handle), count, valuesPtr ? 1 : 0, typesPtr ? 1 : 0);
        },
        ui_grid_set_rows(handle, count, valuesPtr, typesPtr) {
          record(CallOp.GridSetRows, toNumber(handle), count, valuesPtr ? 1 : 0, typesPtr ? 1 : 0);
        },
        ui_grid_set_column_shared_size_group(handle, index, ptr, len) {
          record(CallOp.GridSetColumnSharedSizeGroup, toNumber(handle), index, len, readUtf8(memory, ptr, len).length);
        },
        ui_grid_set_row_shared_size_group(handle, index, ptr, len) {
          record(CallOp.GridSetRowSharedSizeGroup, toNumber(handle), index, len, readUtf8(memory, ptr, len).length);
        },
        ui_node_set_grid_placement(handle, row, col, rowSpan, colSpan) {
          record(CallOp.SetGridPlacement, toNumber(handle), row, col, rowSpan, colSpan);
        },
        ui_set_bg_color(handle, color) {
          record(CallOp.SetBackgroundColor, toNumber(handle), color >>> 0);
        },
        ui_set_box_style(handle, bgColor, topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius, borderWidth, borderColor, borderStyle, borderDashOn, borderDashOff) {
          record(
            CallOp.SetBoxStyle,
            toNumber(handle),
            bgColor >>> 0,
            topLeftRadius,
            topRightRadius,
            bottomRightRadius,
            bottomLeftRadius,
            borderWidth,
            borderColor >>> 0,
            borderStyle,
            borderDashOn,
            borderDashOff,
          );
        },
        ui_set_layer_effect(handle, opacity, blurSigma, blendMode) {
          record(CallOp.SetLayerEffect, toNumber(handle), opacity, blurSigma, blendMode);
        },
        ui_set_drop_shadow(handle, color, offsetX, offsetY, blurSigma, spread) {
          record(CallOp.SetDropShadow, toNumber(handle), color >>> 0, offsetX, offsetY, blurSigma, spread);
        },
        ui_set_background_blur(handle, blurSigma) {
          record(CallOp.SetBackgroundBlur, toNumber(handle), blurSigma);
        },
        ui_set_image(handle, textureId, objectFit) {
          record(CallOp.SetImage, toNumber(handle), textureId, objectFit);
        },
        ui_set_image_nine(handle, textureId, insetLeft, insetTop, insetRight, insetBottom) {
          record(CallOp.SetImageNine, toNumber(handle), textureId, insetLeft, insetTop, insetRight, insetBottom);
        },
        ui_set_svg(handle, svgId, tintColor) {
          record(CallOp.SetSvg, toNumber(handle), svgId, tintColor >>> 0);
        },
        ui_set_linear_gradient(handle, startX, startY, endX, endY, stopCount) {
          pendingGradients.set(String(toNumber(handle)), {
            handle: toNumber(handle),
            startX,
            startY,
            endX,
            endY,
            stopCount,
            offsets: [],
            colors: [],
          });
        },
        ui_push_linear_gradient_stop(handle, offset, color) {
          const key = String(toNumber(handle));
          const pending = pendingGradients.get(key);
          if (!pending) {
            throw new Error("Gradient stop received before gradient header.");
          }
          pending.offsets.push(offset);
          pending.colors.push(color >>> 0);
          if (pending.offsets.length !== pending.stopCount) {
            return;
          }
          pendingGradients.delete(key);
          record(
            CallOp.SetLinearGradient,
            pending.handle,
            pending.startX,
            pending.startY,
            pending.endX,
            pending.endY,
            pending.stopCount,
            pending.stopCount > 0 ? pending.offsets[0] : 0,
            pending.stopCount > 0 ? pending.colors[0] : 0,
            pending.stopCount > 1 ? pending.offsets[1] : 0,
            pending.stopCount > 1 ? pending.colors[1] : 0,
          );
        },
        ui_set_clip_to_bounds(handle, clip) {
          record(CallOp.SetClipToBounds, toNumber(handle), clip ? 1 : 0);
        },
        ui_set_visibility(handle, visibility) {
          record(CallOp.SetVisibility, toNumber(handle), visibility);
        },
        ui_set_interactive(handle, interactive) {
          record(CallOp.SetInteractive, toNumber(handle), interactive ? 1 : 0);
        },
        ui_set_scroll_proxy_target() {},
        ui_set_scroll_enabled(handle, enabledX, enabledY) {
          record(CallOp.SetScrollEnabled, toNumber(handle), enabledX ? 1 : 0, enabledY ? 1 : 0);
        },
        ui_set_show_scrollbars(handle, showScrollbars) {
          record(CallOp.SetShowScrollbars, toNumber(handle), showScrollbars ? 1 : 0);
        },
        ui_set_scroll_friction(handle, friction) {
          record(CallOp.SetScrollFriction, toNumber(handle), friction);
        },
        ui_set_scroll_content_size(handle, contentWidth, contentHeight) {
          record(CallOp.SetScrollContentSize, toNumber(handle), contentWidth, contentHeight);
        },
        ui_set_focusable(handle, focusable, tabIndex) {
          record(CallOp.SetFocusable, toNumber(handle), focusable ? 1 : 0, tabIndex);
        },
        ui_request_focus(handle) {
          record(CallOp.RequestFocus, toNumber(handle));
        },
        ui_set_text(handle, ptr, len) {
          lastText = readUtf8(memory, ptr, len);
          record(CallOp.SetText, toNumber(handle), len);
        },
        ui_set_text_style_runs(handle, runCount, runsWordsPtr) {
          record(CallOp.SetTextStyleRuns, toNumber(handle), runCount, toNumber(runsWordsPtr));
        },
        ui_set_font(handle, fontId, size) {
          record(CallOp.SetFont, toNumber(handle), fontId, size);
        },
        ui_set_line_height(handle, lineHeight) {
          record(CallOp.SetLineHeight, toNumber(handle), lineHeight);
        },
        ui_register_font_fallback(fontId, fallbackFontId) {
          record(CallOp.RegisterFontFallback, fontId, fallbackFontId);
        },
        ui_set_text_color(handle, color) {
          record(CallOp.SetTextColor, toNumber(handle), color >>> 0);
        },
        ui_set_text_align(handle, align) {
          record(CallOp.SetTextAlign, toNumber(handle), align);
        },
        ui_set_text_vertical_align(handle, align) {
          record(CallOp.SetTextVerticalAlign, toNumber(handle), align);
        },
        ui_set_text_limits(handle, maxChars, maxLines) {
          record(CallOp.SetTextLimits, toNumber(handle), maxChars, maxLines);
        },
        ui_set_text_wrapping(handle, wrap) {
          record(CallOp.SetTextWrapping, toNumber(handle), wrap ? 1 : 0);
        },
        ui_set_text_overflow(handle, overflow) {
          record(CallOp.SetTextOverflow, toNumber(handle), overflow);
        },
        ui_set_text_overflow_fade(handle, horizontal, vertical) {
          record(CallOp.SetTextOverflowFade, toNumber(handle), horizontal ? 1 : 0, vertical ? 1 : 0);
        },
        ui_set_text_obscured(handle, obscured) {
          record(CallOp.SetTextObscured, toNumber(handle), obscured ? 1 : 0);
        },
        ui_set_editable(handle, editable) {
          record(CallOp.SetEditable, toNumber(handle), editable ? 1 : 0);
        },
        ui_set_caret_color(handle, color) {
          record(CallOp.SetCaretColor, toNumber(handle), color >>> 0);
        },
        ui_set_selectable(handle, selectable, selectionColor) {
          record(CallOp.SetSelectable, toNumber(handle), selectable ? 1 : 0, selectionColor >>> 0);
        },
        ui_set_selection_area(handle, isArea) {
          record(CallOp.SetSelectionArea, toNumber(handle), isArea ? 1 : 0);
        },
        ui_set_selection_area_barrier(handle, isBarrier) {
          record(CallOp.SetSelectionAreaBarrier, toNumber(handle), isBarrier ? 1 : 0);
        },
        ui_clear_selection(handle) {
          record(CallOp.ClearSelection, toNumber(handle));
        },
        ui_retarget_selection(fromHandle, toHandle) {
          record(CallOp.RetargetSelection, toNumber(fromHandle), toNumber(toHandle));
        },
        ui_set_scroll_offset(handle, x, y) {
          record(CallOp.SetScrollOffset, toNumber(handle), x, y);
        },
        ui_clear_momentum_scroll() {
          record(CallOp.ClearMomentumScroll);
        },
        ui_get_bounds(handle, outXPtr, outYPtr, outWidthPtr, outHeightPtr) {
          const entry = nodeBoundsByHandle.get(toNumber(handle));
          if (entry === undefined) {
            return 0;
          }
          const view = new DataView(getActiveMemory(memory).buffer);
          view.setFloat32(outXPtr, entry.x, true);
          view.setFloat32(outYPtr, entry.y, true);
          view.setFloat32(outWidthPtr, entry.width, true);
          view.setFloat32(outHeightPtr, entry.height, true);
          return 1;
        },
        ui_is_point_in_selection() {
          return 0;
        },
        ui_set_text_selection_range(handle, selectionStart, selectionEnd) {
          record(CallOp.SetTextSelectionRange, toNumber(handle), selectionStart, selectionEnd);
        },
        ui_clear_current_selection() {},
        ui_copy_current_selection() {},
        ui_can_undo_text_edit() {
          return 0;
        },
        ui_can_redo_text_edit() {
          return 0;
        },
        ui_has_text_selection() {
          return 0;
        },
        ui_undo_text_edit() {},
        ui_redo_text_edit() {},
        ui_copy_text_selection() {},
        ui_cut_text_selection() {},
        ui_paste_text() {},
        ui_select_all_text() {},
        ui_commit_frame() {
          record(CallOp.CommitFrame);
        },
        ui_resize_window() {},
      },
      fui_host: {
        request_render() {
          record(CallOp.RequestRender);
        },
        get_viewport_width() { return 640; },
        get_viewport_height() { return 480; },
        fui_set_pointer_capture() {},
        fui_release_pointer_capture() {},
        fui_reload_page() {},
        fui_can_navigate_back() { return 1; },
        fui_can_navigate_forward() { return 1; },
        fui_navigate_back() {
          record(CallOp.NavigateBack);
        },
        fui_navigate_forward() {
          record(CallOp.NavigateForward);
        },
        fui_copy_text() {},
        fui_has_text_selection_snapshot() {
          return 0;
        },
        fui_copy_text_selection_snapshot() {
          return 0;
        },
        fui_cut_focused_text_selection() {
          return 0;
        },
        fui_cut_text_selection_snapshot() {
          return 0;
        },
        fui_cut_text_range_snapshot() {
          return 0;
        },
        fui_delete_focused_text_range() {
          return 0;
        },
        fui_commit_text_action_focus(handle) {
          record(CallOp.RequestFocus, toNumber(handle));
          record(CallOp.CommitFrame);
        },
        fui_load_svg(svgId, ptr, len) {
          lastSvgUrl = readUtf8(memory, ptr, len);
          record(CallOp.LoadSvg, svgId, len);
        },
        fui_load_texture(textureId, ptr, len) {
          lastTextureUrl = readUtf8(memory, ptr, len);
          record(CallOp.LoadTexture, textureId, len);
        },
        fui_release_svg(svgId) {
          record(CallOp.ReleaseSvg, svgId);
        },
        fui_release_texture(textureId) {
          record(CallOp.ReleaseTexture, textureId);
        },
        fui_bitmap_commit(textureId, bytesPtr, bytesLen, width, height) {
          lastBitmapBytes = readBytes(memory, bytesPtr, bytesLen);
          record(CallOp.BitmapCommit, textureId, bytesLen, width, height);
        },
        fui_bitmap_release(textureId) {
          record(CallOp.BitmapRelease, textureId);
        },
        fui_load_font(fontId, ptr, len) {
          lastFontUrl = readUtf8(memory, ptr, len);
          record(CallOp.LoadFont, fontId, len);
        },
        fui_start_timer(timerId, delayMs) {
          record(CallOp.StartTimer, timerId, delayMs);
        },
        fui_cancel_timer(timerId) {
          record(CallOp.CancelTimer, timerId);
        },
        fui_now_ms() {
          return currentTimerNowMs;
        },
        fui_set_cursor(style) {
          record(CallOp.SetCursor, style);
        },
        fui_is_dark_mode() { return 0; },
        fui_get_accent_color() { return 0x2563ebff; },
        fui_get_platform_family() { return 1; },
        fui_is_coarse_pointer() { return coarsePointer ? 1 : 0; },
        fui_show_url_preview(ptr, len) {
          lastUrlPreviewText = readUtf8(memory, ptr, len);
          record(CallOp.ShowUrlPreview, len);
        },
        fui_hide_url_preview() {
          lastUrlPreviewText = '';
          record(CallOp.HideUrlPreview);
        },
        fui_navigate_to(ptr, len, openInNewTab) {
          lastNavigationTarget = readUtf8(memory, ptr, len);
          record(CallOp.NavigateTo, len, openInNewTab ? 1 : 0);
        },
        fui_set_persisted_scroll_offset(nodeIdPtr, nodeIdLen, x, y) {
          const nodeId = readUtf8(memory, nodeIdPtr, nodeIdLen);
          if (!nodeId) {
            return;
          }
          persistedScrollEntries.set(nodeId, { x, y });
        },
        fui_try_get_persisted_scroll_offset(nodeIdPtr, nodeIdLen, outXPtr, outYPtr) {
          const nodeId = readUtf8(memory, nodeIdPtr, nodeIdLen);
          if (!nodeId) {
            return 0;
          }
          const entry = persistedScrollEntries.get(nodeId);
          if (entry === undefined) {
            return 0;
          }
          const view = new DataView(getActiveMemory(memory).buffer);
          view.setFloat32(outXPtr, entry.x, true);
          view.setFloat32(outYPtr, entry.y, true);
          return 1;
        },
        fui_set_persisted_state(nodeIdPtr, nodeIdLen, kindPtr, kindLen, version, payloadPtr, payloadLen) {
          const nodeId = readUtf8(memory, nodeIdPtr, nodeIdLen);
          const kind = readUtf8(memory, kindPtr, kindLen);
          if (!nodeId || !kind) {
            return;
          }
          persistedTextEntries.set(`${kind}\n${nodeId}`, {
            version: version >>> 0,
            payload: readUtf8(memory, payloadPtr, payloadLen),
          });
        },
        fui_copy_persisted_state(nodeIdPtr, nodeIdLen, kindPtr, kindLen, outVersionPtr, payloadPtr, payloadCapacity) {
          const nodeId = readUtf8(memory, nodeIdPtr, nodeIdLen);
          const kind = readUtf8(memory, kindPtr, kindLen);
          if (!nodeId || !kind) {
            return -1;
          }
          const entry = persistedTextEntries.get(`${kind}\n${nodeId}`);
          if (entry === undefined) {
            return -1;
          }
          const sourceMemory = getActiveMemory(memory);
          new DataView(sourceMemory.buffer).setUint32(outVersionPtr, entry.version >>> 0, true);
          const encoded = encoder.encode(entry.payload);
          if (encoded.length > payloadCapacity) {
            return encoded.length;
          }
          if (encoded.length > 0) {
            new Uint8Array(sourceMemory.buffer, payloadPtr, encoded.length).set(encoded);
          }
          return encoded.length;
        },
        fui_log(catPtr, catLen, msgPtr, msgLen) {
          lastLogCategory = readUtf8(memory, catPtr, catLen);
          lastLogMessage = readUtf8(memory, msgPtr, msgLen);
          record(CallOp.Log, catLen, msgLen);
        },
        fui_worker_start_string(workerId, entryPtr, entryLen, inputPtr, inputLen) {
          lastWorkerEntry = readUtf8(memory, entryPtr, entryLen);
          lastWorkerInput = readUtf8(memory, inputPtr, inputLen);
          record(CallOp.WorkerStartString, workerId, entryLen, inputLen);
        },
        fui_worker_cancel(workerId) {
          workerCancelled = true;
          record(CallOp.WorkerCancel, workerId);
        },
        fui_fetch_start(requestId, methodPtr, methodLen, urlPtr, urlLen, _headersPtr, headersLen, _bodyPtr, bodyLen) {
          lastFetchMethod = readUtf8(memory, methodPtr, methodLen);
          lastFetchUrl = readUtf8(memory, urlPtr, urlLen);
          record(CallOp.FetchStart, requestId, headersLen, bodyLen);
        },
        fui_fetch_cancel(requestId) {
          record(CallOp.FetchCancel, requestId);
        },
        fui_file_capabilities() {
          return (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 7);
        },
        fui_file_pick(_requestId, _acceptPtr, _acceptLen, _multiple) {},
        fui_file_read_chunk(_requestId, _fileIdPtr, _fileIdLen, _offsetBytes, _maxBytes) {},
        fui_file_save_text(_requestId, _suggestedNamePtr, _suggestedNameLen, _mimeTypePtr, _mimeTypeLen, _fileExtensionPtr, _fileExtensionLen, _textPtr, _textLen) {},
        fui_file_save_bytes(_requestId, _suggestedNamePtr, _suggestedNameLen, _mimeTypePtr, _mimeTypeLen, _fileExtensionPtr, _fileExtensionLen, _bytesPtr, _bytesLen) {},
        fui_file_create_writer(_requestId, _suggestedNamePtr, _suggestedNameLen, _mimeTypePtr, _mimeTypeLen, _fileExtensionPtr, _fileExtensionLen) {},
        fui_file_writer_write_text(_requestId, _writerIdPtr, _writerIdLen, _textPtr, _textLen) {},
        fui_file_writer_write_bytes(_requestId, _writerIdPtr, _writerIdLen, _bytesPtr, _bytesLen) {},
        fui_file_writer_finish(_requestId, _writerIdPtr, _writerIdLen) {},
        fui_file_process_worker_start(requestId, _fileIdPtr, _fileIdLen, _suggestedNamePtr, _suggestedNameLen, chunkBytes, saveToPickedFile) {
          record(CallOp.FileWorkerProcessStart, requestId, chunkBytes, saveToPickedFile);
        },
        fui_file_process_worker_cancel(requestId) {
          record(CallOp.FileWorkerProcessCancel, requestId);
        },
        fui_logs_enabled() { return logsEnabled ? 1 : 0; },

        /* Canvas drawing — no-op mocks for unit tests. */
        fui_canvas_save(_ptr) {},
        fui_canvas_restore(_ptr) {},
        fui_canvas_translate(_ptr, _x, _y) {},
        fui_canvas_scale(_ptr, _sx, _sy) {},
        fui_canvas_rotate(_ptr, _deg) {},
        fui_canvas_clip_rect(_ptr, _x, _y, _w, _h) {},
        fui_canvas_draw_rect(_ptr, _x, _y, _w, _h, _fc, _sc, _sw) {},
        fui_canvas_draw_circle(_ptr, _cx, _cy, _r, _fc, _sc, _sw) {},
        fui_canvas_draw_line(_ptr, _x1, _y1, _x2, _y2, _c, _sw) {},
        fui_canvas_draw_round_rect(_ptr, _x, _y, _w, _h, _rx, _ry, _fc, _sc, _sw) {},
        fui_path_create() { return 0; },
        fui_path_destroy(_id) {},
        fui_path_move_to(_id, _x, _y) {},
        fui_path_line_to(_id, _x, _y) {},
        fui_path_quad_to(_id, _cx, _cy, _x, _y) {},
        fui_path_cubic_to(_id, _cx1, _cy1, _cx2, _cy2, _x, _y) {},
        fui_path_close(_id) {},
        fui_path_add_rect(_id, _x, _y, _w, _h) {},
        fui_path_add_circle(_id, _cx, _cy, _r) {},
        fui_canvas_draw_path(_ptr, _pid, _fc, _sc, _sw) {},
        fui_canvas_draw_text(_ptr, _utf8, _len, _x, _y, _fid, _fs, _c) {},
        fui_canvas_draw_image(_ptr, _tid, _x, _y, _w, _h) {},
        fui_canvas_draw_svg(_ptr, _sid, _x, _y, _w, _h) {},
        fui_canvas_create_offscreen(_w, _h) { return 0; },
        fui_canvas_get_offscreen_ptr(_id) { return 0; },
        fui_canvas_read_offscreen_pixels(_id, _out, _w, _h) {},
        fui_canvas_destroy_offscreen(_id) {},
      },
      fui_host_service: {
        demoShellAccentColorHex(resultPtr, resultCap) {
          lastHostServiceCall = 'demo-shell-accent';
          const result = '#3a6cc5';
          const encoded = encoder.encode(result);
          if (encoded.length > resultCap) {
            throw new Error('Host service result exceeded the provided buffer.');
          }
          if (encoded.length > 0) {
            new Uint8Array(getActiveMemory(memory).buffer, resultPtr, encoded.length).set(encoded);
          }
          return encoded.length;
        },
        demoShellClockTickSeconds() {
          lastHostServiceCall = 'demo-shell-tick';
          return 42;
        },
        demoShellIsDarkMode() {
          lastHostServiceCall = 'demo-shell-dark';
          return 1;
        },
        demoShellWallClockSinceEpochMs() {
          lastHostServiceCall = 'demo-shell-wall-clock';
          return currentTimerNowMs;
        },
        demoWorkerClockWallClockSinceEpochMs() {
          lastHostServiceCall = 'worker-clock';
          return currentTimerNowMs;
        },
      },
      fui_fetch_host: {
        fui_fetch_start(requestId, methodPtr, methodLen, urlPtr, urlLen, _headersPtr, headersLen, _bodyPtr, bodyLen) {
          lastFetchMethod = readUtf8(memory, methodPtr, methodLen);
          lastFetchUrl = readUtf8(memory, urlPtr, urlLen);
          record(CallOp.FetchStart, requestId, headersLen, bodyLen);
        },
        fui_fetch_cancel(requestId) {
          record(CallOp.FetchCancel, requestId);
        },
      },
      fui_worker_host: {
        fui_worker_input_length() {
          return encoder.encode(lastWorkerInput).length;
        },
        fui_worker_copy_input(ptr, capacity) {
          const encoded = encoder.encode(lastWorkerInput);
          const copyLength = Math.max(0, Math.min(capacity, encoded.length));
          if (copyLength > 0) {
            new Uint8Array(getActiveMemory(memory).buffer, ptr, copyLength).set(encoded.subarray(0, copyLength));
          }
          return copyLength;
        },
        fui_worker_report_progress(ptr, len) {
          lastWorkerProgress = readUtf8(memory, ptr, len);
        },
        fui_worker_complete_string(ptr, len) {
          lastWorkerComplete = readUtf8(memory, ptr, len);
        },
        fui_worker_fail(ptr, len) {
          lastWorkerFailure = readUtf8(memory, ptr, len);
        },
        fui_worker_is_cancelled() {
          return workerCancelled ? 1 : 0;
        },
        fui_worker_request_yield() {
          workerYieldCount += 1;
          record(CallOp.WorkerYield, 0);
        },
        fui_worker_request_yield_delay(delayMs) {
          workerYieldCount += 1;
          record(CallOp.WorkerYield, delayMs);
        },
      },
      fui_test: {
        reset_calls() {
          resetRecorder();
        },
        get_call_count() {
          return calls.length;
        },
        get_call_op(index) {
          return calls[index]?.op ?? 0;
        },
        get_call_arg(index, argIndex) {
          return calls[index]?.args[argIndex] ?? 0;
        },
        last_text_length() {
          return lastText.length;
        },
        last_text_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastText ? 1 : 0;
        },
        last_url_preview_length() {
          return lastUrlPreviewText.length;
        },
        last_url_preview_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastUrlPreviewText ? 1 : 0;
        },
        last_navigation_target_length() {
          return lastNavigationTarget.length;
        },
        last_navigation_target_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastNavigationTarget ? 1 : 0;
        },
        last_svg_url_length() {
          return lastSvgUrl.length;
        },
        last_svg_url_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastSvgUrl ? 1 : 0;
        },
        last_texture_url_length() {
          return lastTextureUrl.length;
        },
        last_texture_url_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastTextureUrl ? 1 : 0;
        },
        last_font_url_length() {
          return lastFontUrl.length;
        },
        last_font_url_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastFontUrl ? 1 : 0;
        },
        last_log_category_length() {
          return lastLogCategory.length;
        },
        last_log_category_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastLogCategory ? 1 : 0;
        },
        last_log_message_length() {
          return lastLogMessage.length;
        },
        last_log_message_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastLogMessage ? 1 : 0;
        },
        last_worker_entry_length() {
          return lastWorkerEntry.length;
        },
        last_worker_entry_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastWorkerEntry ? 1 : 0;
        },
        last_worker_input_length() {
          return lastWorkerInput.length;
        },
        last_worker_input_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastWorkerInput ? 1 : 0;
        },
        last_worker_progress_length() {
          return lastWorkerProgress.length;
        },
        last_worker_progress_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastWorkerProgress ? 1 : 0;
        },
        last_worker_complete_length() {
          return lastWorkerComplete.length;
        },
        last_worker_complete_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastWorkerComplete ? 1 : 0;
        },
        last_worker_failure_length() {
          return lastWorkerFailure.length;
        },
        last_worker_failure_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastWorkerFailure ? 1 : 0;
        },
        last_worker_yield_count() {
          return workerYieldCount;
        },
        last_host_service_call_length() {
          return lastHostServiceCall.length;
        },
        last_host_service_call_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastHostServiceCall ? 1 : 0;
        },
        last_fetch_method_length() {
          return lastFetchMethod.length;
        },
        last_fetch_method_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastFetchMethod ? 1 : 0;
        },
        last_fetch_url_length() {
          return lastFetchUrl.length;
        },
        last_fetch_url_equals(ptr, len) {
          return readUtf8(memory, ptr, len) === lastFetchUrl ? 1 : 0;
        },
        last_bitmap_bytes_length() {
          return lastBitmapBytes.length;
        },
        last_bitmap_bytes_equals(ptr, len) {
          return bytesEqual(readBytes(memory, ptr, len), lastBitmapBytes) ? 1 : 0;
        },
        set_worker_input(ptr, len) {
          if (len === 0) {
            lastWorkerInput = '';
            return;
          }
          const offset = toNumber(ptr);
          const sourceMemory = getActiveMemory(memory);
          if (!Number.isFinite(offset) || offset < 0 || (offset + (len * 2)) > sourceMemory.buffer.byteLength) {
            lastWorkerInput = '';
            return;
          }
          lastWorkerInput = utf16Decoder.decode(new Uint8Array(sourceMemory.buffer, offset, len * 2));
        },
        set_worker_cancelled(value) {
          workerCancelled = value !== 0;
        },
        set_logs_enabled(value) {
          logsEnabled = value !== 0;
        },
        set_coarse_pointer(value) {
          coarsePointer = value !== 0;
        },
        set_timer_now(value) {
          currentTimerNowMs = value;
        },
        set_node_bounds(handle, x, y, width, height) {
          nodeBoundsByHandle.set(toNumber(handle), { x, y, width, height });
        },
        clear_node_bounds(handle) {
          nodeBoundsByHandle.delete(toNumber(handle));
        },
      },
    })).then((instance) => {
      activeMemory = instance.exports.memory;
      return instance;
    });
  },
  outputBinary: false,
};
