import { FlexBox, Portal, ScrollBarVisibility, ScrollBox, TextCore } from "../nodes";
import { ContextMenuAction, MenuItem, runContextMenuAction } from "../controls/ContextMenu";
import { TextInputCore } from "../controls/internal/TextInputCore";
import { PointerClickEventArgs, Node, PointerEventArgs } from "./Node";
import {
  AlignItems,
  FlexDirection,
  HandleValue,
  JustifyContent,
  PointerEventType,
  SemanticRole,
  TextOverflow,
  Unit,
  Visibility,
} from "./ffi";
import { activeTheme } from "./Theme";
import * as ui from "../bindings/ui";

const TOOLBAR_MARGIN: f32 = 8.0;
const EDGE_MARGIN: f32 = 8.0;
const READONLY_BUTTON_WIDTH: f32 = 96.0;
const EDITABLE_BUTTON_WIDTH: f32 = 72.0;
const OVERFLOW_BUTTON_WIDTH: f32 = 44.0;
const VERTICAL_MENU_WIDTH: f32 = 168.0;
const VERTICAL_MENU_MAX_HEIGHT: f32 = 184.0;
const TOOLBAR_HORIZONTAL_PADDING: f32 = 4.0;
const MAX_HORIZONTAL_ACTIONS: i32 = 3;
const OVERFLOW_SLOT: i32 = -1;
const BACK_SLOT: i32 = -2;
const OVERFLOW_LABEL = "More";

function handleFirstButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(0);
}

function handleSecondButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(1);
}

function handleThirdButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(2);
}

function handleFourthButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(3);
}

function handleFifthButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(4);
}

function handleSixthButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(5);
}

function handleOverflowButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(OVERFLOW_SLOT);
}

function handleBackButtonClick(_event: PointerClickEventArgs): void {
  MobileTextSelectionToolbarManager.activateToolbarSlot(BACK_SLOT);
}

class ToolbarButton extends FlexBox {
  private labelNode: TextCore | null = null;
  private readonly dotNodes: Array<FlexBox> = new Array<FlexBox>();
  private readonly slot: i32;

  constructor(label: string, width: f32, click: (event: PointerClickEventArgs) => void, slot: i32) {
    super();
    this.slot = slot;
    const childNode = slot == OVERFLOW_SLOT
      ? this.createOverflowIcon()
      : this.createLabel(label);
    this.width(width, Unit.Pixel)
      .height(activeTheme.value.contextMenu.item.height, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center)
      .padding(
        activeTheme.value.contextMenu.item.paddingLeft,
        activeTheme.value.contextMenu.item.paddingTop,
        activeTheme.value.contextMenu.item.paddingRight,
        activeTheme.value.contextMenu.item.paddingBottom,
      )
      .cornerRadius(activeTheme.value.contextMenu.item.cornerRadius)
      .child(childNode)
      .semanticRole(SemanticRole.Button)
      .semanticLabel(label)
      .preserveSelectionOnPointerDown(true)
      .onPointerClick(click);
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    if (eventType == PointerEventType.Up) {
      MobileTextSelectionToolbarManager.activateToolbarSlot(this.slot);
      return;
    }
    super._handlePointerEvent(eventType, x, y, modifiers);
  }

  _handleBubbledPointerEvent(event: PointerEventArgs): bool {
    if (event.eventType == PointerEventType.Up) {
      MobileTextSelectionToolbarManager.activateToolbarSlot(this.slot);
      event.handled = true;
      return true;
    }
    return super._handleBubbledPointerEvent(event);
  }

  label(value: string): void {
    const labelNode = this.labelNode;
    if (labelNode !== null) {
      labelNode.text(value);
    }
    this.semanticLabel(value);
  }

  applyMenuStyle(): void {
    this.height(activeTheme.value.contextMenu.item.height, Unit.Pixel);
    this.padding(
      activeTheme.value.contextMenu.item.paddingLeft,
      activeTheme.value.contextMenu.item.paddingTop,
      activeTheme.value.contextMenu.item.paddingRight,
      activeTheme.value.contextMenu.item.paddingBottom,
    );
    this.cornerRadius(activeTheme.value.contextMenu.item.cornerRadius);
    this.bgColor(activeTheme.value.contextMenu.item.background);
    const labelNode = this.labelNode;
    if (labelNode !== null) {
      labelNode
        .fontFamily(activeTheme.value.contextMenu.item.fontFamily)
        .fontSize(activeTheme.value.contextMenu.item.fontSize)
        .textColor(activeTheme.value.contextMenu.item.textColor);
    }
    for (let index = 0; index < this.dotNodes.length; ++index) {
      unchecked(this.dotNodes[index]).bgColor(activeTheme.value.contextMenu.item.textColor);
    }
  }

  private createLabel(label: string): TextCore {
    const labelNode = new TextCore(label)
      .fontFamily(activeTheme.value.contextMenu.item.fontFamily)
      .fontSize(activeTheme.value.contextMenu.item.fontSize)
      .textColor(activeTheme.value.contextMenu.item.textColor)
      .overflow(TextOverflow.Ellipsis)
      .selectable(false) as TextCore;
    labelNode
      .preserveSelectionOnPointerDown(true)
      .onPointerUpWith<ToolbarButton>(this, (button: ToolbarButton, event: PointerEventArgs): void => {
        MobileTextSelectionToolbarManager.activateToolbarSlot(button.slot);
        event.handled = true;
      });
    this.labelNode = labelNode;
    return labelNode;
  }

  private createOverflowIcon(): FlexBox {
    this.labelNode = null;
    const children = new Array<Node>();
    for (let index = 0; index < 3; ++index) {
      const dot = new FlexBox()
        .width(3.0, Unit.Pixel)
        .height(3.0, Unit.Pixel)
        .margin(0.0, 1.25, 0.0, 1.25)
        .cornerRadius(2.0)
        .bgColor(activeTheme.value.contextMenu.item.textColor) as FlexBox;
      this.dotNodes.push(dot);
      children.push(dot);
    }
    const icon = new FlexBox()
      .width(16.0, Unit.Pixel)
      .height(activeTheme.value.contextMenu.item.height, Unit.Pixel)
      .flexDirection(FlexDirection.Column)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center)
      .children(children)
      .preserveSelectionOnPointerDown(true) as FlexBox;
    icon.onPointerUpWith<ToolbarButton>(this, (button: ToolbarButton, event: PointerEventArgs): void => {
      MobileTextSelectionToolbarManager.activateToolbarSlot(button.slot);
      event.handled = true;
    });
    return icon;
  }
}

function makeSeparator(): FlexBox {
  return new FlexBox()
    .width(1.0, Unit.Pixel)
    .height(activeTheme.value.contextMenu.item.height - 10.0, Unit.Pixel)
    .bgColor(activeTheme.value.contextMenu.separatorColor) as FlexBox;
}

function normalizeStart(start: u32, end: u32): u32 {
  return start < end ? start : end;
}

function normalizeEnd(start: u32, end: u32): u32 {
  return start < end ? end : start;
}

export class MobileTextSelectionToolbarManager {
  private static hostRoot: Portal | null = null;
  private static panel: FlexBox | null = null;
  private static overflowPanel: FlexBox | null = null;
  private static overflowScrollBox: ScrollBox | null = null;
  private static overflowContent: FlexBox | null = null;
  private static readonly buttons: Array<ToolbarButton> = new Array<ToolbarButton>();
  private static readonly overflowButtons: Array<ToolbarButton> = new Array<ToolbarButton>();
  private static readonly separators: Array<FlexBox> = new Array<FlexBox>();
  private static readonly overflowSeparators: Array<FlexBox> = new Array<FlexBox>();
  private static readonly activeItems: Array<MenuItem> = new Array<MenuItem>();
  private static activeHandle: u64 = 0;
  private static activeStart: u32 = 0;
  private static activeEnd: u32 = 0;
  private static activeCrossSelectionText: string = "";
  private static activeCrossSelectionSelectAllTarget: u64 = 0;
  private static pendingCrossSelectionTextHandle: u64 = 0;
  private static hiddenForHandleDrag: bool = false;
  private static overflowVisible: bool = false;
  private static horizontalItemCount: i32 = 0;
  private static lastPanelX: f32 = EDGE_MARGIN;
  private static lastPanelY: f32 = EDGE_MARGIN;
  private static lastPanelWidth: f32 = 0.0;

  static createDefaultHost(): Portal {
    const existingHost = this.hostRoot;
    if (existingHost !== null) {
      return existingHost;
    }
    const panel = new FlexBox()
      .positionAbsolute()
      .height(activeTheme.value.contextMenu.item.height + 8.0, Unit.Pixel)
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .padding(TOOLBAR_HORIZONTAL_PADDING, 4.0, TOOLBAR_HORIZONTAL_PADDING, 4.0)
      .cornerRadius(activeTheme.value.contextMenu.panelCornerRadius)
      .border(1.0, activeTheme.value.contextMenu.panelBorderColor)
      .bgColor(activeTheme.value.contextMenu.panelBackground)
      .backgroundBlur(10.0)
      .dropShadow(
        activeTheme.value.contextMenu.panelShadowColor,
        0.0,
        activeTheme.value.contextMenu.shadowOffsetY,
        activeTheme.value.contextMenu.shadowBlur,
        activeTheme.value.contextMenu.shadowSpread,
      )
      .preserveSelectionOnPointerDown(true) as FlexBox;
    panel.visibility(Visibility.Collapsed);

    const overflowContent = new FlexBox()
      .flexDirection(FlexDirection.Column)
      .width(100.0, Unit.Percent)
      .bgColor(0x00000000)
      .preserveSelectionOnPointerDown(true) as FlexBox;
    const overflowScrollBox = new ScrollBox()
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Never)
      .scrollbarGutter(2.0)
      .width(100.0, Unit.Percent)
      .height(VERTICAL_MENU_MAX_HEIGHT, Unit.Pixel)
      .child(overflowContent)
      .preserveSelectionOnPointerDown(true) as ScrollBox;
    const overflowPanel = new FlexBox()
      .positionAbsolute()
      .width(VERTICAL_MENU_WIDTH, Unit.Pixel)
      .height(VERTICAL_MENU_MAX_HEIGHT, Unit.Pixel)
      .cornerRadius(activeTheme.value.contextMenu.panelCornerRadius)
      .border(1.0, activeTheme.value.contextMenu.panelBorderColor)
      .bgColor(activeTheme.value.contextMenu.panelBackground)
      .backgroundBlur(10.0)
      .dropShadow(
        activeTheme.value.contextMenu.panelShadowColor,
        0.0,
        activeTheme.value.contextMenu.shadowOffsetY,
        activeTheme.value.contextMenu.shadowBlur,
        activeTheme.value.contextMenu.shadowSpread,
      ) as FlexBox;
    overflowPanel.preserveSelectionOnPointerDown(true);
    overflowPanel.child(overflowScrollBox);
    overflowPanel.visibility(Visibility.Collapsed);

    this.buttons.length = 0;
    this.buttons.push(new ToolbarButton("Copy", READONLY_BUTTON_WIDTH, handleFirstButtonClick, 0));
    this.buttons.push(new ToolbarButton("Select all", READONLY_BUTTON_WIDTH, handleSecondButtonClick, 1));
    this.buttons.push(new ToolbarButton("Paste", EDITABLE_BUTTON_WIDTH, handleThirdButtonClick, 2));
    this.buttons.push(new ToolbarButton(OVERFLOW_LABEL, OVERFLOW_BUTTON_WIDTH, handleOverflowButtonClick, OVERFLOW_SLOT));
    this.overflowButtons.length = 0;
    this.overflowButtons.push(new ToolbarButton("Select all", VERTICAL_MENU_WIDTH, handleFourthButtonClick, 3));
    this.overflowButtons.push(new ToolbarButton("Extra", VERTICAL_MENU_WIDTH, handleFifthButtonClick, 4));
    this.overflowButtons.push(new ToolbarButton("Extra", VERTICAL_MENU_WIDTH, handleSixthButtonClick, 5));
    this.overflowButtons.push(new ToolbarButton("<", VERTICAL_MENU_WIDTH, handleBackButtonClick, BACK_SLOT));
    this.separators.length = 0;
    this.separators.push(makeSeparator());
    this.separators.push(makeSeparator());
    this.separators.push(makeSeparator());
    this.overflowSeparators.length = 0;
    this.overflowSeparators.push(makeSeparator());
    this.overflowSeparators.push(makeSeparator());
    this.overflowSeparators.push(makeSeparator());
    this.overflowSeparators.push(makeSeparator());

    const hostChildren = new Array<Node>();
    hostChildren.push(panel);
    hostChildren.push(overflowPanel);
    const hostRoot = new Portal()
      .positionAbsolute()
      .position(0.0, 0.0)
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .children(hostChildren) as Portal;
    this.hostRoot = hostRoot;
    this.panel = panel;
    this.overflowPanel = overflowPanel;
    this.overflowScrollBox = overflowScrollBox;
    this.overflowContent = overflowContent;
    return hostRoot;
  }

  static reset(): void {
    const hostRoot = this.hostRoot;
    if (hostRoot !== null) {
      hostRoot.dispose();
    }
    this.hostRoot = null;
    this.panel = null;
    this.overflowPanel = null;
    this.overflowScrollBox = null;
    this.overflowContent = null;
    this.buttons.length = 0;
    this.overflowButtons.length = 0;
    this.separators.length = 0;
    this.overflowSeparators.length = 0;
    this.activeItems.length = 0;
    this.activeHandle = 0;
    this.activeStart = 0;
    this.activeEnd = 0;
    this.activeCrossSelectionText = "";
    this.activeCrossSelectionSelectAllTarget = 0;
    this.pendingCrossSelectionTextHandle = 0;
    this.hiddenForHandleDrag = false;
    this.overflowVisible = false;
    this.horizontalItemCount = 0;
    this.lastPanelX = EDGE_MARGIN;
    this.lastPanelY = EDGE_MARGIN;
    this.lastPanelWidth = 0.0;
  }

  static clear(): void {
    this.activeHandle = 0;
    this.activeStart = 0;
    this.activeEnd = 0;
    this.activeCrossSelectionText = "";
    this.activeCrossSelectionSelectAllTarget = 0;
    this.activeItems.length = 0;
    this.pendingCrossSelectionTextHandle = 0;
    this.hiddenForHandleDrag = false;
    this.overflowVisible = false;
    this.horizontalItemCount = 0;
    this.hide();
  }

  static showItemsAt(items: Array<MenuItem>, x: f32, y: f32): bool {
    if (items.length == 0) {
      this.clear();
      return false;
    }
    this.activeHandle = 0;
    this.activeStart = 0;
    this.activeEnd = 0;
    this.activeCrossSelectionText = "";
    this.activeCrossSelectionSelectAllTarget = 0;
    this.pendingCrossSelectionTextHandle = 0;
    this.hiddenForHandleDrag = false;
    this.ensureHost();
    this.activeItems.length = 0;
    for (let index = 0; index < items.length; ++index) {
      this.activeItems.push(unchecked(items[index]));
    }
    this.applyItems(false);
    this.positionAtPoint(x, y, READONLY_BUTTON_WIDTH);
    return true;
  }

  static setPendingCrossSelectionTextHandle(handle: u64): void {
    this.pendingCrossSelectionTextHandle = handle;
  }

  static handleSelectionChanged(handle: u64, target: Node, start: u32, end: u32, selectionChromeVisible: bool): void {
    this.activeCrossSelectionText = "";
    const textTarget = this.resolveTextTarget(target);
    const textHandle = textTarget === null ? 0 : changetype<TextCore>(textTarget).builtHandle;
    if (start == end && this.hiddenForHandleDrag && textHandle != 0 && this.activeHandle == textHandle) {
      this.activeStart = start;
      this.activeEnd = end;
      this.hide();
      return;
    }
    if (!selectionChromeVisible || start == end || textTarget === null) {
      this.clear();
      return;
    }
    this.activeHandle = textHandle;
    this.activeStart = start;
    this.activeEnd = end;
    this.ensureHost();
    this.buildItemsForText(textTarget, start, end, "");
    this.positionForTextRange(textHandle, start, end);
  }

  static handleCrossSelectionChanged(handle: u64, area: Node, text: string, selectionChromeVisible: bool): void {
    if (!selectionChromeVisible || text.length == 0) {
      if (text.length == 0 && this.hiddenForHandleDrag && this.activeHandle == handle) {
        this.activeStart = 0;
        this.activeEnd = 0;
        this.activeCrossSelectionText = "";
        this.hide();
        return;
      }
      this.clear();
      return;
    }
    const previousHandle = this.activeHandle;
    const previousText = this.activeCrossSelectionText;
    const previousSelectAllTarget = this.activeCrossSelectionSelectAllTarget;
    this.activeHandle = handle;
    this.activeStart = 0;
    this.activeEnd = <u32>text.length;
    this.activeCrossSelectionText = text;
    this.ensureHost();
    this.activeItems.length = 0;
    this.activeItems.push(new MenuItem("Copy", ContextMenuAction.CopyCurrentSelection, text));
    let selectAllTarget = this.pendingCrossSelectionTextHandle;
    this.pendingCrossSelectionTextHandle = 0;
    if (selectAllTarget == 0 && previousHandle == handle && previousText == text) {
      selectAllTarget = previousSelectAllTarget;
    }
    if (selectAllTarget == 0) {
      selectAllTarget = handle;
    }
    this.activeCrossSelectionSelectAllTarget = selectAllTarget;
    this.activeItems.push(new MenuItem(
      "Select all",
      ContextMenuAction.SelectAllText,
      null,
      0,
      null,
      false,
      selectAllTarget,
    ));
    this.applyItems(false);
    this.positionForCrossSelection(handle);
  }

  static refreshActiveGeometry(selectionChromeVisible: bool): void {
    if (!selectionChromeVisible || this.activeHandle == 0 || this.hiddenForHandleDrag) {
      this.hide();
      return;
    }
    if (this.activeCrossSelectionText.length > 0) {
      this.positionForCrossSelection(this.activeHandle);
      return;
    }
    this.positionForTextRange(this.activeHandle, this.activeStart, this.activeEnd);
  }

  static hideForHandleDrag(): void {
    this.hiddenForHandleDrag = true;
    this.overflowVisible = false;
    this.hide();
  }

  static showAfterHandleDrag(selectionChromeVisible: bool): void {
    this.hiddenForHandleDrag = false;
    this.refreshActiveGeometry(selectionChromeVisible);
  }

  static invokeSlot(slot: i32): void {
    this.activateToolbarSlot(slot);
  }

  static activateToolbarSlot(slot: i32): void {
    if (slot == OVERFLOW_SLOT) {
      this.showOverflowMenu();
      return;
    }
    if (slot == BACK_SLOT) {
      this.showHorizontalMenu();
      return;
    }
    if (slot < 0 || slot >= this.activeItems.length) {
      return;
    }
    const item = unchecked(this.activeItems[slot]);
    runContextMenuAction(item);
    if (item.action == ContextMenuAction.CopyCurrentSelection) {
      ui.clearCurrentSelection();
      this.clear();
      return;
    }
    if (item.action == ContextMenuAction.SelectAllText) {
      return;
    }
    this.hide();
  }

  static isVisible(): bool {
    const panel = this.panel;
    return panel !== null && panel.isVisible;
  }

  static itemCount(): i32 {
    return this.activeItems.length;
  }

  static itemLabel(index: i32): string {
    if (index < 0 || index >= this.activeItems.length) {
      return "";
    }
    return unchecked(this.activeItems[index]).label;
  }

  static visibleToolbarItemCount(): i32 {
    return this.horizontalItemCount;
  }

  static isOverflowVisible(): bool {
    const overflowPanel = this.overflowPanel;
    return overflowPanel !== null && overflowPanel.isVisible;
  }

  static dismissForOutsidePointerDown(sceneX: f32, sceneY: f32): bool {
    if (this.activeItems.length == 0) {
      return false;
    }
    if (this.pointHitsNode(this.panel, sceneX, sceneY) || this.pointHitsNode(this.overflowPanel, sceneX, sceneY)) {
      return false;
    }
    this.clear();
    return true;
  }

  static panelNode(): Node | null {
    return this.panel;
  }

  static overflowPanelNode(): Node | null {
    return this.overflowPanel;
  }

  private static ensureHost(): void {
    if (this.hostRoot === null) {
      this.createDefaultHost();
    }
  }

  private static buildItemsForText(target: TextCore, start: u32, end: u32, crossSelectionText: string): void {
    this.activeItems.length = 0;
    const handle = target.builtHandle;
    const parent = target.parentNode;
    const editable = target.isEditableText;
    const selectionStart = start;
    const selectionEnd = end;
    const content = parent instanceof TextInputCore ? changetype<TextInputCore>(parent).value : target.content;
    const selectedText = crossSelectionText.length > 0 ? crossSelectionText : this.resolveSelectedText(content, selectionStart, selectionEnd);
    const selectedPayload = selectedText.length > 0 ? selectedText : null;
    const hasText = content.length > 0;
    if (editable) {
      this.activeItems.push(
        new MenuItem("Cut", ContextMenuAction.CutTextSelection, selectedPayload, 0, null, false, handle, 0, 0, true)
          .withSelectionRange(selectionStart, selectionEnd),
      );
      this.activeItems.push(new MenuItem("Copy", ContextMenuAction.CopyCurrentSelection, selectedPayload, 0, null, false, handle, 0, 0, true));
      this.activeItems.push(new MenuItem("Paste", ContextMenuAction.PasteText, null, 0, null, false, handle, 0, 0, true));
      this.activeItems.push(new MenuItem("Select all", ContextMenuAction.SelectAllText, null, 0, null, !hasText, handle, 0, 0, true));
      this.applyItems(true);
      return;
    }
    this.activeItems.push(new MenuItem("Copy", ContextMenuAction.CopyCurrentSelection, selectedPayload, 0, null, false, handle));
    this.activeItems.push(new MenuItem("Select all", ContextMenuAction.SelectAllText, null, 0, null, !hasText, handle));
    this.applyItems(false);
  }

  private static resolveSelectedText(content: string, selectionStart: u32, selectionEnd: u32): string {
    if (selectionStart == selectionEnd) {
      return "";
    }
    const start = normalizeStart(selectionStart, selectionEnd);
    const end = normalizeEnd(selectionStart, selectionEnd);
    return content.substring(<i32>start, <i32>end);
  }

  private static resolveTextTarget(node: Node): TextCore | null {
    if (node instanceof TextInputCore) {
      return changetype<TextInputCore>(node).editorNode;
    }
    if (node instanceof TextCore) {
      return changetype<TextCore>(node);
    }
    return null;
  }

  private static applyItems(editable: bool): void {
    const panel = this.panel;
    if (panel === null) {
      return;
    }
    const buttonWidth = editable ? EDITABLE_BUTTON_WIDTH : READONLY_BUTTON_WIDTH;
    const children = new Array<Node>();
    const height = activeTheme.value.contextMenu.item.height + 8.0;
    const hasOverflow = this.activeItems.length > MAX_HORIZONTAL_ACTIONS;
    this.horizontalItemCount = hasOverflow ? MAX_HORIZONTAL_ACTIONS + 1 : this.activeItems.length;
    panel
      .height(height, Unit.Pixel)
      .width(this.activeWidthForButtonWidth(buttonWidth, this.activeItems.length, hasOverflow), Unit.Pixel)
      .bgColor(activeTheme.value.contextMenu.panelBackground)
      .backgroundBlur(10.0)
      .cornerRadius(activeTheme.value.contextMenu.panelCornerRadius)
      .border(1.0, activeTheme.value.contextMenu.panelBorderColor)
      .dropShadow(
        activeTheme.value.contextMenu.panelShadowColor,
        0.0,
        activeTheme.value.contextMenu.shadowOffsetY,
        activeTheme.value.contextMenu.shadowBlur,
        activeTheme.value.contextMenu.shadowSpread,
      );
    const visibleActions = hasOverflow ? MAX_HORIZONTAL_ACTIONS : this.activeItems.length;
    for (let index = 0; index < visibleActions; ++index) {
      if (index > 0) {
        const separator = unchecked(this.separators[index - 1]);
        separator.height(activeTheme.value.contextMenu.item.height - 10.0, Unit.Pixel);
        separator.bgColor(activeTheme.value.contextMenu.separatorColor);
        children.push(separator);
      }
      const button = unchecked(this.buttons[index]);
      button.width(buttonWidth, Unit.Pixel);
      button.applyMenuStyle();
      button.label(unchecked(this.activeItems[index]).label);
      children.push(button);
    }
    if (hasOverflow) {
      const separator = unchecked(this.separators[MAX_HORIZONTAL_ACTIONS - 1]);
      separator.height(activeTheme.value.contextMenu.item.height - 10.0, Unit.Pixel);
      separator.bgColor(activeTheme.value.contextMenu.separatorColor);
      children.push(separator);
      const overflowButton = unchecked(this.buttons[MAX_HORIZONTAL_ACTIONS]);
      overflowButton.width(OVERFLOW_BUTTON_WIDTH, Unit.Pixel);
      overflowButton.applyMenuStyle();
      overflowButton.label(OVERFLOW_LABEL);
      children.push(overflowButton);
    }
    panel.children(children);
    this.applyOverflowItems(buttonWidth);
    this.showHorizontalMenu();
  }

  private static positionForTextRange(handle: u64, start: u32, end: u32): void {
    if (start == end) {
      this.hide();
      return;
    }
    const rects = ui.getTextRangeRects(handle, normalizeStart(start, end), normalizeEnd(start, end));
    if (rects.length == 0) {
      this.hide();
      return;
    }
    const first = unchecked(rects[0]);
    const last = unchecked(rects[rects.length - 1]);
    this.positionAtSelectionBounds(first.x, first.y, first.height, last.x + last.width, last.y + last.height);
  }

  private static positionForCrossSelection(handle: u64): void {
    const rects = ui.getCrossSelectionEndpointRects(handle);
    if (rects === null) {
      this.hide();
      return;
    }
    this.positionAtSelectionBounds(
      rects.start.x,
      rects.start.y,
      rects.start.height,
      rects.end.x + rects.end.width,
      rects.end.y + rects.end.height,
    );
  }

  private static positionAtSelectionBounds(startX: f32, topY: f32, startHeight: f32, endX: f32, bottomY: f32): void {
    const panel = this.panel;
    if (panel === null || this.hiddenForHandleDrag) {
      return;
    }
    const hasOverflow = this.activeItems.length > MAX_HORIZONTAL_ACTIONS;
    const buttonWidth = this.activeItems.length > 2 ? EDITABLE_BUTTON_WIDTH : READONLY_BUTTON_WIDTH;
    const width = this.activeWidthForButtonWidth(buttonWidth, this.activeItems.length, hasOverflow);
    const height = activeTheme.value.contextMenu.item.height + 8.0;
    const viewportWidth = ui.getViewportWidth();
    const viewportHeight = ui.getViewportHeight();
    const maxX = <f32>Math.max(EDGE_MARGIN, viewportWidth - width - EDGE_MARGIN);
    const x = <f32>Math.max(EDGE_MARGIN, Math.min(startX - (width * 0.5), maxX));
    const topCandidate = topY - height - TOOLBAR_MARGIN;
    const bottomCandidate = bottomY + TOOLBAR_MARGIN + 12.0;
    let y = topCandidate;
    if (topCandidate < EDGE_MARGIN) {
      y = bottomCandidate;
      if (bottomCandidate + height > viewportHeight - EDGE_MARGIN) {
        y = topY + (startHeight * 0.5) - (height * 0.5);
      }
    }
    const maxY = <f32>Math.max(EDGE_MARGIN, viewportHeight - height - EDGE_MARGIN);
    y = <f32>Math.max(EDGE_MARGIN, Math.min(y, maxY));
    this.lastPanelX = x;
    this.lastPanelY = y;
    this.lastPanelWidth = width;
    panel.position(x, y);
    if (this.overflowVisible) {
      this.positionOverflowPanel(x, y, width, height);
    } else {
      panel.visibility(Visibility.Normal);
    }
  }

  private static positionAtPoint(pointX: f32, pointY: f32, buttonWidth: f32): void {
    const panel = this.panel;
    if (panel === null || this.hiddenForHandleDrag || this.activeItems.length == 0) {
      return;
    }
    const hasOverflow = this.activeItems.length > MAX_HORIZONTAL_ACTIONS;
    const width = this.activeWidthForButtonWidth(buttonWidth, this.activeItems.length, hasOverflow);
    const height = activeTheme.value.contextMenu.item.height + 8.0;
    const viewportWidth = ui.getViewportWidth();
    const viewportHeight = ui.getViewportHeight();
    const maxX = <f32>Math.max(EDGE_MARGIN, viewportWidth - width - EDGE_MARGIN);
    let x = pointX - (width * 0.5);
    x = <f32>Math.max(EDGE_MARGIN, Math.min(x, maxX));
    let y = pointY - height - TOOLBAR_MARGIN;
    if (y < EDGE_MARGIN) {
      y = pointY + TOOLBAR_MARGIN;
    }
    const maxY = <f32>Math.max(EDGE_MARGIN, viewportHeight - height - EDGE_MARGIN);
    y = <f32>Math.max(EDGE_MARGIN, Math.min(y, maxY));
    this.lastPanelX = x;
    this.lastPanelY = y;
    this.lastPanelWidth = width;
    panel.position(x, y);
    if (this.overflowVisible) {
      this.positionOverflowPanel(x, y, width, height);
    } else {
      panel.visibility(Visibility.Normal);
    }
  }

  private static applyOverflowItems(buttonWidth: f32): void {
    const overflowPanel = this.overflowPanel;
    const overflowScrollBox = this.overflowScrollBox;
    const overflowContent = this.overflowContent;
    if (overflowPanel === null || overflowScrollBox === null || overflowContent === null) {
      return;
    }
    const overflowCount = this.activeItems.length > MAX_HORIZONTAL_ACTIONS
      ? this.activeItems.length - MAX_HORIZONTAL_ACTIONS
      : 0;
    const totalRows = overflowCount + 1;
    const contentHeight = (activeTheme.value.contextMenu.item.height * <f32>totalRows) + <f32>(totalRows - 1);
    const maxPanelHeight = <f32>Math.max(
      activeTheme.value.contextMenu.item.height,
      Math.min(VERTICAL_MENU_MAX_HEIGHT, ui.getViewportHeight() - (EDGE_MARGIN * 2.0)),
    );
    const panelHeight = <f32>Math.min(contentHeight, maxPanelHeight);
    overflowPanel
      .width(VERTICAL_MENU_WIDTH, Unit.Pixel)
      .height(panelHeight, Unit.Pixel)
      .bgColor(activeTheme.value.contextMenu.panelBackground)
      .backgroundBlur(10.0)
      .cornerRadius(activeTheme.value.contextMenu.panelCornerRadius)
      .border(1.0, activeTheme.value.contextMenu.panelBorderColor)
      .dropShadow(
        activeTheme.value.contextMenu.panelShadowColor,
        0.0,
        activeTheme.value.contextMenu.shadowOffsetY,
        activeTheme.value.contextMenu.shadowBlur,
        activeTheme.value.contextMenu.shadowSpread,
      );
    overflowScrollBox.width(100.0, Unit.Percent);
    overflowScrollBox.height(panelHeight, Unit.Pixel);
    overflowScrollBox.scrollContentSize(-1.0, contentHeight);

    const children = new Array<Node>();
    for (let index = 0; index < overflowCount; ++index) {
      if (index > 0) {
        const separator = unchecked(this.overflowSeparators[index - 1]);
        separator.width(100.0, Unit.Percent);
        separator.height(1.0, Unit.Pixel);
        separator.bgColor(activeTheme.value.contextMenu.separatorColor);
        children.push(separator);
      }
      const itemIndex = MAX_HORIZONTAL_ACTIONS + index;
      const button = unchecked(this.overflowButtons[index]);
      button.width(VERTICAL_MENU_WIDTH, Unit.Pixel);
      button.applyMenuStyle();
      button.label(unchecked(this.activeItems[itemIndex]).label);
      children.push(button);
    }
    if (overflowCount > 0) {
      const separator = unchecked(this.overflowSeparators[overflowCount - 1]);
      separator.width(100.0, Unit.Percent);
      separator.height(1.0, Unit.Pixel);
      separator.bgColor(activeTheme.value.contextMenu.separatorColor);
      children.push(separator);
    }
    const backButton = unchecked(this.overflowButtons[this.overflowButtons.length - 1]);
    backButton.width(VERTICAL_MENU_WIDTH, Unit.Pixel);
    backButton.applyMenuStyle();
    backButton.label("<");
    children.push(backButton);
    overflowContent.children(children);
    if (buttonWidth > 0.0) {
      overflowContent.width(100.0, Unit.Percent);
    }
  }

  private static showOverflowMenu(): void {
    const panel = this.panel;
    const overflowPanel = this.overflowPanel;
    if (panel === null || overflowPanel === null || this.activeItems.length <= MAX_HORIZONTAL_ACTIONS) {
      return;
    }
    this.overflowVisible = true;
    panel.visibility(Visibility.Collapsed);
    this.positionOverflowPanel(this.lastPanelX, this.lastPanelY, this.lastPanelWidth, activeTheme.value.contextMenu.item.height + 8.0);
    overflowPanel.visibility(Visibility.Normal);
  }

  private static showHorizontalMenu(): void {
    this.overflowVisible = false;
    const overflowPanel = this.overflowPanel;
    if (overflowPanel !== null) {
      overflowPanel.visibility(Visibility.Collapsed);
    }
    const panel = this.panel;
    if (panel !== null && this.activeItems.length > 0 && !this.hiddenForHandleDrag) {
      panel.visibility(Visibility.Normal);
    }
  }

  private static positionOverflowPanel(x: f32, y: f32, horizontalWidth: f32, horizontalHeight: f32): void {
    const overflowPanel = this.overflowPanel;
    if (overflowPanel === null) {
      return;
    }
    const viewportWidth = ui.getViewportWidth();
    const viewportHeight = ui.getViewportHeight();
    const panelHeight = <f32>Math.min(VERTICAL_MENU_MAX_HEIGHT, ui.getViewportHeight() - (EDGE_MARGIN * 2.0));
    const maxX = <f32>Math.max(EDGE_MARGIN, viewportWidth - VERTICAL_MENU_WIDTH - EDGE_MARGIN);
    const overflowX = <f32>Math.max(EDGE_MARGIN, Math.min(x + horizontalWidth - VERTICAL_MENU_WIDTH, maxX));
    let overflowY = y + horizontalHeight + 4.0;
    if (overflowY + panelHeight > viewportHeight - EDGE_MARGIN) {
      overflowY = y - panelHeight - 4.0;
    }
    const maxY = <f32>Math.max(EDGE_MARGIN, viewportHeight - panelHeight - EDGE_MARGIN);
    overflowY = <f32>Math.max(EDGE_MARGIN, Math.min(overflowY, maxY));
    overflowPanel.position(overflowX, overflowY);
  }

  private static pointHitsNode(node: Node | null, sceneX: f32, sceneY: f32): bool {
    if (node === null || !node.isVisible || node.builtHandle == <u64>HandleValue.Invalid) {
      return false;
    }
    const bounds = ui.tryGetBounds(node.builtHandle);
    if (bounds === null) {
      return false;
    }
    const x = unchecked(changetype<Float32Array>(bounds)[0]);
    const y = unchecked(changetype<Float32Array>(bounds)[1]);
    const width = unchecked(changetype<Float32Array>(bounds)[2]);
    const height = unchecked(changetype<Float32Array>(bounds)[3]);
    return sceneX >= x && sceneX <= (x + width) && sceneY >= y && sceneY <= (y + height);
  }

  private static activeWidthForButtonWidth(buttonWidth: f32, itemCount: i32, hasOverflow: bool): f32 {
    const visibleActions = hasOverflow ? MAX_HORIZONTAL_ACTIONS : itemCount;
    const visibleCount = hasOverflow ? visibleActions + 1 : visibleActions;
    const actionWidth = buttonWidth * <f32>visibleActions;
    const overflowWidth = hasOverflow ? OVERFLOW_BUTTON_WIDTH : 0.0;
    return actionWidth +
      overflowWidth +
      (<f32>(visibleCount - 1) * 1.0) +
      (TOOLBAR_HORIZONTAL_PADDING * 2.0);
  }

  private static hide(): void {
    const panel = this.panel;
    if (panel !== null) {
      panel.visibility(Visibility.Collapsed);
    }
    const overflowPanel = this.overflowPanel;
    if (overflowPanel !== null) {
      overflowPanel.visibility(Visibility.Collapsed);
    }
  }
}
