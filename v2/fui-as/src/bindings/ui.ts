import * as ffi from "../core/ffi";

function encodeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

export function reset(): void {
  ffi.ui_reset();
}

export function createNode(type: u32): u64 {
  return ffi.ui_create_node(type);
}

export function setNodeId(handle: u64, id: string): void {
  const bytes = encodeUtf8(id);
  ffi.ui_set_node_id(handle, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function setSemanticRole(handle: u64, role: u32): void {
  ffi.ui_set_semantic_role(handle, role);
}

export function setSemanticLabel(handle: u64, label: string): void {
  const bytes = encodeUtf8(label);
  ffi.ui_set_semantic_label(handle, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function setSemanticChecked(handle: u64, checkedState: u32): void {
  ffi.ui_set_semantic_checked(handle, checkedState);
}

export function setSemanticSelected(handle: u64, hasSelected: bool, selected: bool): void {
  ffi.ui_set_semantic_selected(handle, hasSelected, selected);
}

export function setSemanticExpanded(handle: u64, hasExpanded: bool, expanded: bool): void {
  ffi.ui_set_semantic_expanded(handle, hasExpanded, expanded);
}

export function setSemanticDisabled(handle: u64, hasDisabled: bool, disabled: bool): void {
  ffi.ui_set_semantic_disabled(handle, hasDisabled, disabled);
}

export function setSemanticValueRange(
  handle: u64,
  hasValueRange: bool,
  valueNow: f32,
  valueMin: f32,
  valueMax: f32,
): void {
  ffi.ui_set_semantic_value_range(handle, hasValueRange, valueNow, valueMin, valueMax);
}

export function setSemanticOrientation(handle: u64, orientation: u32): void {
  ffi.ui_set_semantic_orientation(handle, orientation);
}

export function requestSemanticAnnouncement(handle: u64): void {
  ffi.ui_request_semantic_announcement(handle);
}

export function pushSemanticScope(handle: u64): u32 {
  return ffi.ui_push_semantic_scope(handle);
}

export function removeSemanticScope(token: u32): void {
  ffi.ui_remove_semantic_scope(token);
}

export function deleteNode(handle: u64): void {
  ffi.ui_delete_node(handle);
}

export function addChild(parent: u64, child: u64): void {
  ffi.ui_node_add_child(parent, child);
}

export function removeChild(parent: u64, child: u64): void {
  ffi.ui_node_remove_child(parent, child);
}

export function setIsPortal(handle: u64, flag: bool): void {
  ffi.ui_set_is_portal(handle, flag);
}

export function setVisibility(handle: u64, visibility: u32): void {
  ffi.ui_set_visibility(handle, visibility);
}

export function setRoot(handle: u64): void {
  ffi.ui_set_root(handle);
}

export function setWidth(handle: u64, value: f32, unit: u32): void {
  ffi.ui_set_width(handle, value, unit);
}

export function setHeight(handle: u64, value: f32, unit: u32): void {
  ffi.ui_set_height(handle, value, unit);
}

export function setFillWidth(handle: u64, fill: bool): void {
  ffi.ui_set_fill_width(handle, fill);
}

export function setFillHeight(handle: u64, fill: bool): void {
  ffi.ui_set_fill_height(handle, fill);
}

export function setFlexDirection(handle: u64, direction: u32): void {
  ffi.ui_set_flex_direction(handle, direction);
}

export function setFlexBasis(handle: u64, basis: f32): void {
  ffi.ui_set_flex_basis(handle, basis);
}

export function setJustifyContent(handle: u64, justify: u32): void {
  ffi.ui_set_justify_content(handle, justify);
}

export function setAlignItems(handle: u64, align: u32): void {
  ffi.ui_set_align_items(handle, align);
}

export function setPadding(handle: u64, left: f32, top: f32, right: f32, bottom: f32): void {
  ffi.ui_set_padding(handle, left, top, right, bottom);
}

export function setMargin(handle: u64, left: f32, top: f32, right: f32, bottom: f32): void {
  ffi.ui_set_margin(handle, left, top, right, bottom);
}

export function setPositionType(handle: u64, positionType: u32): void {
  ffi.ui_set_position_type(handle, positionType);
}

export function setPosition(handle: u64, left: f32, top: f32, right: f32, bottom: f32): void {
  ffi.ui_set_position(handle, left, top, right, bottom);
}

export function setIsSharedSizeScope(handle: u64, isScope: bool): void {
  ffi.ui_set_is_shared_size_scope(handle, isScope);
}

export function gridSetColumns(handle: u64, values: Float32Array, types: Uint8Array): void {
  ffi.ui_grid_set_columns(
    handle,
    <u32>values.length,
    values.length > 0 ? values.dataStart : 0,
    types.length > 0 ? types.dataStart : 0,
  );
}

export function gridSetRows(handle: u64, values: Float32Array, types: Uint8Array): void {
  ffi.ui_grid_set_rows(
    handle,
    <u32>values.length,
    values.length > 0 ? values.dataStart : 0,
    types.length > 0 ? types.dataStart : 0,
  );
}

export function gridSetColumnSharedSizeGroup(handle: u64, index: u32, group: string): void {
  const bytes = encodeUtf8(group);
  ffi.ui_grid_set_column_shared_size_group(handle, index, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function gridSetRowSharedSizeGroup(handle: u64, index: u32, group: string): void {
  const bytes = encodeUtf8(group);
  ffi.ui_grid_set_row_shared_size_group(handle, index, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function setGridPlacement(handle: u64, row: u32, col: u32, rowSpan: u32, colSpan: u32): void {
  ffi.ui_node_set_grid_placement(handle, row, col, rowSpan, colSpan);
}

export function setBackgroundColor(handle: u64, color: u32): void {
  ffi.ui_set_bg_color(handle, color);
}

export function setBoxStyle(
  handle: u64,
  bgColor: u32,
  topLeftRadius: f32,
  topRightRadius: f32,
  bottomRightRadius: f32,
  bottomLeftRadius: f32,
  borderWidth: f32,
  borderColor: u32,
  borderStyle: u32,
  borderDashOn: f32,
  borderDashOff: f32,
): void {
  ffi.ui_set_box_style(
    handle,
    bgColor,
    topLeftRadius,
    topRightRadius,
    bottomRightRadius,
    bottomLeftRadius,
    borderWidth,
    borderColor,
    borderStyle,
    borderDashOn,
    borderDashOff,
  );
}

export function setLayerEffect(handle: u64, opacity: f32, blurSigma: f32, blendMode: u32): void {
  ffi.ui_set_layer_effect(handle, opacity, blurSigma, blendMode);
}

export function setDropShadow(
  handle: u64,
  color: u32,
  offsetX: f32,
  offsetY: f32,
  blurSigma: f32,
  spread: f32,
): void {
  ffi.ui_set_drop_shadow(handle, color, offsetX, offsetY, blurSigma, spread);
}

export function setBackgroundBlur(handle: u64, blurSigma: f32): void {
  ffi.ui_set_background_blur(handle, blurSigma);
}

export function setImage(handle: u64, textureId: u32, objectFit: u32): void {
  ffi.ui_set_image(handle, textureId, objectFit);
}

export function setImageNine(
  handle: u64,
  textureId: u32,
  insetLeft: f32,
  insetTop: f32,
  insetRight: f32,
  insetBottom: f32,
): void {
  ffi.ui_set_image_nine(handle, textureId, insetLeft, insetTop, insetRight, insetBottom);
}

export function setSvg(handle: u64, svgId: u32, tintColor: u32): void {
  ffi.ui_set_svg(handle, svgId, tintColor);
}

export function setLinearGradient(
  handle: u64,
  startX: f32,
  startY: f32,
  endX: f32,
  endY: f32,
  offsets: Float32Array,
  colors: Uint32Array,
): void {
  if (offsets.length == 0) {
    return;
  }
  ffi.ui_set_linear_gradient(
    handle,
    startX,
    startY,
    endX,
    endY,
    <u32>offsets.length,
  );
  for (let i = 0; i < offsets.length; ++i) {
    ffi.ui_push_linear_gradient_stop(handle, unchecked(offsets[i]), unchecked(colors[i]));
  }
}

export function setClipToBounds(handle: u64, clip: bool): void {
  ffi.ui_set_clip_to_bounds(handle, clip);
}

export function setInteractive(handle: u64, flag: bool): void {
  ffi.ui_set_interactive(handle, flag);
}

export function setScrollProxyTarget(handle: u64, scrollHandle: u64): void {
  ffi.ui_set_scroll_proxy_target(handle, scrollHandle);
}

export function setScrollEnabled(handle: u64, enabledX: bool, enabledY: bool): void {
  ffi.ui_set_scroll_enabled(handle, enabledX, enabledY);
}

export function setShowScrollbars(handle: u64, showScrollbars: bool): void {
  ffi.ui_set_show_scrollbars(handle, showScrollbars);
}

export function setScrollFriction(handle: u64, friction: f32): void {
  ffi.ui_set_scroll_friction(handle, friction);
}

export function setFocusable(handle: u64, flag: bool, tabIndex: i32): void {
  ffi.ui_set_focusable(handle, flag, tabIndex);
}

export function requestFocus(handle: u64): void {
  ffi.ui_request_focus(handle);
}

export function setText(handle: u64, text: string): void {
  const bytes = encodeUtf8(text);
  ffi.ui_set_text(handle, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function setTextStyleRuns(handle: u64, runsWords: Uint32Array): void {
  ffi.ui_set_text_style_runs(handle, <u32>(runsWords.length / 7), runsWords.length > 0 ? runsWords.dataStart : 0);
}

export function loadSvg(svgId: u32, url: string): void {
  const bytes = encodeUtf8(url);
  ffi.fui_load_svg(svgId, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function loadTexture(textureId: u32, url: string): void {
  const bytes = encodeUtf8(url);
  ffi.fui_load_texture(textureId, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function releaseSvg(svgId: u32): void {
  ffi.fui_release_svg(svgId);
}

export function releaseTexture(textureId: u32): void {
  ffi.fui_release_texture(textureId);
}

export function bitmapCommit(textureId: u32, bytes: Uint8Array, width: u32, height: u32): void {
  ffi.fui_bitmap_commit(
    textureId,
    bytes.length > 0 ? bytes.dataStart : 0,
    <u32>bytes.length,
    width,
    height,
  );
}

export function bitmapRelease(textureId: u32): void {
  ffi.fui_bitmap_release(textureId);
}

export function loadFont(fontId: u32, url: string): void {
  const bytes = encodeUtf8(url);
  ffi.fui_load_font(fontId, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export function startTimer(timerId: u32, delayMs: i32): void {
  ffi.fui_start_timer(timerId, delayMs);
}

export function cancelTimer(timerId: u32): void {
  ffi.fui_cancel_timer(timerId);
}

export function nowMs(): f64 {
  return ffi.fui_now_ms();
}

export function setFont(handle: u64, fontId: u32, size: f32): void {
  ffi.ui_set_font(handle, fontId, size);
}

export function setLineHeight(handle: u64, lineHeight: f32): void {
  ffi.ui_set_line_height(handle, lineHeight);
}

export function registerFontFallback(fontId: u32, fallbackFontId: u32): void {
  ffi.ui_register_font_fallback(fontId, fallbackFontId);
}

export function setTextColor(handle: u64, color: u32): void {
  ffi.ui_set_text_color(handle, color);
}

export function setTextAlign(handle: u64, align: u32): void {
  ffi.ui_set_text_align(handle, align);
}

export function setTextVerticalAlign(handle: u64, align: u32): void {
  ffi.ui_set_text_vertical_align(handle, align);
}

export function setTextLimits(handle: u64, maxChars: i32, maxLines: i32): void {
  ffi.ui_set_text_limits(handle, maxChars, maxLines);
}

export function setTextWrapping(handle: u64, wrap: bool): void {
  ffi.ui_set_text_wrapping(handle, wrap);
}

export function setTextOverflow(handle: u64, overflow: u32): void {
  ffi.ui_set_text_overflow(handle, overflow);
}

export function setTextOverflowFade(handle: u64, horizontal: bool, vertical: bool): void {
  ffi.ui_set_text_overflow_fade(handle, horizontal, vertical);
}

export function setTextObscured(handle: u64, obscured: bool): void {
  ffi.ui_set_text_obscured(handle, obscured);
}

export function setEditable(handle: u64, editable: bool): void {
  ffi.ui_set_editable(handle, editable);
}

export function setCaretColor(handle: u64, color: u32): void {
  ffi.ui_set_caret_color(handle, color);
}

export function setScrollOffset(handle: u64, offsetX: f32, offsetY: f32): void {
  ffi.ui_set_scroll_offset(handle, offsetX, offsetY);
}

export function setScrollContentSize(handle: u64, contentWidth: f32, contentHeight: f32): void {
  ffi.ui_set_scroll_content_size(handle, contentWidth, contentHeight);
}

export function clearMomentumScroll(): void {
  ffi.ui_clear_momentum_scroll();
}

export function setSelectable(handle: u64, selectable: bool, selectionColor: u32): void {
  ffi.ui_set_selectable(handle, selectable, selectionColor);
}

export function setSelectionArea(handle: u64, isArea: bool): void {
  ffi.ui_set_selection_area(handle, isArea);
}

export function setSelectionAreaBarrier(handle: u64, isBarrier: bool): void {
  ffi.ui_set_selection_area_barrier(handle, isBarrier);
}

export function clearSelection(handle: u64): void {
  ffi.ui_clear_selection(handle);
}

export function retargetSelection(fromHandle: u64, toHandle: u64): void {
  ffi.ui_retarget_selection(fromHandle, toHandle);
}

export function isPointInSelection(x: f32, y: f32): bool {
  return ffi.ui_is_point_in_selection(x, y);
}

export function setTextSelectionRange(handle: u64, selectionStart: u32, selectionEnd: u32): void {
  ffi.ui_set_text_selection_range(handle, selectionStart, selectionEnd);
}

export function clearCurrentSelection(): void {
  ffi.ui_clear_current_selection();
}

export function copyCurrentSelection(): void {
  ffi.ui_copy_current_selection();
}

export function canUndoTextEdit(handle: u64): bool {
  return ffi.ui_can_undo_text_edit(handle);
}

export function canRedoTextEdit(handle: u64): bool {
  return ffi.ui_can_redo_text_edit(handle);
}

export function hasTextSelection(handle: u64): bool {
  return ffi.ui_has_text_selection(handle);
}

export function undoTextEdit(handle: u64): void {
  ffi.ui_undo_text_edit(handle);
}

export function redoTextEdit(handle: u64): void {
  ffi.ui_redo_text_edit(handle);
}

export function copyTextSelection(handle: u64): void {
  ffi.ui_copy_text_selection(handle);
}

export function cutTextSelection(handle: u64): void {
  ffi.ui_cut_text_selection(handle);
}

export function replaceTextRange(handle: u64, start: u32, end: u32, text: string, caret: u32): void {
  const bytes = encodeUtf8(text);
  ffi.ui_replace_text_range(handle, start, end, bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length, caret);
}

export function pasteText(handle: u64): void {
  ffi.ui_paste_text(handle);
}

export function selectAllText(handle: u64): void {
  ffi.ui_select_all_text(handle);
}

export function commitFrame(): void {
  ffi.ui_commit_frame();
}

export function tryGetBounds(handle: u64): Float32Array | null {
  const values = new Float32Array(4);
  const found = ffi.ui_get_bounds(
    handle,
    values.dataStart,
    values.dataStart + sizeof<f32>(),
    values.dataStart + (sizeof<f32>() * 2),
    values.dataStart + (sizeof<f32>() * 3),
  );
  return found ? values : null;
}

export function resizeWindow(width: f32, height: f32): void {
  ffi.ui_resize_window(width, height);
}

export function requestRender(): void {
  ffi.request_render();
}

export function getViewportWidth(): f32 {
  return ffi.get_viewport_width();
}

export function getViewportHeight(): f32 {
  return ffi.get_viewport_height();
}
