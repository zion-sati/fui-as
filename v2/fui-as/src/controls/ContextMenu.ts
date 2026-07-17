import * as ui from "../bindings/ui";
import { EventRouter, GlobalKeyHandler } from "../core/EventRouter";
import * as ffi from "../core/ffi";
import {
  BorderStyle,
  CursorStyle,
  GridUnit,
  HandleValue,
  KeyEventType,
  PointerEventType,
  SemanticRole,
  TextAlign,
  TextOverflow,
  Unit,
} from "../core/ffi";
import { HandlerAction } from "../core/Action";
import { Disposable, disposeAll } from "../core/Disposable";
import { navigateTo } from "../core/Navigation";
import { Node, PointerButton, PointerEventArgs, PointerType, VisibilityChangedEventArgs } from "../core/Node";
import { Theme, activeTheme } from "../core/Theme";
import { warn } from "../core/Logger";
import { FontFamily, FontStyle, FontWeight } from "../core/Typography";
import { Border, FlexBox, Grid, Portal, TextCore } from "../nodes";
import { PopupPresenter } from "./internal/PopupPresenter";

const MENU_WIDTH: f32 = 220.0;
const MENU_SEPARATOR_HEIGHT: f32 = 9.0;
const MENU_EDGE_PADDING: f32 = 8.0;
const DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA: f32 = 10.0;

function isPrimaryActivationPointer(event: PointerEventArgs): bool {
  return event.button == PointerButton.Primary || event.pointerType == PointerType.Touch || event.pointerType == PointerType.Pen;
}

enum MenuItemKind {
  Action = 0,
  Separator = 1,
}

class ContextMenuEntry extends Grid {
  private readonly labelNode: TextCore = new TextCore("")
    .fontFamily(activeTheme.value.contextMenu.item.fontFamily)
    .fontSize(activeTheme.value.contextMenu.item.fontSize)
    .textColor(activeTheme.value.contextMenu.item.textColor)
    .overflow(TextOverflow.Ellipsis)
    .selectable(false) as TextCore;
  private readonly shortcutNode: TextCore = new TextCore("")
    .fontFamily(activeTheme.value.contextMenu.item.fontFamily)
    .fontSize(activeTheme.value.contextMenu.item.fontSize)
    .textColor(activeTheme.value.colors.textMuted)
    .textAlign(TextAlign.Left)
    .selectable(false) as TextCore;
  private readonly slot: i32;
  private hovered: bool = false;
  private pressed: bool = false;
  private disabled: bool = false;
  private itemHeightValue: f32 = activeTheme.value.contextMenu.item.height;
  private paddingLeftValue: f32 = activeTheme.value.contextMenu.item.paddingLeft;
  private paddingTopValue: f32 = activeTheme.value.contextMenu.item.paddingTop;
  private paddingRightValue: f32 = activeTheme.value.contextMenu.item.paddingRight;
  private paddingBottomValue: f32 = activeTheme.value.contextMenu.item.paddingBottom;
  private cornerRadiusValue: f32 = activeTheme.value.contextMenu.item.cornerRadius;
  private textColorValue: u32 = activeTheme.value.contextMenu.item.textColor;
  private shortcutTextColorValue: u32 = activeTheme.value.colors.textMuted;
  private backgroundColorValue: u32 = activeTheme.value.contextMenu.item.background;
  private hoverBackgroundColorValue: u32 = activeTheme.value.contextMenu.item.hoverBackground;
  private fontFamilyValue: FontFamily = activeTheme.value.contextMenu.item.fontFamily;
  private fontSizeValue: f32 = activeTheme.value.contextMenu.item.fontSize;
  private fontWeightValue: FontWeight = FontWeight.Regular;
  private fontStyleValue: FontStyle = FontStyle.Normal;

  constructor(slot: i32) {
    super();
    this.slot = slot;
    this.width(100.0, Unit.Percent);
    this.height(this.itemHeightValue, Unit.Pixel);
    this.padding(this.paddingLeftValue, this.paddingTopValue, this.paddingRightValue, this.paddingBottomValue);
    this.cursor(CursorStyle.Pointer);
    this.semanticRole(SemanticRole.Button);
    this.requireInteractive();

    const columnValues = new Array<f32>();
    columnValues.push(1.0);
    columnValues.push(0.0);
    const columnTypes = new Array<GridUnit>();
    columnTypes.push(GridUnit.Star);
    columnTypes.push(GridUnit.Auto);
    const rowValues = new Array<f32>();
    rowValues.push(1.0);
    const rowTypes = new Array<GridUnit>();
    rowTypes.push(GridUnit.Star);

    this.columns(2, columnValues, columnTypes);
    this.rows(1, rowValues, rowTypes);
    this.columnSharedSizeGroup(1, "ContextMenuShortcutColumn");

    this.placeChild(this.labelNode, 0, 0);
    this.placeChild(this.shortcutNode, 0, 1);
    this.applyTheme();
  }

  item(item: MenuItem): this {
    this.hovered = false;
    this.pressed = false;
    this.disabled = item.disabled;
    this.semanticLabel(item.label);
    this.semanticDisabled(this.disabled);
    this.cursor(this.disabled ? CursorStyle.Default : CursorStyle.Pointer);
    this.shortcutNode.text(item.shortcutLabel !== null ? changetype<string>(item.shortcutLabel) : "");
    this.labelNode.text(item.label);
    return this;
  }

  configureStyle(
    itemHeight: f32,
    paddingLeft: f32,
    paddingTop: f32,
    paddingRight: f32,
    paddingBottom: f32,
    cornerRadius: f32,
    textColor: u32,
    backgroundColor: u32,
    hoverBackgroundColor: u32,
    fontFamily: FontFamily,
    fontSize: f32,
    fontWeight: FontWeight,
    fontStyle: FontStyle,
  ): void {
    this.itemHeightValue = itemHeight;
    this.paddingLeftValue = paddingLeft;
    this.paddingTopValue = paddingTop;
    this.paddingRightValue = paddingRight;
    this.paddingBottomValue = paddingBottom;
    this.cornerRadiusValue = cornerRadius;
    this.textColorValue = textColor;
    this.backgroundColorValue = backgroundColor;
    this.hoverBackgroundColorValue = hoverBackgroundColor;
    this.fontFamilyValue = fontFamily;
    this.fontSizeValue = fontSize;
    this.fontWeightValue = fontWeight;
    this.fontStyleValue = fontStyle;
    this.applyTheme();
  }

  applyTheme(): void {
    this.height(this.itemHeightValue, Unit.Pixel);
    this.padding(this.paddingLeftValue, this.paddingTopValue, this.paddingRightValue, this.paddingBottomValue);
    this.corners(this.cornerRadiusValue, this.cornerRadiusValue, this.cornerRadiusValue, this.cornerRadiusValue);
    this.bgColor(this.hovered && !this.disabled ? this.hoverBackgroundColorValue : this.backgroundColorValue);
    this.labelNode
      .fontFamily(this.fontFamilyValue)
      .fontWeight(this.fontWeightValue)
      .fontStyle(this.fontStyleValue)
      .fontSize(this.fontSizeValue);
    this.shortcutNode
      .fontFamily(this.fontFamilyValue)
      .fontWeight(this.fontWeightValue)
      .fontStyle(this.fontStyleValue)
      .fontSize(this.fontSizeValue);
    this.shortcutTextColorValue = activeTheme.value.colors.textMuted;
    this.labelNode.textColor(this.disabled ? this.shortcutTextColorValue : this.textColorValue);
    this.shortcutNode.textColor(this.shortcutTextColorValue);
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    if (eventType == PointerEventType.Enter) {
      this.hovered = !this.disabled;
      this.applyTheme();
      return;
    }
    if (eventType == PointerEventType.Leave) {
      this.hovered = false;
      this.pressed = false;
      this.applyTheme();
      return;
    }
    if (eventType == PointerEventType.Down) {
      this.pressed = !this.disabled;
      return;
    }
    if (eventType == PointerEventType.Up) {
      const shouldInvoke = this.pressed &&
        this.hovered &&
        !this.disabled;
      this.pressed = false;
      if (shouldInvoke) {
        ContextMenu.invokeActiveSlot(this.slot);
      }
      return;
    }
    if (eventType == PointerEventType.Cancel) {
      this.pressed = false;
      return;
    }
    super._handlePointerEvent(eventType, x, y, modifiers);
  }
}

class ContextMenuSeparator extends FlexBox {
  private readonly line: FlexBox = new FlexBox()
    .width(100.0, Unit.Percent)
    .height(1.0, Unit.Pixel) as FlexBox;
  private lineColorValue: u32 = activeTheme.value.contextMenu.separatorColor;

  constructor() {
    super();
    this.width(100.0, Unit.Percent);
    this.height(MENU_SEPARATOR_HEIGHT, Unit.Pixel);
    this.padding(0.0, 4.0, 0.0, 4.0);
    this.child(this.line);
    this.applyTheme();
  }

  configureStyle(color: u32): void {
    this.lineColorValue = color;
    this.applyTheme();
  }

  applyTheme(): void {
    this.line.bgColor(this.lineColorValue);
  }
}

export enum ContextMenuAction {
  CopyCurrentSelection = 0,
  ReloadPage = 1,
  OpenLink = 2,
  OpenLinkInNewTab = 3,
  NavigateBack = 4,
  NavigateForward = 5,
  UndoTextEdit = 6,
  RedoTextEdit = 7,
  CutTextSelection = 8,
  PasteText = 9,
  SelectAllText = 10,
  OpenImage = 11,
  OpenImageInNewTab = 12,
}

export class MenuItem {
  readonly label: string;
  readonly action: ContextMenuAction;
  readonly payload: string | null;
  readonly shortcutLabel: string | null;
  readonly disabled: bool;
  readonly targetHandle: u64;
  readonly focusTargetAfterAction: bool;
  selectionStart: u32;
  selectionEnd: u32;
  private readonly kindValue: MenuItemKind;

  constructor(
    label: string,
    action: ContextMenuAction,
    payload: string | null = null,
    kind: MenuItemKind = MenuItemKind.Action,
    shortcutLabel: string | null = null,
    disabled: bool = false,
    targetHandle: u64 = <u64>HandleValue.Invalid,
    selectionStart: u32 = 0,
    selectionEnd: u32 = 0,
    focusTargetAfterAction: bool = false,
  ) {
    this.label = label;
    this.action = action;
    this.payload = payload;
    this.kindValue = kind;
    this.shortcutLabel = shortcutLabel;
    this.disabled = disabled;
    this.targetHandle = targetHandle;
    this.focusTargetAfterAction = focusTargetAfterAction;
    this.selectionStart = selectionStart;
    this.selectionEnd = selectionEnd;
  }

  withSelectionRange(start: u32, end: u32): MenuItem {
    this.selectionStart = start;
    this.selectionEnd = end;
    return this;
  }

  static separator(): MenuItem {
    return new MenuItem("", ContextMenuAction.ReloadPage, null, MenuItemKind.Separator);
  }

  get isSeparator(): bool {
    return this.kindValue == MenuItemKind.Separator;
  }
}

function writePayloadToClipboard(text: string): void {
  const bytes = Uint8Array.wrap(String.UTF8.encode(text, false));
  ffi.fui_copy_text(bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

function commitFocusedTextAction(handle: u64): void {
  ffi.fui_commit_text_action_focus(handle);
}

function commitFocusedTextActionIfNeeded(item: MenuItem): void {
  if (item.focusTargetAfterAction && item.targetHandle != <u64>HandleValue.Invalid) {
    commitFocusedTextAction(item.targetHandle);
  }
}

export function runContextMenuAction(item: MenuItem): void {
  if (item.disabled) {
    const actionNeedsLiveSelection =
      item.targetHandle != <u64>HandleValue.Invalid &&
      (item.action == ContextMenuAction.CopyCurrentSelection || item.action == ContextMenuAction.CutTextSelection) &&
      (ffi.fui_has_text_selection_snapshot(item.targetHandle) || ui.hasTextSelection(item.targetHandle));
    if (!actionNeedsLiveSelection) {
      return;
    }
  }
  if (item.action == ContextMenuAction.CopyCurrentSelection) {
    if (item.payload !== null) {
      writePayloadToClipboard(changetype<string>(item.payload));
      commitFocusedTextActionIfNeeded(item);
      return;
    }
    if (item.targetHandle != <u64>HandleValue.Invalid && ffi.fui_copy_text_selection_snapshot(item.targetHandle)) {
      commitFocusedTextActionIfNeeded(item);
      return;
    }
    if (item.targetHandle != <u64>HandleValue.Invalid) {
      ui.copyTextSelection(item.targetHandle);
      commitFocusedTextActionIfNeeded(item);
      return;
    }
    ui.copyCurrentSelection();
    return;
  }
  if (item.targetHandle != <u64>HandleValue.Invalid && item.action == ContextMenuAction.UndoTextEdit) {
    ui.undoTextEdit(item.targetHandle);
    commitFocusedTextActionIfNeeded(item);
    return;
  }
  if (item.targetHandle != <u64>HandleValue.Invalid && item.action == ContextMenuAction.RedoTextEdit) {
    ui.redoTextEdit(item.targetHandle);
    commitFocusedTextActionIfNeeded(item);
    return;
  }
  if (item.targetHandle != <u64>HandleValue.Invalid && item.action == ContextMenuAction.CutTextSelection) {
    if (item.payload !== null) {
      writePayloadToClipboard(changetype<string>(item.payload));
    }
    if (item.selectionStart != item.selectionEnd && ffi.fui_cut_text_selection_snapshot(item.targetHandle)) {
      commitFocusedTextActionIfNeeded(item);
      return;
    }
    if (ffi.fui_cut_text_selection_snapshot(item.targetHandle)) {
      commitFocusedTextActionIfNeeded(item);
      return;
    }
    if (
      item.selectionStart != item.selectionEnd &&
      ffi.fui_delete_focused_text_range(item.selectionStart, item.selectionEnd)
    ) {
      commitFocusedTextActionIfNeeded(item);
      return;
    }
    if (ffi.fui_cut_focused_text_selection()) {
      commitFocusedTextActionIfNeeded(item);
      return;
    }
    if (item.payload === null) {
      ffi.fui_copy_text_selection_snapshot(item.targetHandle);
    }
    ui.cutTextSelection(item.targetHandle);
    commitFocusedTextActionIfNeeded(item);
    return;
  }
  if (item.targetHandle != <u64>HandleValue.Invalid && item.action == ContextMenuAction.PasteText) {
    ui.pasteText(item.targetHandle);
    commitFocusedTextActionIfNeeded(item);
    return;
  }
  if (item.targetHandle != <u64>HandleValue.Invalid && item.action == ContextMenuAction.SelectAllText) {
    ui.selectAllText(item.targetHandle);
    commitFocusedTextActionIfNeeded(item);
    return;
  }
  if (item.action == ContextMenuAction.ReloadPage) {
    ffi.fui_reload_page();
    return;
  }
  if (item.action == ContextMenuAction.NavigateBack) {
    ffi.fui_navigate_back();
    return;
  }
  if (item.action == ContextMenuAction.NavigateForward) {
    ffi.fui_navigate_forward();
    return;
  }
  if (item.payload !== null && item.action == ContextMenuAction.OpenLink) {
    navigateTo(changetype<string>(item.payload), false);
    return;
  }
  if (item.payload !== null && item.action == ContextMenuAction.OpenLinkInNewTab) {
    navigateTo(changetype<string>(item.payload), true);
    return;
  }
  if (item.payload !== null && item.action == ContextMenuAction.OpenImage) {
    navigateTo(changetype<string>(item.payload), false);
    return;
  }
  if (item.payload !== null && item.action == ContextMenuAction.OpenImageInNewTab) {
    navigateTo(changetype<string>(item.payload), true);
  }
}

export class ContextMenu extends Portal implements GlobalKeyHandler {
  static readonly MAX_ITEMS: i32 = 25;
  private static activeInstance: ContextMenu | null = null;

  private readonly panel: FlexBox = new FlexBox()
    .positionAbsolute()
    .width(MENU_WIDTH, Unit.Pixel)
    .padding(4.0, 4.0, 4.0, 4.0)
    .border(1.0, activeTheme.value.contextMenu.panelBorderColor) as FlexBox;
  private readonly popupPresenter!: PopupPresenter;
  private readonly entries: Array<ContextMenuEntry> = new Array<ContextMenuEntry>();
  private readonly separators: Array<ContextMenuSeparator> = new Array<ContextMenuSeparator>();
  private readonly itemsValue: Array<MenuItem> = new Array<MenuItem>();
  private readonly currentItems: Array<MenuItem> = new Array<MenuItem>();
  private readonly currentItemTops: Array<f32> = new Array<f32>();
  private readonly currentItemHeights: Array<f32> = new Array<f32>();
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private isMenuVisible: bool = false;
  private suppressNextPointerUpActivation: bool = false;
  private keyFilterToken: u32 = 0;
  private menuWidthValue: f32 = MENU_WIDTH;
  private itemHeightValue: f32 = activeTheme.value.contextMenu.item.height;
  private itemPaddingLeftValue: f32 = activeTheme.value.contextMenu.item.paddingLeft;
  private itemPaddingTopValue: f32 = activeTheme.value.contextMenu.item.paddingTop;
  private itemPaddingRightValue: f32 = activeTheme.value.contextMenu.item.paddingRight;
  private itemPaddingBottomValue: f32 = activeTheme.value.contextMenu.item.paddingBottom;
  private itemCornerRadiusValue: f32 = activeTheme.value.contextMenu.item.cornerRadius;
  private itemTextColorValue: u32 = activeTheme.value.contextMenu.item.textColor;
  private itemBackgroundColorValue: u32 = activeTheme.value.contextMenu.item.background;
  private itemHoverColorValue: u32 = activeTheme.value.contextMenu.item.hoverBackground;
  private itemFontFamilyValue: FontFamily = activeTheme.value.contextMenu.item.fontFamily;
  private itemFontSizeValue: f32 = activeTheme.value.contextMenu.item.fontSize;
  private itemFontWeightValue: FontWeight = FontWeight.Regular;
  private itemFontStyleValue: FontStyle = FontStyle.Normal;
  private panelBackgroundColorValue: u32 = activeTheme.value.contextMenu.panelBackground;
  private panelBorderWidthValue: f32 = 1.0;
  private panelBorderColorValue: u32 = activeTheme.value.contextMenu.panelBorderColor;
  private panelBorderStyleValue: BorderStyle = BorderStyle.Solid;
  private panelCornerRadiusValue: f32 = activeTheme.value.contextMenu.panelCornerRadius;
  private separatorColorValue: u32 = activeTheme.value.contextMenu.separatorColor;
  private panelShadowColorValue: u32 = activeTheme.value.contextMenu.panelShadowColor;
  private panelShadowOffsetYValue: f32 = activeTheme.value.contextMenu.shadowOffsetY;
  private panelShadowBlurValue: f32 = activeTheme.value.contextMenu.shadowBlur;
  private panelShadowSpreadValue: f32 = activeTheme.value.contextMenu.shadowSpread;
  private panelBackgroundBlurSigmaValue: f32 = DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA;
  private panelBackgroundOverridden: bool = false;
  private panelBorderOverridden: bool = false;
  private panelCornerRadiusOverridden: bool = false;
  private itemTextColorOverridden: bool = false;
  private itemBackgroundOverridden: bool = false;
  private itemHoverColorOverridden: bool = false;
  private itemCornerRadiusOverridden: bool = false;
  private itemFontOverridden: bool = false;
  private separatorColorOverridden: bool = false;
  private panelShadowOverridden: bool = false;
  private panelBackgroundBlurOverridden: bool = false;
  private itemMetricsOverridden: bool = false;
  private visibilityChangedCallback: ((event: VisibilityChangedEventArgs) => void) | null = null;

  constructor(items: Array<MenuItem> | null = null) {
    super();
    this.popupPresenter = new PopupPresenter(this, this.panel);

    this.positionAbsolute();
    this.position(0.0, 0.0);
    this.width(100.0, Unit.Percent);
    this.height(100.0, Unit.Percent);

    this.popupPresenter.overlayNode.onPointerUpWith(this, (menu, event: PointerEventArgs): void => {
      menu.handleOverlayPointerUp(event);
    });
    Grid.sharedSizeScope(this.panel, true);

    for (let index = 0; index < ContextMenu.MAX_ITEMS; ++index) {
      this.entries.push(new ContextMenuEntry(index));
      this.separators.push(new ContextMenuSeparator());
    }
    if (items !== null) {
      this.items(changetype<Array<MenuItem>>(items));
    }
    this.applyTheme();
    this.track(activeTheme.addAction(new HandlerAction<ContextMenu, Theme>(this, (menu: ContextMenu, _theme: Theme): void => {
      menu.handleThemeChanged();
    })));
  }

  build(): u64 {
    const handle = super.build();
    for (let index = 0; index < this.entries.length; ++index) {
      unchecked(this.entries[index]).build();
      unchecked(this.separators[index]).build();
    }
    return handle;
  }

  static hideActiveMenu(): void {
    const menu = ContextMenu.activeInstance;
    if (menu !== null) {
      menu.hide();
    }
  }

  static invokeActiveSlot(slot: i32): void {
    const menu = ContextMenu.activeInstance;
    if (menu !== null) {
      menu.invokeSlot(slot);
    }
  }

  static consumeOpeningPointerUpSuppression(): bool {
    const menu = ContextMenu.activeInstance;
    if (menu === null || !menu.suppressNextPointerUpActivation) {
      return false;
    }
    menu.suppressNextPointerUpActivation = false;
    return true;
  }

  menuWidth(value: f32): this {
    if (value <= 0.0) {
      warn("Layout", "ContextMenu.menuWidth() received " + value.toString() + "; clamping to 1.0.");
    }
    this.menuWidthValue = value > 0.0 ? value : 1.0;
    this.applyTheme();
    return this;
  }

  itemHeight(value: f32): this {
    this.itemMetricsOverridden = true;
    if (value <= 0.0) {
      warn("Layout", "ContextMenu.itemHeight() received " + value.toString() + "; clamping to 1.0.");
    }
    this.itemHeightValue = value > 0.0 ? value : 1.0;
    this.applyTheme();
    return this;
  }

  itemPadding(left: f32, top: f32 = left, right: f32 = left, bottom: f32 = top): this {
    this.itemMetricsOverridden = true;
    this.itemPaddingLeftValue = left;
    this.itemPaddingTopValue = top;
    this.itemPaddingRightValue = right;
    this.itemPaddingBottomValue = bottom;
    this.applyTheme();
    return this;
  }

  onVisibilityChanged(callback: ((event: VisibilityChangedEventArgs) => void) | null): this {
    this.visibilityChangedCallback = callback;
    return this;
  }

  panelColor(color: u32): this {
    this.panelBackgroundOverridden = true;
    this.panelBackgroundColorValue = color;
    this.applyTheme();
    return this;
  }

  panelBorder(width: f32, color: u32): this {
    this.panelBorderOverridden = true;
    this.panelBorderWidthValue = width;
    this.panelBorderColorValue = color;
    this.panelBorderStyleValue = BorderStyle.Solid;
    this.applyTheme();
    return this;
  }

  panelBorderConfig(border: Border): this {
    this.panelBorderOverridden = true;
    this.panelBorderWidthValue = border.width;
    this.panelBorderColorValue = border.color;
    this.panelBorderStyleValue = border.style;
    this.applyTheme();
    return this;
  }

  panelCornerRadius(radius: f32): this {
    this.panelCornerRadiusOverridden = true;
    this.panelCornerRadiusValue = radius > 0.0 ? radius : 0.0;
    this.applyTheme();
    return this;
  }

  panelShadow(color: u32, offsetY: f32 = 12.0, blurSigma: f32 = 28.0, spread: f32 = 0.0): this {
    this.panelShadowOverridden = true;
    this.panelShadowColorValue = color;
    this.panelShadowOffsetYValue = offsetY;
    this.panelShadowBlurValue = blurSigma;
    this.panelShadowSpreadValue = spread;
    this.applyTheme();
    return this;
  }

  panelBackgroundBlur(sigma: f32): this {
    this.panelBackgroundBlurOverridden = true;
    if (sigma < 0.0) {
      warn("Layout", "ContextMenu.panelBackgroundBlur() received " + sigma.toString() + "; clamping to 0.0.");
    }
    this.panelBackgroundBlurSigmaValue = sigma >= 0.0 ? sigma : 0.0;
    this.applyTheme();
    return this;
  }

  backdropColor(color: u32): this {
    this.popupPresenter.backdropColor(color);
    return this;
  }

  backgroundBlur(sigma: f32): this {
    this.popupPresenter.backgroundBlur(sigma);
    return this;
  }

  itemColor(color: u32): this {
    this.itemBackgroundOverridden = true;
    this.itemBackgroundColorValue = color;
    this.applyTheme();
    return this;
  }

  itemHoverColor(color: u32): this {
    this.itemHoverColorOverridden = true;
    this.itemHoverColorValue = color;
    this.applyTheme();
    return this;
  }

  itemTextColor(color: u32): this {
    this.itemTextColorOverridden = true;
    this.itemTextColorValue = color;
    this.applyTheme();
    return this;
  }

  itemCornerRadius(radius: f32): this {
    this.itemCornerRadiusOverridden = true;
    this.itemCornerRadiusValue = radius > 0.0 ? radius : 0.0;
    this.applyTheme();
    return this;
  }

  itemFontFamily(family: FontFamily): this {
    this.itemFontOverridden = true;
    this.itemFontFamilyValue = family;
    this.applyTheme();
    return this;
  }

  itemFontWeight(weight: FontWeight): this {
    this.itemFontOverridden = true;
    this.itemFontWeightValue = weight;
    this.applyTheme();
    return this;
  }

  itemFontStyle(style: FontStyle): this {
    this.itemFontOverridden = true;
    this.itemFontStyleValue = style;
    this.applyTheme();
    return this;
  }

  itemFontSize(size: f32): this {
    this.itemFontOverridden = true;
    this.itemFontSizeValue = size;
    this.applyTheme();
    return this;
  }

  separatorColor(color: u32): this {
    this.separatorColorOverridden = true;
    this.separatorColorValue = color;
    this.applyTheme();
    return this;
  }

  items(items: Array<MenuItem>): this {
    this.itemsValue.length = 0;
    for (let index = 0; index < items.length; ++index) {
      this.itemsValue.push(unchecked(items[index]));
    }
    return this;
  }

  clearItems(): this {
    this.itemsValue.length = 0;
    return this;
  }

  show(target: Node | null, x: f32, y: f32): void {
    this.showImpl(target, x, y, false);
  }

  showFromContextPointer(target: Node | null, x: f32, y: f32): void {
    this.showImpl(target, x, y, true);
  }

  private showImpl(target: Node | null, x: f32, y: f32, suppressOpeningPointerUp: bool): void {
    let absoluteX = x;
    let absoluteY = y;
    if (target !== null) {
      const bounds = changetype<Node>(target).getBounds();
      absoluteX += unchecked(bounds[0]);
      absoluteY += unchecked(bounds[1]);
    }

    this.clearPanel();
    this.applyTheme();

    this.currentItems.length = 0;
    this.currentItemTops.length = 0;
    this.currentItemHeights.length = 0;
    let actionCount = 0;
    let separatorCount = 0;
    let estimatedHeight: f32 = 8.0;
    let contentY: f32 = 0.0;
    let lastWasSeparator = true;
    const items = this.itemsValue;
    const count = items.length < ContextMenu.MAX_ITEMS ? items.length : ContextMenu.MAX_ITEMS;
    if (items.length > ContextMenu.MAX_ITEMS) {
      warn(
        "Layout",
        "ContextMenu.show() received " +
          items.length.toString() +
          " items; truncating to " +
          ContextMenu.MAX_ITEMS.toString() +
          ".",
      );
    }

    for (let index = 0; index < count; ++index) {
      const item = unchecked(items[index]);
      if (item.isSeparator) {
        if (lastWasSeparator || index == count - 1) {
          continue;
        }
        const separator = unchecked(this.separators[separatorCount]);
        separator.applyTheme();
        this.panel.addChildNode(separator);
        separatorCount += 1;
        estimatedHeight += MENU_SEPARATOR_HEIGHT;
        contentY += MENU_SEPARATOR_HEIGHT;
        lastWasSeparator = true;
        continue;
      }

      const entry = unchecked(this.entries[actionCount]);
      entry.item(item);
      entry.applyTheme();
      this.currentItems.push(item);
      this.currentItemTops.push(contentY);
      this.currentItemHeights.push(this.itemHeightValue);
      this.panel.addChildNode(entry);
      actionCount += 1;
      estimatedHeight += this.itemHeightValue;
      contentY += this.itemHeightValue;
      lastWasSeparator = false;
    }

    const maxX = <f32>Math.max(0.0, ui.getViewportWidth() - this.menuWidthValue - MENU_EDGE_PADDING);
    const maxY = <f32>Math.max(0.0, ui.getViewportHeight() - estimatedHeight - MENU_EDGE_PADDING);
    const clampedX = <f32>Math.max(MENU_EDGE_PADDING, Math.min(absoluteX, maxX));
    const clampedY = <f32>Math.max(MENU_EDGE_PADDING, Math.min(absoluteY, maxY));

    this.popupPresenter.showAtPoint(clampedX, clampedY, this.menuWidthValue, estimatedHeight);
    this.isMenuVisible = true;
    this.suppressNextPointerUpActivation = suppressOpeningPointerUp;
    ContextMenu.activeInstance = this;
    const visibilityChangedCallback = this.visibilityChangedCallback;
    if (visibilityChangedCallback !== null) {
      visibilityChangedCallback(new VisibilityChangedEventArgs(true));
    }
    if (this.keyFilterToken == 0) {
      this.keyFilterToken = EventRouter.pushKeyFilter(this);
    }
  }

  hide(): void {
    if (!this.isMenuVisible && !this.popupPresenter.isOpen) {
      return;
    }
    this.clearPanel();
    this.currentItems.length = 0;
    this.currentItemTops.length = 0;
    this.currentItemHeights.length = 0;
    this.popupPresenter.hide();
    this.isMenuVisible = false;
    if (ContextMenu.activeInstance === this) {
      ContextMenu.activeInstance = null;
    }
    const visibilityChangedCallback = this.visibilityChangedCallback;
    if (visibilityChangedCallback !== null) {
      visibilityChangedCallback(new VisibilityChangedEventArgs(false));
    }
    if (this.keyFilterToken != 0) {
      EventRouter.removeKeyFilter(this.keyFilterToken);
      this.keyFilterToken = 0;
    }
  }

  dispose(): void {
    this.hide();
    disposeAll(this.disposables);
    this.popupPresenter.dispose();
    for (let index = 0; index < this.entries.length; ++index) {
      const entry = unchecked(this.entries[index]);
      if (entry.builtHandle != <u64>HandleValue.Invalid) {
        entry.dispose();
      }
      const separator = unchecked(this.separators[index]);
      if (separator.builtHandle != <u64>HandleValue.Invalid) {
        separator.dispose();
      }
    }
    super.dispose();
  }

  private clearPanel(): void {
    for (let index = 0; index < this.entries.length; ++index) {
      this.panel.removeChildNode(unchecked(this.entries[index]));
      this.panel.removeChildNode(unchecked(this.separators[index]));
    }
  }

  private invokeSlot(slot: i32): void {
    if (slot < 0 || slot >= this.currentItems.length) {
      return;
    }
    runContextMenuAction(unchecked(this.currentItems[slot]));
    this.hide();
  }

  private handleOverlayPointerUp(event: PointerEventArgs): void {
    if (!this.isMenuVisible) {
      return;
    }
    if (!isPrimaryActivationPointer(event)) {
      if (ContextMenu.consumeOpeningPointerUpSuppression()) {
        event.handled = true;
        return;
      }
      event.handled = true;
      return;
    }
    for (let slot = 0; slot < this.currentItems.length; ++slot) {
      const entry = unchecked(this.entries[slot]);
      if (entry.builtHandle == <u64>HandleValue.Invalid) {
        continue;
      }
      const bounds = entry.getBounds();
      const left = unchecked(bounds[0]);
      const top = unchecked(bounds[1]);
      const right = left + unchecked(bounds[2]);
      const bottom = top + unchecked(bounds[3]);
      if (event.sceneX >= left && event.sceneX <= right && event.sceneY >= top && event.sceneY <= bottom) {
        event.handled = true;
        this.invokeSlot(slot);
        return;
      }
    }
    const localX = event.sceneX - this.popupPresenter.surfaceX;
    const localY = event.sceneY - this.popupPresenter.surfaceY;
    if (localX < 0.0 || localX > this.menuWidthValue || localY < 0.0) {
      event.handled = true;
      this.hide();
      return;
    }
    for (let slot = 0; slot < this.currentItems.length; ++slot) {
      const top = unchecked(this.currentItemTops[slot]);
      const height = unchecked(this.currentItemHeights[slot]);
      if (localY >= top && localY <= top + height) {
        event.handled = true;
        this.invokeSlot(slot);
        return;
      }
    }
    event.handled = true;
    this.hide();
  }

  private applyTheme(): void {
    this.panel.width(this.menuWidthValue, Unit.Pixel);
    this.panel.bgColor(this.panelBackgroundColorValue);
    this.panel.backgroundBlur(this.panelBackgroundBlurSigmaValue);
    this.panel.cornerRadius(this.panelCornerRadiusValue);
    this.panel.borderConfig(new Border(this.panelBorderWidthValue, this.panelBorderColorValue, this.panelBorderStyleValue));
    this.panel.dropShadow(
      this.panelShadowColorValue,
      0.0,
      this.panelShadowOffsetYValue,
      this.panelShadowBlurValue,
      this.panelShadowSpreadValue,
    );
    for (let index = 0; index < this.entries.length; ++index) {
      unchecked(this.entries[index]).configureStyle(
        this.itemHeightValue,
        this.itemPaddingLeftValue,
        this.itemPaddingTopValue,
        this.itemPaddingRightValue,
        this.itemPaddingBottomValue,
        this.itemCornerRadiusValue,
        this.itemTextColorValue,
        this.itemBackgroundColorValue,
        this.itemHoverColorValue,
        this.itemFontFamilyValue,
        this.itemFontSizeValue,
        this.itemFontWeightValue,
        this.itemFontStyleValue,
      );
      unchecked(this.separators[index]).configureStyle(this.separatorColorValue);
    }
  }

  private handleThemeChanged(): void {
    const theme = activeTheme.value;
    if (!this.panelBackgroundOverridden) {
      this.panelBackgroundColorValue = theme.colors.surface;
    }
    if (!this.panelBorderOverridden) {
      this.panelBorderWidthValue = 1.0;
      this.panelBorderColorValue = theme.colors.border;
      this.panelBorderStyleValue = BorderStyle.Solid;
    }
    if (!this.panelCornerRadiusOverridden) {
      this.panelCornerRadiusValue = theme.contextMenu.panelCornerRadius;
    }
    if (!this.itemTextColorOverridden) {
      this.itemTextColorValue = theme.contextMenu.item.textColor;
    }
    if (!this.itemBackgroundOverridden) {
      this.itemBackgroundColorValue = theme.contextMenu.item.background;
    }
    if (!this.itemHoverColorOverridden) {
      this.itemHoverColorValue = theme.contextMenu.item.hoverBackground;
    }
    if (!this.itemCornerRadiusOverridden) {
      this.itemCornerRadiusValue = theme.contextMenu.item.cornerRadius;
    }
    if (!this.itemFontOverridden) {
      this.itemFontFamilyValue = theme.contextMenu.item.fontFamily;
      this.itemFontSizeValue = theme.contextMenu.item.fontSize;
      this.itemFontWeightValue = FontWeight.Regular;
      this.itemFontStyleValue = FontStyle.Normal;
    }
    if (!this.separatorColorOverridden) {
      this.separatorColorValue = theme.contextMenu.separatorColor;
    }
    if (!this.panelShadowOverridden) {
      this.panelShadowColorValue = theme.contextMenu.panelShadowColor;
      this.panelShadowOffsetYValue = theme.contextMenu.shadowOffsetY;
      this.panelShadowBlurValue = theme.contextMenu.shadowBlur;
      this.panelShadowSpreadValue = theme.contextMenu.shadowSpread;
    }
    if (!this.panelBackgroundBlurOverridden) {
      this.panelBackgroundBlurSigmaValue = DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA;
    }
    if (!this.itemMetricsOverridden) {
      this.itemHeightValue = theme.contextMenu.item.height;
      this.itemPaddingLeftValue = theme.contextMenu.item.paddingLeft;
      this.itemPaddingTopValue = theme.contextMenu.item.paddingTop;
      this.itemPaddingRightValue = theme.contextMenu.item.paddingRight;
      this.itemPaddingBottomValue = theme.contextMenu.item.paddingBottom;
    }
    if (!this.panelBackgroundOverridden) {
      this.panelBackgroundColorValue = theme.contextMenu.panelBackground;
    }
    if (!this.panelBorderOverridden) {
      this.panelBorderWidthValue = 1.0;
      this.panelBorderColorValue = theme.contextMenu.panelBorderColor;
      this.panelBorderStyleValue = BorderStyle.Solid;
    }
    this.applyTheme();
  }

  handleGlobalKeyEvent(eventType: KeyEventType, key: string, _modifiers: u32): bool {
    if (eventType == KeyEventType.Down && key == "Escape") {
      this.hide();
      return true;
    }
    return false;
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }
}
