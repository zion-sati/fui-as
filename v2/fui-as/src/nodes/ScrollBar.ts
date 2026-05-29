import * as ui from "../bindings/ui";
import { HandlerAction } from "../core/Action";
import { Disposable, disposeAll } from "../core/Disposable";
import { DragCompletedEvent, DragDeltaEvent, DragGesture, DragGestureHost, DragStartedEvent } from "../core/DragGesture";
import { markNeedsCommit } from "../core/FrameScheduler";
import { AlignItems, CursorStyle, FlexDirection, HandleValue, Orientation, PointerEventType, Unit } from "../core/ffi";
import { isCoarsePointer } from "../core/Platform";
import { Signal } from "../core/Signal";
import { Theme, activeTheme } from "../core/Theme";
import { warn } from "../core/Logger";
import { FlexBox } from "./FlexBox";
import { Column } from "./helpers";
import { ScrollState } from "./ScrollState";

const DEFAULT_TRACK_WIDTH: f32 = 8.0;
const DEFAULT_THUMB_WIDTH: f32 = 8.0;
const DEFAULT_MIN_THUMB_HEIGHT: f32 = 18.0;

function noopPointerCallback(_x: f32, _y: f32): void {}

class ScrollMetrics {
  viewportSize: f32 = 0.0;
  contentSize: f32 = 0.0;
  maxOffset: f32 = 0.0;
  thumbSize: f32 = 0.0;
  maxThumbOffset: f32 = 0.0;
  thumbOffset: f32 = 0.0;
  trailingSpacerSize: f32 = 0.0;
}

class ScrollBarTrackNode extends FlexBox {
  private owner: ScrollBar | null = null;
  private readonly inertCoarseValue: bool;

  constructor(interactive: bool) {
    super();
    this.inertCoarseValue = !interactive;
    this.onPointerDown(noopPointerCallback);
  }

  bindOwner(owner: ScrollBar): this {
    this.owner = owner;
    return this;
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (this.inertCoarseValue) {
      return;
    }
    if (eventType == PointerEventType.Down) {
      const owner = this.owner;
      if (owner !== null) {
        owner.handleTrackPointerDown(this.builtHandle, x, y);
      }
    }
  }
}

class ScrollBarThumbNode extends FlexBox implements DragGestureHost {
  private owner: ScrollBar | null = null;
  private readonly dragGesture!: DragGesture;
  private readonly inertCoarseValue: bool;

  constructor(interactive: bool) {
    super();
    this.inertCoarseValue = !interactive;
    this.dragGesture = new DragGesture(this).threshold(0.0);
    this.onPointerDown(noopPointerCallback);
    if (interactive) {
      this.cursor(CursorStyle.Grab);
      this.onPointerMove(noopPointerCallback);
      this.onPointerUp(noopPointerCallback);
    }
    this.dragGesture.started.bind(this, (thumb: ScrollBarThumbNode, event: DragStartedEvent): void => {
      thumb.handleDragStarted(event);
    });
    this.dragGesture.delta.bind(this, (thumb: ScrollBarThumbNode, event: DragDeltaEvent): void => {
      thumb.handleDragDelta(event);
    });
    this.dragGesture.completed.bind(this, (thumb: ScrollBarThumbNode, event: DragCompletedEvent): void => {
      thumb.handleDragCompleted(event);
    });
  }

  bindOwner(owner: ScrollBar): this {
    this.owner = owner;
    return this;
  }

  _captureDragPointer(): void {
    this.capturePointer();
  }

  _releaseDragPointer(): void {
    this.releasePointer();
  }

  build(): u64 {
    const handle = super.build();
    if (this.dragGesture.isDragging) {
      this.capturePointer();
    }
    return handle;
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (this.inertCoarseValue) {
      return;
    }
    const owner = this.owner;
    if (owner === null) {
      return;
    }
    if (eventType == PointerEventType.Down) {
      if (owner.canStartThumbDrag()) {
        this.dragGesture.handlePointerDown(x, y, modifiers);
      }
      return;
    }
    if (eventType == PointerEventType.Move) {
      this.dragGesture.handlePointerMove(x, y, modifiers);
      return;
    }
    if (eventType == PointerEventType.Up) {
      this.dragGesture.handlePointerUp(x, y, modifiers);
      return;
    }
  }

  cancelDrag(): void {
    this.dragGesture.cancel();
  }

  isDragging(): bool {
    return this.dragGesture.isDragging;
  }

  private handleDragStarted(event: DragStartedEvent): void {
    const owner = this.owner;
    if (owner !== null) {
      owner.handleThumbDragStarted(event);
    }
  }

  private handleDragDelta(event: DragDeltaEvent): void {
    const owner = this.owner;
    if (owner !== null) {
      owner.handleThumbDragDelta(event);
    }
  }

  private handleDragCompleted(event: DragCompletedEvent): void {
    const owner = this.owner;
    if (owner !== null) {
      owner.handleThumbDragCompleted(event);
    }
  }
}

function clamp(value: f32, min: f32, max: f32): f32 {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export enum ScrollBarVisibility {
  Always = 0,
  Auto = 1,
  Never = 2,
}

export class ScrollBar {
  private targetHandle: u64 = <u64>HandleValue.Invalid;
  private dragStartOffset: f32 = 0.0;
  private readonly scrollState: ScrollState;
  private readonly orientation: Orientation;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private readonly metrics: ScrollMetrics = new ScrollMetrics();
  readonly chromeMetricVersion: Signal<i32> = new Signal<i32>(0);
  private readonly trackNode: ScrollBarTrackNode;
  private readonly trackStrip: FlexBox;
  private readonly leadingSpacerNode: FlexBox;
  private readonly thumbNode: ScrollBarThumbNode;
  private readonly trailingSpacerNode: FlexBox;
  private trackThicknessValue: f32 = DEFAULT_TRACK_WIDTH;
  private thumbThicknessValue: f32 = DEFAULT_THUMB_WIDTH;
  private minThumbHeightValue: f32 = DEFAULT_MIN_THUMB_HEIGHT;
  private trackCornerRadiusValue: f32 = 0.0;
  private thumbCornerRadiusValue: f32 = 0.0;
  private trackColorValue: u32 = activeTheme.value.colors.scrollbarTrack;
  private thumbColorValue: u32 = activeTheme.value.colors.scrollbarThumb;
  private trackColorOverridden: bool = false;
  private thumbColorOverridden: bool = false;
  private chromeVisibleValue: bool = true;

  constructor(scrollState: ScrollState, orientation: Orientation = Orientation.Vertical) {
    this.scrollState = scrollState;
    const resolvedOrientation = orientation == Orientation.Horizontal ? Orientation.Horizontal : Orientation.Vertical;
    this.orientation = resolvedOrientation;
    const interactive = !isCoarsePointer();
    const leadingSpacerNode = new FlexBox();
    const thumbNode = new ScrollBarThumbNode(interactive);
    const trailingSpacerNode = new FlexBox();
    const trackStrip = (resolvedOrientation == Orientation.Horizontal
      ? new FlexBox().flexDirection(FlexDirection.Row).children([
        leadingSpacerNode,
        thumbNode,
        trailingSpacerNode,
      ])
      : Column(
        leadingSpacerNode,
        thumbNode,
        trailingSpacerNode,
      ))
      .alignItems(AlignItems.Center);
    const trackNode = new ScrollBarTrackNode(interactive)
      .clipToBounds(true)
      .child(trackStrip) as ScrollBarTrackNode;
    this.leadingSpacerNode = leadingSpacerNode;
    this.thumbNode = thumbNode;
    this.trailingSpacerNode = trailingSpacerNode;
    this.trackStrip = trackStrip;
    this.trackNode = trackNode;
    this.thumbNode.bindOwner(this);
    this.trackNode.bindOwner(this);
    this.attachListeners();
    this.handleThemeChanged(activeTheme.value);
    this.applyGeometryStyle();
    this.syncVisualState();
  }

  get axis(): Orientation {
    return this.orientation;
  }

  get thickness(): f32 {
    return this.trackThicknessValue;
  }

  trackWidth(value: f32): this {
    this.trackThickness(value);
    return this;
  }

  trackThickness(value: f32): this {
    const next = value > 0.0 ? value : 1.0;
    if (value <= 0.0) {
      warn("Layout", "ScrollBar.trackThickness() received " + value.toString() + "; clamping to 1.0.");
    }
    if (this.trackThicknessValue == next) {
      return this;
    }
    this.trackThicknessValue = next;
    this.applyGeometryStyle();
    this.chromeMetricVersion.value = this.chromeMetricVersion.value + 1;
    return this;
  }

  thumbWidth(value: f32): this {
    this.thumbThickness(value);
    return this;
  }

  thumbThickness(value: f32): this {
    if (value <= 0.0) {
      warn("Layout", "ScrollBar.thumbThickness() received " + value.toString() + "; clamping to 1.0.");
    }
    this.thumbThicknessValue = value > 0.0 ? value : 1.0;
    this.applyGeometryStyle();
    return this;
  }

  thumbMinHeight(value: f32): this {
    if (value <= 0.0) {
      warn("Layout", "ScrollBar.thumbMinHeight() received " + value.toString() + "; clamping to 1.0.");
    }
    this.minThumbHeightValue = value > 0.0 ? value : 1.0;
    this.syncVisualState();
    return this;
  }

  trackCornerRadius(radius: f32): this {
    this.trackCornerRadiusValue = radius > 0.0 ? radius : 0.0;
    this.trackNode.cornerRadius(this.trackCornerRadiusValue);
    return this;
  }

  thumbCornerRadius(radius: f32): this {
    this.thumbCornerRadiusValue = radius > 0.0 ? radius : 0.0;
    this.thumbNode.cornerRadius(this.thumbCornerRadiusValue);
    return this;
  }

  trackColor(color: u32): this {
    this.trackColorOverridden = true;
    this.trackColorValue = color;
    this.applyColorStyle();
    return this;
  }

  thumbColor(color: u32): this {
    this.thumbColorOverridden = true;
    this.thumbColorValue = color;
    this.applyColorStyle();
    return this;
  }

  bindScrollHandle(handle: u64): void {
    this.targetHandle = handle;
    this.trackNode._bindScrollProxyTarget(handle);
    this.trackStrip._bindScrollProxyTarget(handle);
    this.leadingSpacerNode._bindScrollProxyTarget(handle);
    this.thumbNode._bindScrollProxyTarget(handle);
    this.trailingSpacerNode._bindScrollProxyTarget(handle);
  }

  clearScrollHandle(handle: u64): void {
    if (this.targetHandle == handle) {
      this.targetHandle = <u64>HandleValue.Invalid;
      this.trackNode._bindScrollProxyTarget(<u64>HandleValue.Invalid);
      this.trackStrip._bindScrollProxyTarget(<u64>HandleValue.Invalid);
      this.leadingSpacerNode._bindScrollProxyTarget(<u64>HandleValue.Invalid);
      this.thumbNode._bindScrollProxyTarget(<u64>HandleValue.Invalid);
      this.trailingSpacerNode._bindScrollProxyTarget(<u64>HandleValue.Invalid);
    }
  }

  render(): FlexBox {
    return this.trackNode;
  }

  chromeVisible(flag: bool): void {
    if (this.chromeVisibleValue == flag) {
      return;
    }
    this.chromeVisibleValue = flag;
    if (!flag && this.thumbNode.isDragging()) {
      this.thumbNode.cancelDrag();
    }
    this.applyGeometryStyle();
    this.syncVisualState();
    this.applyThumbCursor();
  }

  dispose(): void {
    this.thumbNode.cancelDrag();
    disposeAll(this.disposables);
  }

  canStartThumbDrag(): bool {
    const metrics = this.computeMetrics();
    return this.chromeVisibleValue && metrics.maxOffset > 0.0 && metrics.maxThumbOffset > 0.0;
  }

  isDragging(): bool {
    return this.thumbNode.isDragging();
  }

  handleThumbDragStarted(_event: DragStartedEvent): void {
    this.dragStartOffset = this.axisOffset();
    this.applyThumbCursor();
  }

  handleThumbDragCompleted(_event: DragCompletedEvent): void {
    this.applyThumbCursor();
  }

  handleMetricsChanged(): void {
    this.syncVisualState();
  }

  refreshNow(): void {
    this.syncVisualState();
  }

  handleThumbDragDelta(event: DragDeltaEvent): void {
    if (!this.thumbNode.isDragging()) {
      return;
    }
    const metrics = this.computeMetrics();
    if (metrics.maxOffset <= 0.0 || metrics.maxThumbOffset <= 0.0) {
      return;
    }
    const delta = this.orientation == Orientation.Horizontal ? event.totalDeltaX : event.totalDeltaY;
    const offsetPerThumbPixel = metrics.maxOffset / metrics.maxThumbOffset;
    this.setScrollOffset(this.dragStartOffset + (delta * offsetPerThumbPixel), metrics.maxOffset);
  }

  handleTrackPointerDown(trackHandle: u64, pointerX: f32, pointerY: f32): void {
    if (this.thumbNode.isDragging()) {
      return;
    }
    const metrics = this.computeMetrics();
    if (metrics.maxOffset <= 0.0 || metrics.maxThumbOffset <= 0.0) {
      return;
    }
    const bounds = ui.tryGetBounds(trackHandle);
    if (bounds === null) {
      return;
    }
    const localPointer = this.orientation == Orientation.Horizontal
      ? pointerX - unchecked(bounds[0])
      : pointerY - unchecked(bounds[1]);
    const targetThumbOffset = clamp(localPointer - (metrics.thumbSize * 0.5), 0.0, metrics.maxThumbOffset);
    const nextOffset = (targetThumbOffset / metrics.maxThumbOffset) * metrics.maxOffset;
    this.setScrollOffset(nextOffset, metrics.maxOffset);
  }

  private computeMetrics(): ScrollMetrics {
    const metrics = this.metrics;
    const viewportSize = this.orientation == Orientation.Horizontal
      ? this.scrollState.viewportWidth.value
      : this.scrollState.viewportHeight.value;
    const contentSize = this.orientation == Orientation.Horizontal
      ? this.scrollState.contentWidth.value
      : this.scrollState.contentHeight.value;
    const safeViewportSize = viewportSize > 0.0 ? viewportSize : 0.0;
    const safeContentSize = contentSize > safeViewportSize ? contentSize : safeViewportSize;
    const maxOffset = safeContentSize - safeViewportSize;
    const rawThumbSize = safeContentSize > 0.0 ? safeViewportSize * (safeViewportSize / safeContentSize) : 0.0;
    const thumbSize = safeViewportSize > 0.0 ? clamp(rawThumbSize, this.minThumbHeightValue, safeViewportSize) : 0.0;
    const maxThumbOffset = safeViewportSize > thumbSize ? safeViewportSize - thumbSize : 0.0;
    const offset = this.axisOffset();
    const thumbOffset = maxOffset > 0.0 && maxThumbOffset > 0.0
      ? clamp((offset / maxOffset) * maxThumbOffset, 0.0, maxThumbOffset)
      : 0.0;

    metrics.viewportSize = safeViewportSize;
    metrics.contentSize = safeContentSize;
    metrics.maxOffset = maxOffset;
    metrics.thumbSize = thumbSize;
    metrics.maxThumbOffset = maxThumbOffset;
    metrics.thumbOffset = thumbOffset;
    metrics.trailingSpacerSize = safeViewportSize - thumbSize - thumbOffset;
    if (metrics.trailingSpacerSize < 0.0) {
      metrics.trailingSpacerSize = 0.0;
    }
    return metrics;
  }

  private attachListeners(): void {
    const offsetSignal = this.orientation == Orientation.Horizontal ? this.scrollState.offsetX : this.scrollState.offsetY;
    const contentSignal = this.orientation == Orientation.Horizontal ? this.scrollState.contentWidth : this.scrollState.contentHeight;
    const viewportSignal = this.orientation == Orientation.Horizontal ? this.scrollState.viewportWidth : this.scrollState.viewportHeight;
    this.track(offsetSignal.addAction(new HandlerAction<ScrollBar, f32>(this, (scrollBar: ScrollBar, _value: f32): void => {
      scrollBar.handleMetricsChanged();
    })));
    this.track(contentSignal.addAction(new HandlerAction<ScrollBar, f32>(this, (scrollBar: ScrollBar, _value: f32): void => {
      scrollBar.handleMetricsChanged();
    })));
    this.track(viewportSignal.addAction(new HandlerAction<ScrollBar, f32>(this, (scrollBar: ScrollBar, _value: f32): void => {
      scrollBar.handleMetricsChanged();
    })));
    this.track(activeTheme.addAction(new HandlerAction<ScrollBar, Theme>(this, (scrollBar: ScrollBar, theme: Theme): void => {
      scrollBar.handleThemeChanged(theme);
    })));
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private syncVisualState(): void {
    if (!this.chromeVisibleValue) {
      if (this.orientation == Orientation.Horizontal) {
        this.trackNode.width(0.0, Unit.Pixel);
        this.trackStrip.width(0.0, Unit.Pixel);
        this.leadingSpacerNode.width(0.0, Unit.Pixel);
        this.thumbNode.width(0.0, Unit.Pixel);
        this.trailingSpacerNode.width(0.0, Unit.Pixel);
        return;
      }
      this.trackNode.height(0.0, Unit.Pixel);
      this.trackStrip.height(0.0, Unit.Pixel);
      this.leadingSpacerNode.height(0.0, Unit.Pixel);
      this.thumbNode.height(0.0, Unit.Pixel);
      this.trailingSpacerNode.height(0.0, Unit.Pixel);
      return;
    }
    const metrics = this.computeMetrics();
    if (this.orientation == Orientation.Horizontal) {
      this.trackNode.width(metrics.viewportSize, Unit.Pixel);
      this.trackStrip.width(metrics.viewportSize, Unit.Pixel);
      this.leadingSpacerNode.width(metrics.thumbOffset, Unit.Pixel);
      this.thumbNode.width(metrics.thumbSize, Unit.Pixel);
      this.trailingSpacerNode.width(metrics.trailingSpacerSize, Unit.Pixel);
      return;
    }
    this.trackNode.height(metrics.viewportSize, Unit.Pixel);
    this.trackStrip.height(metrics.viewportSize, Unit.Pixel);
    this.leadingSpacerNode.height(metrics.thumbOffset, Unit.Pixel);
    this.thumbNode.height(metrics.thumbSize, Unit.Pixel);
    this.trailingSpacerNode.height(metrics.trailingSpacerSize, Unit.Pixel);
  }

  private handleThemeChanged(theme: Theme): void {
    if (!this.trackColorOverridden) {
      this.trackColorValue = theme.colors.scrollbarTrack;
    }
    if (!this.thumbColorOverridden) {
      this.thumbColorValue = theme.colors.scrollbarThumb;
    }
    this.applyColorStyle();
  }

  private applyGeometryStyle(): void {
    const trackThickness = this.chromeVisibleValue ? this.trackThicknessValue : 0.0;
    const thumbThickness = this.chromeVisibleValue ? this.thumbThicknessValue : 0.0;
    if (this.orientation == Orientation.Horizontal) {
      this.trackNode.height(trackThickness, Unit.Pixel);
      this.trackStrip.height(trackThickness, Unit.Pixel);
      this.leadingSpacerNode.height(trackThickness, Unit.Pixel);
      this.trailingSpacerNode.height(trackThickness, Unit.Pixel);
      this.thumbNode.height(thumbThickness, Unit.Pixel);
      return;
    }
    this.trackNode.width(trackThickness, Unit.Pixel);
    this.trackStrip.width(trackThickness, Unit.Pixel);
    this.leadingSpacerNode.width(trackThickness, Unit.Pixel);
    this.trailingSpacerNode.width(trackThickness, Unit.Pixel);
    this.thumbNode.width(thumbThickness, Unit.Pixel);
  }

  private applyColorStyle(): void {
    this.trackNode.bgColor(this.trackColorValue);
    this.thumbNode.bgColor(this.thumbColorValue);
  }

  private applyThumbCursor(): void {
    if (isCoarsePointer()) {
      return;
    }
    if (!this.chromeVisibleValue) {
      this.thumbNode.cursor(CursorStyle.Default);
      return;
    }
    this.thumbNode.cursor(this.thumbNode.isDragging() ? CursorStyle.Grabbing : CursorStyle.Grab);
  }

  private axisPosition(x: f32, y: f32): f32 {
    return this.orientation == Orientation.Horizontal ? x : y;
  }

  private axisOffset(): f32 {
    return this.orientation == Orientation.Horizontal ? this.scrollState.offsetX.value : this.scrollState.offsetY.value;
  }

  private setScrollOffset(offset: f32, maxOffset: f32): void {
    const clampedOffset = clamp(offset, 0.0, maxOffset);
    if (this.orientation == Orientation.Horizontal) {
      this.scrollState.offsetX.value = clampedOffset;
      if (this.targetHandle != <u64>HandleValue.Invalid) {
        ui.setScrollOffset(this.targetHandle, clampedOffset, this.scrollState.offsetY.value);
        markNeedsCommit();
      }
      return;
    }
    this.scrollState.offsetY.value = clampedOffset;
    if (this.targetHandle != <u64>HandleValue.Invalid) {
      ui.setScrollOffset(this.targetHandle, this.scrollState.offsetX.value, clampedOffset);
      markNeedsCommit();
    }
  }
}
