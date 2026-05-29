export enum HandleValue {
  Invalid = 0,
}

export enum NodeType {
  FlexBox = 0,
  Text = 1,
  Image = 2,
  Svg = 3,
  ScrollView = 4,
  Grid = 5,
}

export enum Unit {
  Pixel = 0,
  Auto = 1,
  Percent = 2,
}

export enum GridUnit {
  Pixel = 0,
  Auto = 1,
  Star = 2,
}

export enum PositionType {
  Relative = 0,
  Absolute = 1,
}

export enum Visibility {
  Normal = 0,
  Hidden = 1,
  Collapsed = 2,
}

export enum FlexDirection {
  Column = 0,
  Row = 1,
}

export enum JustifyContent {
  Start = 0,
  Center = 2,
  End = 3,
}

export enum AlignItems {
  Start = 0,
  Center = 2,
  End = 3,
  Stretch = 4,
}

export enum BorderStyle {
  Solid = 0,
  Dashed = 1,
  Dotted = 2,
}

export enum ObjectFit {
  Fill = 0,
  Contain = 1,
  Cover = 2,
  None = 3,
  ScaleDown = 4,
}

export enum TextAlign {
  Left = 0,
  Center = 1,
  Right = 2,
}

export enum TextVerticalAlign {
  Top = 0,
  Center = 1,
  Bottom = 2,
}

export enum TextOverflow {
  Clip = 0,
  Ellipsis = 1,
  Fade = 2,
}

export enum Orientation {
  None = 0,
  Horizontal = 1,
  Vertical = 2,
}

export enum CursorStyle {
  Default = 0,
  Pointer = 1,
  Text = 2,
  Move = 3,
  Grab = 4,
  Grabbing = 5,
  ResizeNS = 6,
  ResizeEW = 7,
}

export enum PointerEventType {
  Down = 1,
  Up = 2,
  Move = 3,
  Enter = 4,
  Leave = 5,
}

export enum KeyEventType {
  Down = 1,
  Up = 2,
}

export enum KeyModifier {
  Shift = 1 << 0,
  Ctrl = 1 << 1,
  Alt = 1 << 2,
  Meta = 1 << 3,
}

export enum SemanticRole {
  None = 0,
  Button = 1,
  Textbox = 2,
  Link = 3,
  Heading = 4,
  Form = 5,
  List = 6,
  ListItem = 7,
  Image = 8,
  Dialog = 9,
  StaticText = 10,
  Checkbox = 11,
  Radio = 12,
  RadioGroup = 13,
  Switch = 14,
  Slider = 15,
  ComboBox = 16,
}

export enum SemanticCheckedState {
  None = 0,
  False = 1,
  True = 2,
  Mixed = 3,
}

@external("effindom_v2_ui", "ui_reset")
export declare function ui_reset(): void;

@external("effindom_v2_ui", "ui_create_node")
export declare function ui_create_node(type: u32): u64;

@external("effindom_v2_ui", "ui_delete_node")
export declare function ui_delete_node(handle: u64): void;

@external("effindom_v2_ui", "ui_set_node_id")
export declare function ui_set_node_id(handle: u64, ptr: usize, len: u32): void;

@external("effindom_v2_ui", "ui_set_semantic_role")
export declare function ui_set_semantic_role(handle: u64, role: u32): void;

@external("effindom_v2_ui", "ui_set_semantic_label")
export declare function ui_set_semantic_label(handle: u64, ptr: usize, len: u32): void;

@external("effindom_v2_ui", "ui_set_semantic_checked")
export declare function ui_set_semantic_checked(handle: u64, checkedState: u32): void;

@external("effindom_v2_ui", "ui_set_semantic_selected")
export declare function ui_set_semantic_selected(handle: u64, hasSelected: bool, selected: bool): void;

@external("effindom_v2_ui", "ui_set_semantic_expanded")
export declare function ui_set_semantic_expanded(handle: u64, hasExpanded: bool, expanded: bool): void;

@external("effindom_v2_ui", "ui_set_semantic_disabled")
export declare function ui_set_semantic_disabled(handle: u64, hasDisabled: bool, disabled: bool): void;

@external("effindom_v2_ui", "ui_set_semantic_value_range")
export declare function ui_set_semantic_value_range(
  handle: u64,
  hasValueRange: bool,
  valueNow: f32,
  valueMin: f32,
  valueMax: f32,
): void;

@external("effindom_v2_ui", "ui_set_semantic_orientation")
export declare function ui_set_semantic_orientation(handle: u64, orientation: u32): void;

@external("effindom_v2_ui", "ui_request_semantic_announcement")
export declare function ui_request_semantic_announcement(handle: u64): void;

@external("effindom_v2_ui", "ui_push_semantic_scope")
export declare function ui_push_semantic_scope(handle: u64): u32;

@external("effindom_v2_ui", "ui_remove_semantic_scope")
export declare function ui_remove_semantic_scope(token: u32): void;

@external("effindom_v2_ui", "ui_node_add_child")
export declare function ui_node_add_child(parent: u64, child: u64): void;

@external("effindom_v2_ui", "ui_node_remove_child")
export declare function ui_node_remove_child(parent: u64, child: u64): void;

@external("effindom_v2_ui", "ui_set_is_portal")
export declare function ui_set_is_portal(handle: u64, flag: bool): void;

@external("effindom_v2_ui", "ui_set_visibility")
export declare function ui_set_visibility(handle: u64, visibility: u32): void;

@external("effindom_v2_ui", "ui_set_root")
export declare function ui_set_root(handle: u64): void;

@external("effindom_v2_ui", "ui_set_width")
export declare function ui_set_width(handle: u64, value: f32, unit: u32): void;

@external("effindom_v2_ui", "ui_set_height")
export declare function ui_set_height(handle: u64, value: f32, unit: u32): void;

@external("effindom_v2_ui", "ui_set_flex_direction")
export declare function ui_set_flex_direction(handle: u64, direction: u32): void;

@external("effindom_v2_ui", "ui_set_flex_grow")
export declare function ui_set_flex_grow(handle: u64, grow: f32): void;

@external("effindom_v2_ui", "ui_set_flex_basis")
export declare function ui_set_flex_basis(handle: u64, basis: f32): void;

@external("effindom_v2_ui", "ui_set_justify_content")
export declare function ui_set_justify_content(handle: u64, justify: u32): void;

@external("effindom_v2_ui", "ui_set_align_items")
export declare function ui_set_align_items(handle: u64, align: u32): void;

@external("effindom_v2_ui", "ui_set_padding")
export declare function ui_set_padding(handle: u64, left: f32, top: f32, right: f32, bottom: f32): void;

@external("effindom_v2_ui", "ui_set_margin")
export declare function ui_set_margin(handle: u64, left: f32, top: f32, right: f32, bottom: f32): void;

@external("effindom_v2_ui", "ui_set_position_type")
export declare function ui_set_position_type(handle: u64, positionType: u32): void;

@external("effindom_v2_ui", "ui_set_position")
export declare function ui_set_position(handle: u64, left: f32, top: f32, right: f32, bottom: f32): void;

@external("effindom_v2_ui", "ui_set_is_shared_size_scope")
export declare function ui_set_is_shared_size_scope(handle: u64, isScope: bool): void;

@external("effindom_v2_ui", "ui_grid_set_columns")
export declare function ui_grid_set_columns(handle: u64, count: u32, valuesPtr: usize, typesPtr: usize): void;

@external("effindom_v2_ui", "ui_grid_set_rows")
export declare function ui_grid_set_rows(handle: u64, count: u32, valuesPtr: usize, typesPtr: usize): void;

@external("effindom_v2_ui", "ui_grid_set_column_shared_size_group")
export declare function ui_grid_set_column_shared_size_group(handle: u64, index: u32, ptr: usize, len: u32): void;

@external("effindom_v2_ui", "ui_grid_set_row_shared_size_group")
export declare function ui_grid_set_row_shared_size_group(handle: u64, index: u32, ptr: usize, len: u32): void;

@external("effindom_v2_ui", "ui_node_set_grid_placement")
export declare function ui_node_set_grid_placement(
  handle: u64,
  row: u32,
  col: u32,
  rowSpan: u32,
  colSpan: u32,
): void;

@external("effindom_v2_ui", "ui_set_bg_color")
export declare function ui_set_bg_color(handle: u64, color: u32): void;

@external("effindom_v2_ui", "ui_set_box_style")
export declare function ui_set_box_style(
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
): void;

@external("effindom_v2_ui", "ui_set_layer_effect")
export declare function ui_set_layer_effect(handle: u64, opacity: f32, blurSigma: f32, blendMode: u32): void;

@external("effindom_v2_ui", "ui_set_drop_shadow")
export declare function ui_set_drop_shadow(
  handle: u64,
  color: u32,
  offsetX: f32,
  offsetY: f32,
  blurSigma: f32,
  spread: f32,
): void;

@external("effindom_v2_ui", "ui_set_background_blur")
export declare function ui_set_background_blur(handle: u64, blurSigma: f32): void;

@external("effindom_v2_ui", "ui_set_image")
export declare function ui_set_image(handle: u64, textureId: u32, objectFit: u32): void;

@external("effindom_v2_ui", "ui_set_image_nine")
export declare function ui_set_image_nine(
  handle: u64,
  textureId: u32,
  insetLeft: f32,
  insetTop: f32,
  insetRight: f32,
  insetBottom: f32,
): void;

@external("effindom_v2_ui", "ui_set_svg")
export declare function ui_set_svg(handle: u64, svgId: u32, tintColor: u32): void;

@external("effindom_v2_ui", "ui_set_linear_gradient")
export declare function ui_set_linear_gradient(
  handle: u64,
  startX: f32,
  startY: f32,
  endX: f32,
  endY: f32,
  stopCount: u32,
): void;

@external("effindom_v2_ui", "ui_push_linear_gradient_stop")
export declare function ui_push_linear_gradient_stop(handle: u64, offset: f32, color: u32): void;

@external("effindom_v2_ui", "ui_set_clip_to_bounds")
export declare function ui_set_clip_to_bounds(handle: u64, clip: bool): void;

@external("effindom_v2_ui", "ui_set_interactive")
export declare function ui_set_interactive(handle: u64, interactive: bool): void;

@external("effindom_v2_ui", "ui_set_scroll_proxy_target")
export declare function ui_set_scroll_proxy_target(handle: u64, scrollHandle: u64): void;

@external("effindom_v2_ui", "ui_set_scroll_enabled")
export declare function ui_set_scroll_enabled(handle: u64, enabledX: bool, enabledY: bool): void;

@external("effindom_v2_ui", "ui_set_show_scrollbars")
export declare function ui_set_show_scrollbars(handle: u64, showScrollbars: bool): void;

@external("effindom_v2_ui", "ui_set_scroll_friction")
export declare function ui_set_scroll_friction(handle: u64, friction: f32): void;

@external("effindom_v2_ui", "ui_set_focusable")
export declare function ui_set_focusable(handle: u64, focusable: bool, tabIndex: i32): void;

@external("effindom_v2_ui", "ui_request_focus")
export declare function ui_request_focus(handle: u64): void;

@external("effindom_v2_ui", "ui_set_text")
export declare function ui_set_text(handle: u64, ptr: usize, len: u32): void;

@external("effindom_v2_ui", "ui_set_text_style_runs")
export declare function ui_set_text_style_runs(handle: u64, runCount: u32, runsWordsPtr: usize): void;

@external("effindom_v2_ui", "ui_set_font")
export declare function ui_set_font(handle: u64, fontId: u32, size: f32): void;

@external("effindom_v2_ui", "ui_set_line_height")
export declare function ui_set_line_height(handle: u64, lineHeight: f32): void;

@external("effindom_v2_ui", "ui_register_font_fallback")
export declare function ui_register_font_fallback(fontId: u32, fallbackFontId: u32): void;

@external("effindom_v2_ui", "ui_set_text_color")
export declare function ui_set_text_color(handle: u64, color: u32): void;

@external("effindom_v2_ui", "ui_set_text_align")
export declare function ui_set_text_align(handle: u64, align: u32): void;

@external("effindom_v2_ui", "ui_set_text_vertical_align")
export declare function ui_set_text_vertical_align(handle: u64, align: u32): void;

@external("effindom_v2_ui", "ui_set_text_limits")
export declare function ui_set_text_limits(handle: u64, maxChars: i32, maxLines: i32): void;

@external("effindom_v2_ui", "ui_set_text_wrapping")
export declare function ui_set_text_wrapping(handle: u64, wrap: bool): void;

@external("effindom_v2_ui", "ui_set_text_overflow")
export declare function ui_set_text_overflow(handle: u64, overflow: u32): void;

@external("effindom_v2_ui", "ui_set_text_overflow_fade")
export declare function ui_set_text_overflow_fade(handle: u64, horizontal: bool, vertical: bool): void;

@external("effindom_v2_ui", "ui_set_text_obscured")
export declare function ui_set_text_obscured(handle: u64, obscured: bool): void;

@external("effindom_v2_ui", "ui_set_editable")
export declare function ui_set_editable(handle: u64, editable: bool): void;

@external("effindom_v2_ui", "ui_set_caret_color")
export declare function ui_set_caret_color(handle: u64, color: u32): void;

@external("effindom_v2_ui", "ui_set_scroll_offset")
export declare function ui_set_scroll_offset(handle: u64, offsetX: f32, offsetY: f32): void;

@external("effindom_v2_ui", "ui_set_scroll_content_size")
export declare function ui_set_scroll_content_size(handle: u64, contentWidth: f32, contentHeight: f32): void;

@external("effindom_v2_ui", "ui_clear_momentum_scroll")
export declare function ui_clear_momentum_scroll(): void;

@external("effindom_v2_ui", "ui_set_selectable")
export declare function ui_set_selectable(handle: u64, selectable: bool, selectionColor: u32): void;

@external("effindom_v2_ui", "ui_set_selection_area")
export declare function ui_set_selection_area(handle: u64, isArea: bool): void;

@external("effindom_v2_ui", "ui_set_selection_area_barrier")
export declare function ui_set_selection_area_barrier(handle: u64, isBarrier: bool): void;

@external("effindom_v2_ui", "ui_clear_selection")
export declare function ui_clear_selection(handle: u64): void;

@external("effindom_v2_ui", "ui_retarget_selection")
export declare function ui_retarget_selection(fromHandle: u64, toHandle: u64): void;

@external("effindom_v2_ui", "ui_is_point_in_selection")
export declare function ui_is_point_in_selection(x: f32, y: f32): bool;

@external("effindom_v2_ui", "ui_set_text_selection_range")
export declare function ui_set_text_selection_range(handle: u64, selectionStart: u32, selectionEnd: u32): void;

@external("effindom_v2_ui", "ui_clear_current_selection")
export declare function ui_clear_current_selection(): void;

@external("effindom_v2_ui", "ui_copy_current_selection")
export declare function ui_copy_current_selection(): void;

@external("effindom_v2_ui", "ui_can_undo_text_edit")
export declare function ui_can_undo_text_edit(handle: u64): bool;

@external("effindom_v2_ui", "ui_can_redo_text_edit")
export declare function ui_can_redo_text_edit(handle: u64): bool;

@external("effindom_v2_ui", "ui_has_text_selection")
export declare function ui_has_text_selection(handle: u64): bool;

@external("effindom_v2_ui", "ui_undo_text_edit")
export declare function ui_undo_text_edit(handle: u64): void;

@external("effindom_v2_ui", "ui_redo_text_edit")
export declare function ui_redo_text_edit(handle: u64): void;

@external("effindom_v2_ui", "ui_copy_text_selection")
export declare function ui_copy_text_selection(handle: u64): void;

@external("effindom_v2_ui", "ui_cut_text_selection")
export declare function ui_cut_text_selection(handle: u64): void;

@external("effindom_v2_ui", "ui_replace_text_range")
export declare function ui_replace_text_range(
  handle: u64,
  start: u32,
  end: u32,
  ptr: usize,
  len: u32,
  caret: u32,
): void;

@external("effindom_v2_ui", "ui_paste_text")
export declare function ui_paste_text(handle: u64): void;

@external("effindom_v2_ui", "ui_select_all_text")
export declare function ui_select_all_text(handle: u64): void;

@external("effindom_v2_ui", "ui_commit_frame")
export declare function ui_commit_frame(): void;

@external("effindom_v2_ui", "ui_get_bounds")
export declare function ui_get_bounds(handle: u64, outX: usize, outY: usize, outWidth: usize, outHeight: usize): bool;

@external("effindom_v2_ui", "ui_resize_window")
export declare function ui_resize_window(width: f32, height: f32): void;

@external("fui_host", "request_render")
export declare function request_render(): void;

@external("fui_host", "get_viewport_width")
export declare function get_viewport_width(): f32;

@external("fui_host", "get_viewport_height")
export declare function get_viewport_height(): f32;

@external("fui_host", "fui_set_pointer_capture")
export declare function fui_set_pointer_capture(handle: u64): void;

@external("fui_host", "fui_release_pointer_capture")
export declare function fui_release_pointer_capture(): void;

@external("fui_host", "fui_reload_page")
export declare function fui_reload_page(): void;

@external("fui_host", "fui_can_navigate_back")
export declare function fui_can_navigate_back(): bool;

@external("fui_host", "fui_can_navigate_forward")
export declare function fui_can_navigate_forward(): bool;

@external("fui_host", "fui_navigate_back")
export declare function fui_navigate_back(): void;

@external("fui_host", "fui_navigate_forward")
export declare function fui_navigate_forward(): void;

@external("fui_host", "fui_copy_text")
export declare function fui_copy_text(ptr: usize, len: u32): void;

@external("fui_host", "fui_has_text_selection_snapshot")
export declare function fui_has_text_selection_snapshot(handle: u64): bool;

@external("fui_host", "fui_freeze_text_selection_snapshot")
export declare function fui_freeze_text_selection_snapshot(handle: u64): void;

@external("fui_host", "fui_copy_text_selection_snapshot")
export declare function fui_copy_text_selection_snapshot(handle: u64): bool;

@external("fui_host", "fui_cut_focused_text_selection")
export declare function fui_cut_focused_text_selection(): bool;

@external("fui_host", "fui_cut_text_selection_snapshot")
export declare function fui_cut_text_selection_snapshot(handle: u64): bool;

@external("fui_host", "fui_cut_text_range_snapshot")
export declare function fui_cut_text_range_snapshot(handle: u64, start: u32, end: u32): bool;

@external("fui_host", "fui_delete_focused_text_range")
export declare function fui_delete_focused_text_range(start: u32, end: u32): bool;

@external("fui_host", "fui_commit_text_action_focus")
export declare function fui_commit_text_action_focus(handle: u64): void;

@external("fui_host", "fui_load_svg")
export declare function fui_load_svg(svgId: u32, ptr: usize, len: u32): void;

@external("fui_host", "fui_load_texture")
export declare function fui_load_texture(textureId: u32, ptr: usize, len: u32): void;

@external("fui_host", "fui_release_svg")
export declare function fui_release_svg(svgId: u32): void;

@external("fui_host", "fui_release_texture")
export declare function fui_release_texture(textureId: u32): void;

@external("fui_host", "fui_bitmap_commit")
export declare function fui_bitmap_commit(textureId: u32, bytesPtr: usize, bytesLen: u32, width: u32, height: u32): void;

@external("fui_host", "fui_bitmap_release")
export declare function fui_bitmap_release(textureId: u32): void;

@external("fui_host", "fui_load_font")
export declare function fui_load_font(fontId: u32, ptr: usize, len: u32): void;

@external("fui_host", "fui_start_timer")
export declare function fui_start_timer(timerId: u32, delayMs: i32): void;

@external("fui_host", "fui_cancel_timer")
export declare function fui_cancel_timer(timerId: u32): void;

@external("fui_host", "fui_now_ms")
export declare function fui_now_ms(): f64;

@external("fui_host", "fui_set_cursor")
export declare function fui_set_cursor(style: u32): void;

@external("fui_host", "fui_is_dark_mode")
export declare function fui_is_dark_mode(): bool;

@external("fui_host", "fui_get_accent_color")
export declare function fui_get_accent_color(): u32;

@external("fui_host", "fui_get_platform_family")
export declare function fui_get_platform_family(): u32;

@external("fui_host", "fui_is_coarse_pointer")
export declare function fui_is_coarse_pointer(): bool;

@external("fui_host", "fui_show_url_preview")
export declare function fui_show_url_preview(ptr: usize, len: u32): void;

@external("fui_host", "fui_hide_url_preview")
export declare function fui_hide_url_preview(): void;

@external("fui_host", "fui_navigate_to")
export declare function fui_navigate_to(ptr: usize, len: u32, openInNewTab: bool): void;

@external("fui_host", "fui_set_persisted_scroll_offset")
export declare function fui_set_persisted_scroll_offset(nodeIdPtr: usize, nodeIdLen: u32, x: f32, y: f32): void;

@external("fui_host", "fui_try_get_persisted_scroll_offset")
export declare function fui_try_get_persisted_scroll_offset(nodeIdPtr: usize, nodeIdLen: u32, outX: usize, outY: usize): bool;

@external("fui_host", "fui_set_persisted_state")
export declare function fui_set_persisted_state(
  nodeIdPtr: usize,
  nodeIdLen: u32,
  kindPtr: usize,
  kindLen: u32,
  version: u32,
  payloadPtr: usize,
  payloadLen: u32,
): void;

@external("fui_host", "fui_copy_persisted_state")
export declare function fui_copy_persisted_state(
  nodeIdPtr: usize,
  nodeIdLen: u32,
  kindPtr: usize,
  kindLen: u32,
  outVersionPtr: usize,
  payloadPtr: usize,
  payloadCapacity: u32,
): i32;

@external("fui_host", "fui_log")
export declare function fui_log(categoryPtr: usize, catLen: u32, msgPtr: usize, msgLen: u32): void;

@external("fui_host", "fui_logs_enabled")
export declare function fui_logs_enabled(): bool;

@external("fui_host", "fui_worker_start_string")
export declare function fui_worker_start_string(workerId: u32, entryPtr: usize, entryLen: u32, inputPtr: usize, inputLen: u32): void;

@external("fui_host", "fui_worker_cancel")
export declare function fui_worker_cancel(workerId: u32): void;

@external("fui_host", "fui_file_capabilities")
export declare function fui_file_capabilities(): u32;

@external("fui_host", "fui_file_pick")
export declare function fui_file_pick(requestId: u32, acceptPtr: usize, acceptLen: u32, multiple: bool): void;

@external("fui_host", "fui_file_read_chunk")
export declare function fui_file_read_chunk(
  requestId: u32,
  fileIdPtr: usize,
  fileIdLen: u32,
  offsetBytes: u64,
  maxBytes: u32,
): void;

@external("fui_host", "fui_file_save_text")
export declare function fui_file_save_text(
  requestId: u32,
  suggestedNamePtr: usize,
  suggestedNameLen: u32,
  mimeTypePtr: usize,
  mimeTypeLen: u32,
  fileExtensionPtr: usize,
  fileExtensionLen: u32,
  textPtr: usize,
  textLen: u32,
): void;

@external("fui_host", "fui_file_save_bytes")
export declare function fui_file_save_bytes(
  requestId: u32,
  suggestedNamePtr: usize,
  suggestedNameLen: u32,
  mimeTypePtr: usize,
  mimeTypeLen: u32,
  fileExtensionPtr: usize,
  fileExtensionLen: u32,
  bytesPtr: usize,
  bytesLen: u32,
): void;

@external("fui_host", "fui_file_create_writer")
export declare function fui_file_create_writer(
  requestId: u32,
  suggestedNamePtr: usize,
  suggestedNameLen: u32,
  mimeTypePtr: usize,
  mimeTypeLen: u32,
  fileExtensionPtr: usize,
  fileExtensionLen: u32,
): void;

@external("fui_host", "fui_file_writer_write_text")
export declare function fui_file_writer_write_text(
  requestId: u32,
  writerIdPtr: usize,
  writerIdLen: u32,
  textPtr: usize,
  textLen: u32,
): void;

@external("fui_host", "fui_file_writer_write_bytes")
export declare function fui_file_writer_write_bytes(
  requestId: u32,
  writerIdPtr: usize,
  writerIdLen: u32,
  bytesPtr: usize,
  bytesLen: u32,
): void;

@external("fui_host", "fui_file_writer_finish")
export declare function fui_file_writer_finish(
  requestId: u32,
  writerIdPtr: usize,
  writerIdLen: u32,
): void;

@external("fui_host", "fui_file_process_worker_start")
export declare function fui_file_process_worker_start(
  requestId: u32,
  fileIdPtr: usize,
  fileIdLen: u32,
  suggestedNamePtr: usize,
  suggestedNameLen: u32,
  chunkBytes: u32,
  saveToPickedFile: bool,
): void;

@external("fui_host", "fui_file_process_worker_cancel")
export declare function fui_file_process_worker_cancel(requestId: u32): void;
