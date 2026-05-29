import { CursorStyle, fui_set_cursor, HandleValue, KeyEventType, PointerEventType } from "./ffi";
import {
  resetKeyboardFocusVisibility,
  showKeyboardFocusForKeyEvent,
  showKeyboardFocusForPointerEvent,
} from "./FocusVisibility";
import { ToolTipManager } from "./ToolTipManager";
import {
  registerKeyboardScrollNode,
  resetKeyboardScrollTracking,
  trackKeyboardScrollPointerUp,
  unregisterKeyboardScrollNode,
} from "./KeyboardScrollTracker";
import { DragDropEffects, DragSession, ExternalDropItemInfo, Node } from "./Node";
import { DragDropManager } from "./DragDropManager";
import { ExternalDragEventType, ExternalDropManager } from "./ExternalDropManager";
import { isCoarsePointer } from "./Platform";

export interface GlobalKeyHandler {
  handleGlobalKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool;
}

function getHandleIndex(handle: u64): u32 {
  return <u32>handle;
}

function getGeneration(handle: u64): u32 {
  return <u32>(handle >> 32);
}

export class EventRouter {
  private static readonly nodes: Map<u32, Node> = new Map<u32, Node>();
  private static readonly generations: Map<u32, u32> = new Map<u32, u32>();
  private static readonly hoverStack: Array<Node> = new Array<Node>();
  private static readonly keyFilterHandlers: Array<GlobalKeyHandler> = new Array<GlobalKeyHandler>();
  private static readonly keyFilterTokens: Array<u32> = new Array<u32>();
  private static capturedPointerHandle: u64 = <u64>HandleValue.Invalid;
  private static currentCursorStyle: CursorStyle = CursorStyle.Default;
  private static nextKeyFilterToken: u32 = 1;
  private static focusedNode: Node | null = null;

  static register(handle: u64, node: Node): void {
    const index = getHandleIndex(handle);
    node._bindRegisteredHandle(handle);
    this.nodes.set(index, node);
    this.generations.set(index, getGeneration(handle));
    registerKeyboardScrollNode(node);
  }

  static unregister(handle: u64): void {
    const node = this.resolveNode(handle);
    if (node !== null) {
      DragDropManager.handleNodeDestroyed(changetype<Node>(node));
      ExternalDropManager.handleNodeDestroyed(changetype<Node>(node));
      this.removeFromHoverStack(changetype<Node>(node));
      if (this.focusedNode === node) {
        this.focusedNode = null;
      }
      unregisterKeyboardScrollNode(changetype<Node>(node));
    }
    if (this.capturedPointerHandle == handle) {
      this.capturedPointerHandle = <u64>HandleValue.Invalid;
    }
    const index = getHandleIndex(handle);
    this.nodes.delete(index);
    this.generations.delete(index);
    this.applyCurrentCursor();
  }

  static dispatchPointerEvent(handle: u64, eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    showKeyboardFocusForPointerEvent(eventType);
    const pointedNode = this.resolveNode(handle);
    if (eventType == PointerEventType.Up) {
      trackKeyboardScrollPointerUp(pointedNode, x, y);
    }
    if (eventType == PointerEventType.Move || eventType == PointerEventType.Up) {
      const capturedNode = this.resolveNode(this.capturedPointerHandle);
      if (capturedNode !== null) {
        const capturedHandle = this.capturedPointerHandle;
        capturedNode._handlePointerEvent(eventType, x, y, modifiers);
        DragDropManager.handlePointerEvent(pointedNode, eventType, x, y, modifiers);
        if (eventType == PointerEventType.Up && this.capturedPointerHandle == capturedHandle) {
          this.capturedPointerHandle = <u64>HandleValue.Invalid;
        }
        this.applyCurrentCursor();
        return;
      }
      if (this.capturedPointerHandle != <u64>HandleValue.Invalid) {
        this.capturedPointerHandle = <u64>HandleValue.Invalid;
      }
    }

    if (handle == <u64>HandleValue.Invalid) {
      if (eventType == PointerEventType.Leave) {
        this.clearHoverStack();
      }
      DragDropManager.handlePointerEvent(null, eventType, x, y, modifiers);
      this.applyCurrentCursor();
      return;
    }

    const node = pointedNode;
    if (node === null) {
      if (eventType == PointerEventType.Leave) {
        this.clearHoverStack();
      }
      DragDropManager.handlePointerEvent(null, eventType, x, y, modifiers);
      this.applyCurrentCursor();
      return;
    }
    if (eventType == PointerEventType.Enter) {
      this.pushHover(changetype<Node>(node));
    } else if (eventType == PointerEventType.Leave) {
      this.popHover(changetype<Node>(node));
    }
    node._handlePointerEvent(eventType, x, y, modifiers);
    DragDropManager.handlePointerEvent(node, eventType, x, y, modifiers);
    this.applyCurrentCursor();
  }

  static dispatchFocusChanged(handle: u64, focused: bool): void {
    const node = this.resolveNode(handle);
    if (node === null) {
      return;
    }
    if (focused) {
      this.focusedNode = node;
    } else if (this.focusedNode === node) {
      this.focusedNode = null;
    }
    node._handleFocusChanged(focused);
  }

  static dispatchKeyEvent(handle: u64, eventType: KeyEventType, key: string, modifiers: u32): bool {
    showKeyboardFocusForKeyEvent(eventType, key, modifiers);
    const node = this.resolveNode(handle);
    if (node === null) {
      return false;
    }
    return node._handleKeyEvent(eventType, key, modifiers);
  }

  static dispatchGlobalKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    showKeyboardFocusForKeyEvent(eventType, key, modifiers);
    for (let index = this.keyFilterHandlers.length - 1; index >= 0; --index) {
      const handler = unchecked(this.keyFilterHandlers[index]);
      if (handler.handleGlobalKeyEvent(eventType, key, modifiers)) {
        return true;
      }
    }
    return false;
  }

  static dispatchScroll(
    handle: u64,
    offsetX: f32,
    offsetY: f32,
    contentWidth: f32,
    contentHeight: f32,
    viewportWidth: f32,
    viewportHeight: f32,
  ): void {
    ToolTipManager.handleScroll();
    const node = this.resolveNode(handle);
    if (node === null) {
      return;
    }
    node._handleScroll(offsetX, offsetY, contentWidth, contentHeight, viewportWidth, viewportHeight);
  }

  static dispatchTextChanged(handle: u64, text: string): void {
    const node = this.resolveNode(handle);
    if (node === null) {
      return;
    }
    node._handleTextChanged(text);
  }

  static dispatchTextReplaced(handle: u64, start: u32, end: u32, text: string): void {
    const node = this.resolveNode(handle);
    if (node === null) {
      return;
    }
    node._handleTextReplaced(start, end, text);
  }

  static dispatchSelectionChanged(handle: u64, start: u32, end: u32): void {
    const node = this.resolveNode(handle);
    if (node === null) {
      return;
    }
    node._handleSelectionChanged(start, end);
  }

  static dispatchCrossSelectionChanged(handle: u64, text: string): void {
    const node = this.resolveNode(handle);
    if (node === null) {
      return;
    }
    node._handleCrossSelectionChanged(text);
  }

  static dispatchExternalDropEvent(
    handle: u64,
    eventType: ExternalDragEventType,
    x: f32,
    y: f32,
    modifiers: u32,
    items: Array<ExternalDropItemInfo>,
  ): DragDropEffects {
    return ExternalDropManager.handleEvent(this.resolveNode(handle), eventType, x, y, modifiers, items);
  }

  static getRegisteredNode(handle: u64): Node | null {
    return this.resolveNode(handle);
  }

  static getFocusedNode(): Node | null {
    return this.focusedNode;
  }

  static capturePointer(handle: u64): void {
    if (this.resolveNode(handle) === null) {
      return;
    }
    this.capturedPointerHandle = handle;
    this.applyCurrentCursor();
  }

  static releasePointer(handle: u64): void {
    if (this.capturedPointerHandle == handle) {
      this.capturedPointerHandle = <u64>HandleValue.Invalid;
      this.applyCurrentCursor();
    }
  }

  static reset(): void {
    this.nodes.clear();
    this.generations.clear();
    this.capturedPointerHandle = <u64>HandleValue.Invalid;
    this.hoverStack.length = 0;
    this.focusedNode = null;
    this.keyFilterHandlers.length = 0;
    this.keyFilterTokens.length = 0;
    this.nextKeyFilterToken = 1;
    resetKeyboardFocusVisibility();
    resetKeyboardScrollTracking();
    DragDropManager.reset();
    ExternalDropManager.reset();
    this.applyCursor(CursorStyle.Default);
  }

  static beginDragSession(source: Node): bool {
    return DragDropManager.beginSession(source);
  }

  static cancelDragSession(session: DragSession): void {
    DragDropManager.cancelSession(session);
    this.applyCurrentCursor();
  }

  static cancelDragSessionForSource(source: Node): void {
    DragDropManager.cancelSessionForSource(source);
    this.applyCurrentCursor();
  }

  static pushKeyFilter(handler: GlobalKeyHandler): u32 {
    const token = this.nextKeyFilterToken;
    this.nextKeyFilterToken += 1;
    this.keyFilterHandlers.push(handler);
    this.keyFilterTokens.push(token);
    return token;
  }

  static removeKeyFilter(token: u32): void {
    for (let index = this.keyFilterTokens.length - 1; index >= 0; --index) {
      if (unchecked(this.keyFilterTokens[index]) != token) {
        continue;
      }
      for (let cursor = index; cursor < this.keyFilterTokens.length - 1; ++cursor) {
        unchecked(this.keyFilterTokens[cursor] = unchecked(this.keyFilterTokens[cursor + 1]));
        unchecked(this.keyFilterHandlers[cursor] = unchecked(this.keyFilterHandlers[cursor + 1]));
      }
      this.keyFilterTokens.length = this.keyFilterTokens.length - 1;
      this.keyFilterHandlers.length = this.keyFilterHandlers.length - 1;
      return;
    }
  }

  static removeFromHoverStack(node: Node): void {
    const index = this.indexOfHoveredNode(node);
    if (index < 0) {
      return;
    }
    this.removeHoverAt(index);
    this.applyCurrentCursor();
  }

  static handleCursorStyleChanged(node: Node): void {
    const captured = this.resolveCapturedNode();
    if (captured === node) {
      this.applyCurrentCursor();
      return;
    }
    if (captured !== null) {
      return;
    }
    if (this.hoverStack.length == 0) {
      return;
    }
    const top = unchecked(this.hoverStack[this.hoverStack.length - 1]);
    if (top === node) {
      this.applyCursor(node.cursorStyle);
    }
  }

  private static resolveNode(handle: u64): Node | null {
    if (handle == <u64>HandleValue.Invalid) {
      return null;
    }
    const index = getHandleIndex(handle);
    if (!this.generations.has(index)) {
      return null;
    }
    const generation = this.generations.get(index);
    if (generation != getGeneration(handle) || !this.nodes.has(index)) {
      return null;
    }
    return this.nodes.get(index);
  }

  private static pushHover(node: Node): void {
    const existingIndex = this.indexOfHoveredNode(node);
    if (existingIndex >= 0) {
      this.removeHoverAt(existingIndex);
    }
    this.hoverStack.push(node);
    this.applyCurrentCursor();
  }

  private static popHover(node: Node): void {
    const index = this.indexOfHoveredNode(node);
    if (index < 0) {
      return;
    }
    this.removeHoverAt(index);
    this.applyCurrentCursor();
  }

  private static clearHoverStack(): void {
    if (this.hoverStack.length == 0) {
      this.applyCurrentCursor();
      return;
    }
    this.hoverStack.length = 0;
    this.applyCurrentCursor();
  }

  private static resolveCapturedNode(): Node | null {
    return this.resolveNode(this.capturedPointerHandle);
  }

  private static applyCurrentCursor(): void {
    const dragCursor = DragDropManager.cursorOverrideStyle();
    if (dragCursor != CursorStyle.Default) {
      this.applyCursor(dragCursor);
      return;
    }
    const captured = this.resolveCapturedNode();
    if (captured !== null) {
      this.applyCursor(captured.cursorStyle);
      return;
    }
    if (this.hoverStack.length == 0) {
      this.applyCursor(CursorStyle.Default);
      return;
    }
    const top = unchecked(this.hoverStack[this.hoverStack.length - 1]);
    this.applyCursor(top.cursorStyle);
  }

  private static applyCursor(style: CursorStyle): void {
    if (this.currentCursorStyle == style) {
      return;
    }
    this.currentCursorStyle = style;
    if (isCoarsePointer()) {
      return;
    }
    fui_set_cursor(<u32>style);
  }

  private static indexOfHoveredNode(target: Node): i32 {
    for (let index = this.hoverStack.length - 1; index >= 0; --index) {
      if (unchecked(this.hoverStack[index]) === target) {
        return index;
      }
    }
    return -1;
  }

  private static removeHoverAt(index: i32): void {
    for (let cursor = index; cursor < this.hoverStack.length - 1; ++cursor) {
      unchecked(this.hoverStack[cursor] = unchecked(this.hoverStack[cursor + 1]));
    }
    this.hoverStack.length = this.hoverStack.length - 1;
  }
}
