import * as ffi from "./ffi";
import * as ui from "../bindings/ui";
import { ContextMenu, ContextMenuAction, MenuItem } from "../controls/ContextMenu";
import { NavLink } from "../controls/NavLink";
import { TextInputCore } from "../controls/internal/TextInputCore";
import { EventRouter } from "./EventRouter";
import { MobileTextSelectionToolbarManager } from "./MobileTextSelectionToolbarManager";
import { HandleValue, KeyModifier, PointerEventType } from "./ffi";
import {
  formatPrimaryShortcutLabel,
  formatRedoShortcutLabel,
  formatShortcutLabel,
  formatUndoShortcutLabel,
  getPlatformFamily,
  PlatformFamily,
} from "./Platform";
import { ContextMenuEventArgs, Node, VisibilityChangedEventArgs } from "./Node";
import { Image } from "../nodes/Image";
import { Svg } from "../nodes/Svg";
import { TextCore } from "../nodes/TextCore";

function handleMenuVisibilityChanged(event: VisibilityChangedEventArgs): void {
  ContextMenuManager.handleMenuVisibilityChanged(event.visible);
}

function appendMenuSection(items: Array<MenuItem>, section: Array<MenuItem>): void {
  if (section.length == 0) {
    return;
  }
  if (items.length > 0) {
    items.push(MenuItem.separator());
  }
  for (let index = 0; index < section.length; ++index) {
    items.push(unchecked(section[index]));
  }
}

function resolveHistoryShortcutLabel(forward: bool): string {
  const platform = getPlatformFamily();
  if (platform == PlatformFamily.Apple) {
    return formatShortcutLabel(forward ? "]" : "[", KeyModifier.Meta, platform);
  }
  return formatShortcutLabel(forward ? "ArrowRight" : "ArrowLeft", KeyModifier.Alt, platform);
}

export class ContextMenuManager {
  private static menu: ContextMenu | null = null;
  private static defaultMenu: ContextMenu | null = null;
  private static readonly activePointerSelectionHandles: Array<u64> = new Array<u64>();
  private static readonly currentSelectionHandleHints: Array<u64> = new Array<u64>();
  private static currentSelectionText: string = "";
  private static activeMenuLink: NavLink | null = null;

  static createDefaultMenu(): ContextMenu {
    const menu = new ContextMenu()
      .onVisibilityChanged(handleMenuVisibilityChanged) as ContextMenu;
    this.defaultMenu = menu;
    return menu;
  }

  static setMenu(menu: ContextMenu | null): void {
    this.releaseActiveMenuLinkPreview();
    const previousMenu = this.menu;
    if (previousMenu !== null) {
      previousMenu.onVisibilityChanged(null);
    }
    this.menu = menu;
    if (menu !== null) {
      menu.onVisibilityChanged(handleMenuVisibilityChanged);
    }
  }

  static trackPointerEvent(eventType: PointerEventType, handle: u64): void {
    if (eventType == PointerEventType.Down) {
      this.activePointerSelectionHandles.length = 0;
    }
    if (handle != <u64>HandleValue.Invalid) {
      this.pushUniqueHandle(this.activePointerSelectionHandles, handle);
    }
  }

  static handleSelectionChanged(text: string): void {
    this.currentSelectionText = text;
    if (text.length == 0) {
      this.currentSelectionHandleHints.length = 0;
      return;
    }

    this.currentSelectionHandleHints.length = 0;
    for (let index = 0; index < this.activePointerSelectionHandles.length; ++index) {
      this.currentSelectionHandleHints.push(unchecked(this.activePointerSelectionHandles[index]));
    }
  }

  static showForCurrentSelection(handle: u64, x: f32, y: f32): void {
    const menu = this.resolveActiveMenu();
    if (menu === null) {
      return;
    }
    const targetNode = EventRouter.getRegisteredNode(handle);
    if (this.invokeCustomContextMenuHandler(targetNode, x, y)) {
      return;
    }
    const items = this.buildBuiltInItems(handle, x, y, true);

    const navigationItems = new Array<MenuItem>();
    if (ffi.fui_can_navigate_back()) {
      navigationItems.push(new MenuItem("Back", ContextMenuAction.NavigateBack, null, 0, resolveHistoryShortcutLabel(false)));
    }
    if (ffi.fui_can_navigate_forward()) {
      navigationItems.push(new MenuItem("Forward", ContextMenuAction.NavigateForward, null, 0, resolveHistoryShortcutLabel(true)));
    }
    navigationItems.push(
      new MenuItem("Reload Page", ContextMenuAction.ReloadPage, null, 0, formatPrimaryShortcutLabel("r")),
    );
    appendMenuSection(items, navigationItems);
    if (items.length == 0) {
      this.releaseActiveMenuLinkPreview();
      return;
    }
    menu.items(items);
    menu.showFromContextPointer(null, x, y);
  }

  static showForLongPress(handle: u64, x: f32, y: f32): bool {
    const items = this.buildBuiltInItems(handle, x, y, false);
    if (items.length == 0) {
      this.releaseActiveMenuLinkPreview();
      return false;
    }
    return MobileTextSelectionToolbarManager.showItemsAt(items, x, y);
  }

  static canShowForHandle(handle: u64): bool {
    const targetNode = EventRouter.getRegisteredNode(handle);
    let contextNode = targetNode;
    while (contextNode !== null) {
      if (contextNode.isContextMenuDisabled) {
        return false;
      }
      contextNode = contextNode.parentNode;
    }
    return true;
  }

  static hideActiveMenu(): void {
    ContextMenu.hideActiveMenu();
  }

  static handleMenuVisibilityChanged(visible: bool): void {
    if (!visible) {
      this.releaseActiveMenuLinkPreview();
    }
  }

  private static resolveActiveMenu(): ContextMenu | null {
    if (this.menu !== null) {
      return this.menu;
    }
    return this.defaultMenu;
  }

  private static invokeCustomContextMenuHandler(targetNode: Node | null, x: f32, y: f32): bool {
    this.releaseActiveMenuLinkPreview();
    let contextNode = targetNode;
    while (contextNode !== null) {
      if (contextNode.isContextMenuDisabled) {
        return true;
      }
      const handler = contextNode.contextMenuHandler;
      if (handler !== null) {
        handler(new ContextMenuEventArgs(targetNode, x, y));
        return true;
      }
      contextNode = contextNode.parentNode;
    }
    return false;
  }

  private static buildBuiltInItems(handle: u64, x: f32, y: f32, clearSelectionOnBackgroundMiss: bool): Array<MenuItem> {
    this.releaseActiveMenuLinkPreview();
    const targetNode = EventRouter.getRegisteredNode(handle);
    let contextNode = targetNode;
    while (contextNode !== null) {
      if (contextNode.isContextMenuDisabled) {
        return new Array<MenuItem>();
      }
      contextNode = contextNode.parentNode;
    }

    const items = new Array<MenuItem>();
    const link = this.resolveNavLink(targetNode);
    if (link !== null) {
      link.pinPreviewForContextMenu();
      this.activeMenuLink = link;
      const linkItems = new Array<MenuItem>();
      linkItems.push(new MenuItem("New Tab", ContextMenuAction.OpenLinkInNewTab, link.href));
      linkItems.push(new MenuItem("Open", ContextMenuAction.OpenLink, link.href));
      appendMenuSection(items, linkItems);
    }

    const textTarget = this.resolveTextTarget(targetNode);
    const selectionHit = ui.isPointInSelection(x, y) || this.selectionHintContainsHandle(handle);
    if (textTarget !== null) {
      appendMenuSection(items, this.buildTextSection(textTarget, selectionHit ? this.currentSelectionText : ""));
    }

    const imageUrl = this.resolveImageUrl(targetNode, x, y);
    if (imageUrl !== null && imageUrl.length > 0) {
      const imageItems = new Array<MenuItem>();
      imageItems.push(new MenuItem("New Tab", ContextMenuAction.OpenImageInNewTab, imageUrl));
      imageItems.push(new MenuItem("Open", ContextMenuAction.OpenImage, imageUrl));
      appendMenuSection(items, imageItems);
    }

    if (selectionHit && textTarget === null && this.currentSelectionText.length > 0) {
      const selectionItems = new Array<MenuItem>();
      selectionItems.push(new MenuItem("Copy", ContextMenuAction.CopyCurrentSelection, this.currentSelectionText));
      appendMenuSection(items, selectionItems);
    } else if (clearSelectionOnBackgroundMiss && !selectionHit && textTarget === null && link === null && imageUrl === null) {
      this.currentSelectionText = "";
      this.currentSelectionHandleHints.length = 0;
      ui.clearCurrentSelection();
    }

    return items;
  }

  private static resolveNavLink(node: Node | null): NavLink | null {
    let current = node;
    while (current !== null) {
      if (current instanceof NavLink) {
        return changetype<NavLink>(current);
      }
      current = current.parentNode;
    }
    return null;
  }

  private static resolveTextTarget(node: Node | null): TextCore | null {
    let current = node;
    while (current !== null) {
      if (current instanceof TextInputCore) {
        return changetype<TextInputCore>(current).editorNode;
      }
      if (current instanceof TextCore) {
        return changetype<TextCore>(current);
      }
      current = current.parentNode;
    }
    return null;
  }

  private static resolveImageUrl(node: Node | null, pointX: f32, pointY: f32): string | null {
    let current = node;
    while (current !== null) {
      const currentUrl = this.resolveDirectImageUrl(current);
      if (currentUrl !== null && currentUrl.length > 0) {
        return currentUrl;
      }
      current = current.parentNode;
    }
    if (node !== null) {
      return this.resolveDescendantImageUrl(node, pointX, pointY);
    }
    return null;
  }

  private static buildTextSection(target: TextCore, currentSelectionText: string = ""): Array<MenuItem> {
    const items = new Array<MenuItem>();
    const handle = target.builtHandle;
    if (handle == <u64>HandleValue.Invalid || !target.isSelectableText) {
      return items;
    }

    const selectionStart = this.resolveSelectionStart(target);
    const selectionEnd = this.resolveSelectionEnd(target);
    const selectionStartByte = this.resolveSelectionStartByte(target);
    const selectionEndByte = this.resolveSelectionEndByte(target);
    const content = this.resolveTextContent(target);
    const hasSelection = ui.hasTextSelection(handle) || ffi.fui_has_text_selection_snapshot(handle) || selectionStart != selectionEnd;
    const hasText = content.length > 0;
    const selectedText = hasSelection ? this.resolveSelectedText(target) : "";
    const selectedPayload = selectedText.length > 0 ? selectedText : null;
    if (target.isEditableText) {
      ffi.fui_freeze_text_selection_snapshot(handle);
      items.push(
        new MenuItem(
          "Undo",
          ContextMenuAction.UndoTextEdit,
          null,
          0,
          formatUndoShortcutLabel(),
          !ui.canUndoTextEdit(handle),
          handle,
          0,
          0,
          true,
        ),
      );
      items.push(
        new MenuItem(
          "Redo",
          ContextMenuAction.RedoTextEdit,
          null,
          0,
          formatRedoShortcutLabel(),
          !ui.canRedoTextEdit(handle),
          handle,
          0,
          0,
          true,
        ),
      );
      items.push(MenuItem.separator());
      items.push(
        new MenuItem(
          "Cut",
          ContextMenuAction.CutTextSelection,
          selectedPayload,
          0,
          formatPrimaryShortcutLabel("x"),
          !hasSelection,
          handle,
          0,
          0,
          true,
        ).withSelectionRange(selectionStartByte, selectionEndByte),
      );
      items.push(
        new MenuItem(
          "Copy",
          ContextMenuAction.CopyCurrentSelection,
          selectedPayload,
          0,
          formatPrimaryShortcutLabel("c"),
          !hasSelection,
          handle,
          0,
          0,
          true,
        ),
      );
      items.push(
        new MenuItem(
          "Paste",
          ContextMenuAction.PasteText,
          null,
          0,
          formatPrimaryShortcutLabel("v"),
          false,
          handle,
          0,
          0,
          true,
        ),
      );
      items.push(
        new MenuItem(
          "Select All",
          ContextMenuAction.SelectAllText,
          null,
          0,
          formatPrimaryShortcutLabel("a"),
          !hasText,
          handle,
          0,
          0,
          true,
        ),
      );
      return items;
    }

    if (currentSelectionText.length > 0) {
      items.push(
        new MenuItem(
          "Copy",
          ContextMenuAction.CopyCurrentSelection,
          currentSelectionText,
          0,
          formatPrimaryShortcutLabel("c"),
        ),
      );
    } else {
      items.push(
        new MenuItem(
          "Copy",
          ContextMenuAction.CopyCurrentSelection,
          null,
          0,
          formatPrimaryShortcutLabel("c"),
          !hasSelection,
          handle,
        ),
      );
    }
    items.push(
      new MenuItem(
        "Select All",
        ContextMenuAction.SelectAllText,
        null,
        0,
        formatPrimaryShortcutLabel("a"),
        !hasText,
        handle,
      ),
    );
    return items;
  }

  private static resolveSelectedText(target: TextCore): string {
    const selectionStart = this.resolveSelectionStart(target);
    const selectionEnd = this.resolveSelectionEnd(target);
    if (selectionStart == selectionEnd) {
      return "";
    }
    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart < selectionEnd ? selectionEnd : selectionStart;
    return this.resolveTextContent(target).substring(start, end);
  }

  private static resolveSelectionStart(target: TextCore): u32 {
    const parent = target.parentNode;
    if (parent instanceof TextInputCore) {
      return changetype<TextInputCore>(parent).selectionStart;
    }
    return target.selectionStart;
  }

  private static resolveSelectionEnd(target: TextCore): u32 {
    const parent = target.parentNode;
    if (parent instanceof TextInputCore) {
      return changetype<TextInputCore>(parent).selectionEnd;
    }
    return target.selectionEnd;
  }

  private static resolveSelectionStartByte(target: TextCore): u32 {
    const parent = target.parentNode;
    if (parent instanceof TextInputCore) {
      return changetype<TextInputCore>(parent).selectionStartByteOffset;
    }
    return target.selectionStart;
  }

  private static resolveSelectionEndByte(target: TextCore): u32 {
    const parent = target.parentNode;
    if (parent instanceof TextInputCore) {
      return changetype<TextInputCore>(parent).selectionEndByteOffset;
    }
    return target.selectionEnd;
  }

  private static resolveTextContent(target: TextCore): string {
    const parent = target.parentNode;
    if (parent instanceof TextInputCore) {
      return changetype<TextInputCore>(parent).value;
    }
    return target.content;
  }

  private static resolveDirectImageUrl(node: Node): string | null {
    if (node instanceof Image) {
      const url = changetype<Image>(node).assetUrl();
      return this.isBrowsableImageUrl(url) ? url : null;
    }
    if (node instanceof Svg) {
      const url = changetype<Svg>(node).assetUrl();
      return this.isBrowsableImageUrl(url) ? url : null;
    }
    return null;
  }

  private static resolveDescendantImageUrl(node: Node, pointX: f32, pointY: f32): string | null {
    for (let index = 0; index < node.childCount; ++index) {
      const child = node.getChildAt(index);
      if (child === null) {
        continue;
      }
      const childNode = changetype<Node>(child);
      const childBounds = childNode.builtHandle != <u64>HandleValue.Invalid
        ? ui.tryGetBounds(childNode.builtHandle)
        : null;
      if (childBounds === null || !this.boundsContainPoint(changetype<Float32Array>(childBounds), pointX, pointY)) {
        continue;
      }
      const directUrl = this.resolveDirectImageUrl(childNode);
      if (directUrl !== null && directUrl.length > 0) {
        return directUrl;
      }
      const descendantUrl = this.resolveDescendantImageUrl(childNode, pointX, pointY);
      if (descendantUrl !== null && descendantUrl.length > 0) {
        return descendantUrl;
      }
    }
    return null;
  }

  private static boundsContainPoint(bounds: Float32Array, pointX: f32, pointY: f32): bool {
    const x = unchecked(bounds[0]);
    const y = unchecked(bounds[1]);
    const width = unchecked(bounds[2]);
    const height = unchecked(bounds[3]);
    return pointX >= x && pointX <= (x + width) && pointY >= y && pointY <= (y + height);
  }

  private static selectionHintContainsHandle(handle: u64): bool {
    if (handle == <u64>HandleValue.Invalid) {
      return false;
    }
    for (let index = 0; index < this.currentSelectionHandleHints.length; ++index) {
      if (unchecked(this.currentSelectionHandleHints[index]) == handle) {
        return true;
      }
    }
    return false;
  }

  private static pushUniqueHandle(handles: Array<u64>, handle: u64): void {
    for (let index = 0; index < handles.length; ++index) {
      if (unchecked(handles[index]) == handle) {
        return;
      }
    }
    handles.push(handle);
  }

  private static releaseActiveMenuLinkPreview(): void {
    const link = this.activeMenuLink;
    if (link === null) {
      return;
    }
    link.releasePreviewForContextMenu();
    this.activeMenuLink = null;
  }

  private static isBrowsableImageUrl(url: string): bool {
    if (url.length == 0) {
      return false;
    }
    if (url.length >= 5 && url.substring(0, 5) == "data:") {
      return false;
    }
    if (url.length >= 5 && url.substring(0, 5) == "blob:") {
      return false;
    }
    return true;
  }
}
