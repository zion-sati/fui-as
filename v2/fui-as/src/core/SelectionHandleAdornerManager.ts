import { FlexBox, Portal } from "../nodes";
import { PointerEventType, Unit, Visibility, fui_is_coarse_pointer } from "./ffi";
import { MobileTextSelectionToolbarManager } from "./MobileTextSelectionToolbarManager";
import { Node, PointerEventArgs, PointerType } from "./Node";
import * as ui from "../bindings/ui";

const HANDLE_COLOR: u32 = 0x0a84ffff;
const HIT_TARGET_SIZE: f32 = 90.0;
const HIT_TARGET_PADDING: f32 = 25.0;
const START_ANCHOR_WIDTH: f32 = 0.0;
const KNOB_SIZE: f32 = 18.0;
const SHOULDER_SIZE: f32 = 8.0;
const KNOB_Y: f32 = HIT_TARGET_PADDING;
const SHOULDER_Y: f32 = HIT_TARGET_PADDING;
const START_STEM_X: f32 = 72.0;
const END_STEM_X: f32 = 18.0;

export enum SelectionHandleMode {
  Auto = 0,
  Always = 1,
  Disabled = 2,
}

enum SelectionHandleSide {
  Start = 0,
  End = 1,
}

enum SelectionHandleDragSide {
  None = -1,
  Start = 0,
  End = 1,
}

function handleStemX(side: SelectionHandleSide): f32 {
  return side == SelectionHandleSide.Start ? START_STEM_X : END_STEM_X;
}

function handleKnobX(side: SelectionHandleSide): f32 {
  return side == SelectionHandleSide.Start
    ? handleStemX(side) - KNOB_SIZE + START_ANCHOR_WIDTH
    : handleStemX(side);
}

function handleShoulderX(side: SelectionHandleSide): f32 {
  const knobX = handleKnobX(side);
  return side == SelectionHandleSide.Start
    ? knobX + KNOB_SIZE - SHOULDER_SIZE
    : knobX;
}

function makeKnob(side: SelectionHandleSide): FlexBox {
  return new FlexBox()
    .positionAbsolute()
    .position(handleKnobX(side), KNOB_Y)
    .width(KNOB_SIZE, Unit.Pixel)
    .height(KNOB_SIZE, Unit.Pixel)
    .cornerRadius(KNOB_SIZE * 0.5)
    .bgColor(HANDLE_COLOR)
    .border(1.0, 0x00000022)
    .preserveSelectionOnPointerDown(true) as FlexBox;
}

function makeShoulder(side: SelectionHandleSide): FlexBox {
  return new FlexBox()
    .positionAbsolute()
    .position(handleShoulderX(side), SHOULDER_Y)
    .width(SHOULDER_SIZE, Unit.Pixel)
    .height(SHOULDER_SIZE, Unit.Pixel)
    .bgColor(HANDLE_COLOR)
    .preserveSelectionOnPointerDown(true) as FlexBox;
}

function makeHandle(side: SelectionHandleSide): FlexBox {
  const knob = makeKnob(side);
  const shoulder = makeShoulder(side);
  if (side == SelectionHandleSide.Start) {
    knob.onPointerDown(handleStartPointerDown);
    shoulder.onPointerDown(handleStartPointerDown);
  } else {
    knob.onPointerDown(handleEndPointerDown);
    shoulder.onPointerDown(handleEndPointerDown);
  }
  knob
    .onPointerMove(handlePointerMove)
    .onPointerUp(handlePointerUp)
    .onPointerCancel(handlePointerCancel);
  shoulder
    .onPointerMove(handlePointerMove)
    .onPointerUp(handlePointerUp)
    .onPointerCancel(handlePointerCancel);
  const handle = new FlexBox()
    .positionAbsolute()
    .width(HIT_TARGET_SIZE, Unit.Pixel)
    .height(HIT_TARGET_SIZE, Unit.Pixel)
    .bgColor(0x00000000)
    .child(knob)
    .child(shoulder)
    .visibility(Visibility.Hidden)
    .preserveSelectionOnPointerDown(true) as FlexBox;
  return handle;
}

function handleStartPointerDown(event: PointerEventArgs): void {
  SelectionHandleAdornerManager.handleStartPointerDown(event);
}

function handleEndPointerDown(event: PointerEventArgs): void {
  SelectionHandleAdornerManager.handleEndPointerDown(event);
}

function handlePointerMove(event: PointerEventArgs): void {
  SelectionHandleAdornerManager.handlePointerMove(event);
}

function handlePointerUp(event: PointerEventArgs): void {
  SelectionHandleAdornerManager.handlePointerUp(event);
}

function handlePointerCancel(event: PointerEventArgs): void {
  SelectionHandleAdornerManager.handlePointerCancel(event);
}

export class SelectionHandleAdornerManager {
  private static hostRoot: Portal | null = null;
  private static startHandle: FlexBox | null = null;
  private static endHandle: FlexBox | null = null;
  private static activeHandle: u64 = 0;
  private static activeStart: u32 = 0;
  private static activeEnd: u32 = 0;
  private static activeUsesRangeGeometry: bool = false;
  private static activeUsesCrossGeometry: bool = false;
  private static modeValue: SelectionHandleMode = SelectionHandleMode.Auto;
  private static lastPointerType: PointerType = PointerType.Unknown;
  private static draggingSide: SelectionHandleDragSide = SelectionHandleDragSide.None;
  private static draggingCapturedVisualSide: SelectionHandleDragSide = SelectionHandleDragSide.None;
  private static startAnchorX: f32 = 0.0;
  private static startAnchorY: f32 = 0.0;
  private static endAnchorX: f32 = 0.0;
  private static endAnchorY: f32 = 0.0;
  private static hasStartAnchor: bool = false;
  private static hasEndAnchor: bool = false;
  private static stationaryAnchorX: f32 = 0.0;
  private static stationaryAnchorY: f32 = 0.0;
  private static hasStationaryAnchor: bool = false;

  static createDefaultHost(): Portal {
    const existingHost = this.hostRoot;
    if (existingHost !== null) {
      return existingHost;
    }
    const startHandle = makeHandle(SelectionHandleSide.Start);
    const endHandle = makeHandle(SelectionHandleSide.End);
    startHandle
      .onPointerDown(handleStartPointerDown)
      .onPointerMove(handlePointerMove)
      .onPointerUp(handlePointerUp)
      .onPointerCancel(handlePointerCancel);
    endHandle
      .onPointerDown(handleEndPointerDown)
      .onPointerMove(handlePointerMove)
      .onPointerUp(handlePointerUp)
      .onPointerCancel(handlePointerCancel);
    const hostRoot = new Portal()
      .positionAbsolute()
      .position(0.0, 0.0)
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .child(startHandle)
      .child(endHandle) as Portal;
    this.hostRoot = hostRoot;
    this.startHandle = startHandle;
    this.endHandle = endHandle;
    return hostRoot;
  }

  static clear(): void {
    if (this.draggingSide != SelectionHandleDragSide.None) {
      this.endHandleDrag();
    }
    this.activeHandle = 0;
    this.activeStart = 0;
    this.activeEnd = 0;
    this.activeUsesRangeGeometry = false;
    this.activeUsesCrossGeometry = false;
    this.draggingSide = SelectionHandleDragSide.None;
    this.draggingCapturedVisualSide = SelectionHandleDragSide.None;
    this.hasStationaryAnchor = false;
    this.hideHandles();
  }

  static reset(): void {
    const hostRoot = this.hostRoot;
    if (hostRoot !== null) {
      hostRoot.dispose();
    }
    this.hostRoot = null;
    this.startHandle = null;
    this.endHandle = null;
    this.activeHandle = 0;
    this.activeStart = 0;
    this.activeEnd = 0;
    this.activeUsesRangeGeometry = false;
    this.activeUsesCrossGeometry = false;
    this.modeValue = SelectionHandleMode.Auto;
    this.lastPointerType = PointerType.Unknown;
    this.draggingSide = SelectionHandleDragSide.None;
    this.draggingCapturedVisualSide = SelectionHandleDragSide.None;
    this.startAnchorX = 0.0;
    this.startAnchorY = 0.0;
    this.endAnchorX = 0.0;
    this.endAnchorY = 0.0;
    this.hasStartAnchor = false;
    this.hasEndAnchor = false;
    this.stationaryAnchorX = 0.0;
    this.stationaryAnchorY = 0.0;
    this.hasStationaryAnchor = false;
  }

  static setMode(mode: SelectionHandleMode): void {
    this.modeValue = mode;
    if (mode == SelectionHandleMode.Disabled) {
      this.clear();
    }
  }

  static mode(): SelectionHandleMode {
    return this.modeValue;
  }

  static recordPointerEvent(eventType: PointerEventType, pointerType: PointerType): void {
    if (eventType == PointerEventType.Down) {
      this.lastPointerType = pointerType;
    }
  }

  static handleSelectionChanged(handle: u64, start: u32, end: u32): void {
    if (start == end || !this.shouldShow()) {
      if (start == end && this.draggingSide != SelectionHandleDragSide.None && this.activeHandle == handle) {
        this.activeStart = start;
        this.activeEnd = end;
        this.ensureHost();
        this.positionRangeHandles();
        this.showNonDraggedHandles();
        return;
      }
      this.clear();
      return;
    }
    this.activeHandle = handle;
    this.activeStart = start;
    this.activeEnd = end;
    this.activeUsesRangeGeometry = true;
    this.activeUsesCrossGeometry = false;
    this.ensureHost();
    if (!this.positionRangeHandles()) {
      this.clear();
      return;
    }
    if (this.draggingSide != SelectionHandleDragSide.None) {
      this.showNonDraggedHandles();
      return;
    }
    this.showHandles();
  }

  static handleCrossSelectionChanged(handle: u64, text: string): void {
    if (text.length == 0 || !this.shouldShow()) {
      if (text.length == 0 && this.draggingSide != SelectionHandleDragSide.None && this.activeHandle == handle) {
        this.activeStart = 0;
        this.activeEnd = 0;
        this.ensureHost();
        this.showNonDraggedHandles();
        return;
      }
      this.clear();
      return;
    }
    this.activeHandle = handle;
    this.activeStart = 0;
    this.activeEnd = <u32>text.length;
    this.activeUsesRangeGeometry = true;
    this.activeUsesCrossGeometry = true;
    this.ensureHost();
    if (!this.positionCrossSelectionHandles()) {
      this.activeUsesRangeGeometry = false;
      this.activeUsesCrossGeometry = false;
      this.positionPlaceholderHandles();
    }
    if (this.draggingSide != SelectionHandleDragSide.None) {
      this.showNonDraggedHandles();
      return;
    }
    this.showHandles();
  }

  static refreshActiveGeometry(): void {
    if (this.activeHandle == 0 || !this.activeUsesRangeGeometry) {
      return;
    }
    if (this.activeUsesCrossGeometry) {
      if (!this.positionCrossSelectionHandles()) {
        this.clear();
      }
      return;
    }
    if (!this.positionRangeHandles()) {
      this.clear();
    }
  }

  static isVisible(): bool {
    return this.activeHandle != 0;
  }

  static activeTextHandle(): u64 {
    return this.activeHandle;
  }

  static activeSelectionStart(): u32 {
    return this.activeStart;
  }

  static activeSelectionEnd(): u32 {
    return this.activeEnd;
  }

  static startHandleNode(): Node | null {
    return this.startHandle;
  }

  static endHandleNode(): Node | null {
    return this.endHandle;
  }

  private static ensureHost(): void {
    if (this.hostRoot === null) {
      this.createDefaultHost();
    }
  }

  private static shouldShow(): bool {
    if (this.modeValue == SelectionHandleMode.Disabled) {
      return false;
    }
    if (this.modeValue == SelectionHandleMode.Always) {
      return true;
    }
    if (this.lastPointerType == PointerType.Touch) {
      return true;
    }
    if (this.lastPointerType != PointerType.Unknown) {
      return false;
    }
    return fui_is_coarse_pointer();
  }

  private static showHandles(): void {
    const startHandle = this.startHandle;
    const endHandle = this.endHandle;
    if (startHandle !== null) {
      startHandle.visibility(Visibility.Normal);
      this.setHandleChromeVisibility(startHandle, Visibility.Normal);
    }
    if (endHandle !== null) {
      endHandle.visibility(Visibility.Normal);
      this.setHandleChromeVisibility(endHandle, Visibility.Normal);
    }
  }

  private static hideHandle(side: SelectionHandleDragSide): void {
    const handle = side == SelectionHandleDragSide.Start ? this.startHandle : this.endHandle;
    if (handle !== null) {
      handle.visibility(Visibility.Normal);
      this.setHandleChromeVisibility(handle, Visibility.Hidden);
    }
  }

  private static showHandle(side: SelectionHandleDragSide): void {
    const handle = side == SelectionHandleDragSide.Start ? this.startHandle : this.endHandle;
    if (handle !== null) {
      handle.visibility(Visibility.Normal);
      this.setHandleChromeVisibility(handle, Visibility.Normal);
    }
  }

  private static showNonDraggedHandles(): void {
    const hiddenVisualSide = this.draggingCapturedVisualSide;
    const startHandle = this.startHandle;
    const endHandle = this.endHandle;
    if (startHandle !== null) {
      startHandle.visibility(Visibility.Normal);
      this.setHandleChromeVisibility(
        startHandle,
        hiddenVisualSide == SelectionHandleDragSide.Start ? Visibility.Hidden : Visibility.Normal,
      );
    }
    if (endHandle !== null) {
      endHandle.visibility(Visibility.Normal);
      this.setHandleChromeVisibility(
        endHandle,
        hiddenVisualSide == SelectionHandleDragSide.End ? Visibility.Hidden : Visibility.Normal,
      );
    }
  }

  private static hideHandles(): void {
    const startHandle = this.startHandle;
    const endHandle = this.endHandle;
    if (startHandle !== null) {
      this.setHandleChromeVisibility(startHandle, Visibility.Normal);
      startHandle.visibility(Visibility.Hidden);
    }
    if (endHandle !== null) {
      this.setHandleChromeVisibility(endHandle, Visibility.Normal);
      endHandle.visibility(Visibility.Hidden);
    }
  }

  private static setHandleChromeVisibility(handle: Node, visibility: Visibility): void {
    for (let i = 0; i < handle.childCount; i += 1) {
      const child = handle.getChildAt(i);
      if (child !== null) {
        child.visibility(visibility);
      }
    }
  }

  static handleStartPointerDown(event: PointerEventArgs): void {
    event.handled = SelectionHandleAdornerManager.beginHandleDrag(
      SelectionHandleAdornerManager.semanticSideForVisualSide(SelectionHandleDragSide.Start),
      SelectionHandleDragSide.Start,
      event.pointerType,
    );
  }

  static handleEndPointerDown(event: PointerEventArgs): void {
    event.handled = SelectionHandleAdornerManager.beginHandleDrag(
      SelectionHandleAdornerManager.semanticSideForVisualSide(SelectionHandleDragSide.End),
      SelectionHandleDragSide.End,
      event.pointerType,
    );
  }

  static handlePointerMove(event: PointerEventArgs): void {
    if (SelectionHandleAdornerManager.draggingSide == SelectionHandleDragSide.None) {
      return;
    }
    event.handled = true;
    SelectionHandleAdornerManager.refreshActiveGeometry();
    SelectionHandleAdornerManager.showNonDraggedHandles();
  }

  static handlePointerUp(event: PointerEventArgs): void {
    if (SelectionHandleAdornerManager.draggingSide == SelectionHandleDragSide.None) {
      return;
    }
    event.handled = true;
    SelectionHandleAdornerManager.endHandleDrag();
  }

  static handlePointerCancel(event: PointerEventArgs): void {
    if (SelectionHandleAdornerManager.draggingSide == SelectionHandleDragSide.None) {
      return;
    }
    event.handled = true;
    SelectionHandleAdornerManager.endHandleDrag();
  }

  static routeActiveHandleDragEvent(event: PointerEventArgs): bool {
    if (SelectionHandleAdornerManager.draggingSide == SelectionHandleDragSide.None) {
      return false;
    }
    if (event.eventType == PointerEventType.Move) {
      SelectionHandleAdornerManager.handlePointerMove(event);
      return event.handled;
    }
    if (event.eventType == PointerEventType.Up) {
      SelectionHandleAdornerManager.handlePointerUp(event);
      return event.handled;
    }
    if (event.eventType == PointerEventType.Cancel) {
      SelectionHandleAdornerManager.handlePointerCancel(event);
      return event.handled;
    }
    return false;
  }

  private static beginHandleDrag(
    side: SelectionHandleDragSide,
    visualSide: SelectionHandleDragSide,
    pointerType: PointerType,
  ): bool {
    if (pointerType != PointerType.Touch && pointerType != PointerType.Pen) {
      return false;
    }
    if (this.activeHandle == 0) {
      return false;
    }
    if (!this.captureStationaryAnchor(visualSide)) {
      return false;
    }
    const handle = visualSide == SelectionHandleDragSide.Start ? this.startHandle : this.endHandle;
    if (handle === null) {
      this.hasStationaryAnchor = false;
      return false;
    }
    this.draggingSide = side;
    this.draggingCapturedVisualSide = visualSide;
    if (!ui.beginSelectionEndpointDrag(this.activeHandle, <u32>side)) {
      this.draggingSide = SelectionHandleDragSide.None;
      this.draggingCapturedVisualSide = SelectionHandleDragSide.None;
      this.hasStationaryAnchor = false;
      return false;
    }
    MobileTextSelectionToolbarManager.hideForHandleDrag();
    handle._captureDragPointer();
    this.setHandleHitTestVisible(visualSide, false);
    this.hideHandle(visualSide);
    this.showHandle(visualSide == SelectionHandleDragSide.Start ? SelectionHandleDragSide.End : SelectionHandleDragSide.Start);
    return true;
  }

  private static semanticSideForVisualSide(visualSide: SelectionHandleDragSide): SelectionHandleDragSide {
    if (visualSide == SelectionHandleDragSide.None) {
      return SelectionHandleDragSide.None;
    }
    const forward = this.activeStart <= this.activeEnd;
    if (visualSide == SelectionHandleDragSide.Start) {
      return forward ? SelectionHandleDragSide.Start : SelectionHandleDragSide.End;
    }
    return forward ? SelectionHandleDragSide.End : SelectionHandleDragSide.Start;
  }

  private static endHandleDrag(): void {
    const visualSide = this.draggingCapturedVisualSide;
    const handle = visualSide == SelectionHandleDragSide.Start ? this.startHandle : this.endHandle;
    if (handle !== null) {
      handle._releaseDragPointer();
    }
    this.setHandleHitTestVisible(visualSide, true);
    this.draggingSide = SelectionHandleDragSide.None;
    this.draggingCapturedVisualSide = SelectionHandleDragSide.None;
    this.hasStationaryAnchor = false;
    if (this.activeStart == this.activeEnd) {
      this.clear();
      return;
    }
    this.refreshActiveGeometry();
    this.showHandles();
    MobileTextSelectionToolbarManager.showAfterHandleDrag(this.isVisible());
  }

  private static setHandleHitTestVisible(side: SelectionHandleDragSide, visible: bool): void {
    const handle = side == SelectionHandleDragSide.Start ? this.startHandle : this.endHandle;
    if (handle === null || handle.builtHandle == 0) {
      return;
    }
    ui.setInteractive(handle.builtHandle, visible);
  }

  private static positionPlaceholderHandles(): void {
    const startHandle = this.startHandle;
    const endHandle = this.endHandle;
    if (startHandle !== null) {
      startHandle.position(0.0, 0.0);
    }
    if (endHandle !== null) {
      endHandle.position(HIT_TARGET_SIZE + 8.0, 0.0);
    }
  }

  private static positionRangeHandles(): bool {
    const startHandle = this.startHandle;
    const endHandle = this.endHandle;
    if (startHandle === null || endHandle === null || this.activeHandle == 0) {
      return false;
    }
    let rangeStart = this.activeStart;
    let rangeEnd = this.activeEnd;
    if (rangeEnd < rangeStart) {
      const swap = rangeStart;
      rangeStart = rangeEnd;
      rangeEnd = swap;
    }
    const rects = ui.getTextRangeRects(this.activeHandle, rangeStart, rangeEnd);
    if (rects.length == 0) {
      return false;
    }
    const firstRect = unchecked(rects[0]);
    const lastRect = unchecked(rects[rects.length - 1]);
    if (this.draggingSide != SelectionHandleDragSide.None) {
      this.positionDraggingRangeHandles(firstRect.x, firstRect.y + firstRect.height, lastRect.x + lastRect.width, lastRect.y + lastRect.height);
      return true;
    }
    this.positionStartHandle(firstRect.x, firstRect.y + firstRect.height);
    this.positionEndHandle(lastRect.x + lastRect.width, lastRect.y + lastRect.height);
    return true;
  }

  private static positionDraggingRangeHandles(lowerX: f32, lowerY: f32, upperX: f32, upperY: f32): void {
    const forward = this.activeStart <= this.activeEnd;
    const draggingStart = this.draggingSide == SelectionHandleDragSide.Start;
    const movingIsLower = draggingStart == forward;
    let movingX = movingIsLower ? lowerX : upperX;
    let movingY = movingIsLower ? lowerY : upperY;
    let stationaryX = movingIsLower ? upperX : lowerX;
    let stationaryY = movingIsLower ? upperY : lowerY;
    if (this.hasStationaryAnchor) {
      stationaryX = this.stationaryAnchorX;
      stationaryY = this.stationaryAnchorY;
      const lowerDistance = this.distanceSquared(lowerX, lowerY, stationaryX, stationaryY);
      const upperDistance = this.distanceSquared(upperX, upperY, stationaryX, stationaryY);
      if (upperDistance >= lowerDistance) {
        movingX = upperX;
        movingY = upperY;
      } else {
        movingX = lowerX;
        movingY = lowerY;
      }
    }
    if (this.draggingCapturedVisualSide == SelectionHandleDragSide.Start) {
      this.positionStartHandle(movingX, movingY);
      this.positionEndHandle(stationaryX, stationaryY);
    } else {
      this.positionStartHandle(stationaryX, stationaryY);
      this.positionEndHandle(movingX, movingY);
    }
  }

  private static distanceSquared(leftX: f32, leftY: f32, rightX: f32, rightY: f32): f32 {
    const dx = leftX - rightX;
    const dy = leftY - rightY;
    return dx * dx + dy * dy;
  }

  private static positionCrossSelectionHandles(): bool {
    const startHandle = this.startHandle;
    const endHandle = this.endHandle;
    if (startHandle === null || endHandle === null || this.activeHandle == 0) {
      return false;
    }
    const endpointRects = ui.getCrossSelectionEndpointRects(this.activeHandle);
    if (endpointRects === null) {
      return false;
    }
    const startRect = endpointRects.start;
    const endRect = endpointRects.end;
    this.positionStartHandle(startRect.x, startRect.y + startRect.height);
    this.positionEndHandle(endRect.x + endRect.width, endRect.y + endRect.height);
    return true;
  }

  private static positionStartHandle(anchorX: f32, anchorY: f32): void {
    const startHandle = this.startHandle;
    if (startHandle === null) {
      return;
    }
    this.startAnchorX = anchorX;
    this.startAnchorY = anchorY;
    this.hasStartAnchor = true;
    startHandle.position(anchorX - START_STEM_X, anchorY - HIT_TARGET_PADDING);
  }

  private static positionEndHandle(anchorX: f32, anchorY: f32): void {
    const endHandle = this.endHandle;
    if (endHandle === null) {
      return;
    }
    this.endAnchorX = anchorX;
    this.endAnchorY = anchorY;
    this.hasEndAnchor = true;
    endHandle.position(anchorX - END_STEM_X, anchorY - HIT_TARGET_PADDING);
  }

  private static captureStationaryAnchor(visualSide: SelectionHandleDragSide): bool {
    if (visualSide == SelectionHandleDragSide.Start) {
      if (!this.hasEndAnchor) {
        return false;
      }
      this.stationaryAnchorX = this.endAnchorX;
      this.stationaryAnchorY = this.endAnchorY;
      this.hasStationaryAnchor = true;
      return true;
    }
    if (visualSide == SelectionHandleDragSide.End) {
      if (!this.hasStartAnchor) {
        return false;
      }
      this.stationaryAnchorX = this.startAnchorX;
      this.stationaryAnchorY = this.startAnchorY;
      this.hasStationaryAnchor = true;
      return true;
    }
    return false;
  }
}
