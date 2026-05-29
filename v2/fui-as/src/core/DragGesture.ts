import { Signal } from "./Signal";

const DEFAULT_DRAG_THRESHOLD: f32 = 4.0;

export interface DragGestureHost {
  _captureDragPointer(): void;
  _releaseDragPointer(): void;
}

export class DragStartedEvent {
  constructor(
    readonly x: f32 = 0.0,
    readonly y: f32 = 0.0,
    readonly modifiers: u32 = 0,
  ) {}
}

export class DragDeltaEvent {
  constructor(
    readonly x: f32 = 0.0,
    readonly y: f32 = 0.0,
    readonly deltaX: f32 = 0.0,
    readonly deltaY: f32 = 0.0,
    readonly totalDeltaX: f32 = 0.0,
    readonly totalDeltaY: f32 = 0.0,
    readonly modifiers: u32 = 0,
  ) {}
}

export class DragCompletedEvent {
  constructor(
    readonly x: f32 = 0.0,
    readonly y: f32 = 0.0,
    readonly totalDeltaX: f32 = 0.0,
    readonly totalDeltaY: f32 = 0.0,
    readonly modifiers: u32 = 0,
    readonly cancelled: bool = false,
  ) {}
}

export class DragGesture {
  readonly dragging: Signal<bool> = new Signal<bool>(false);
  readonly started: Signal<DragStartedEvent> = new Signal<DragStartedEvent>(new DragStartedEvent());
  readonly delta: Signal<DragDeltaEvent> = new Signal<DragDeltaEvent>(new DragDeltaEvent());
  readonly completed: Signal<DragCompletedEvent> = new Signal<DragCompletedEvent>(new DragCompletedEvent());

  private thresholdValue: f32 = DEFAULT_DRAG_THRESHOLD;
  private pointerDownValue: bool = false;
  private dragStartedValue: bool = false;
  private startX: f32 = 0.0;
  private startY: f32 = 0.0;
  private lastPointerX: f32 = 0.0;
  private lastPointerY: f32 = 0.0;
  private lastDispatchedX: f32 = 0.0;
  private lastDispatchedY: f32 = 0.0;
  private lastModifiers: u32 = 0;

  constructor(private readonly host: DragGestureHost) {}

  get isDragging(): bool {
    return this.dragging.value;
  }

  threshold(value: f32): this {
    this.thresholdValue = value > 0.0 ? value : 0.0;
    return this;
  }

  handlePointerDown(x: f32, y: f32, modifiers: u32 = 0): void {
    if (this.pointerDownValue) {
      this.cancel();
    }
    this.pointerDownValue = true;
    this.dragStartedValue = false;
    this.startX = x;
    this.startY = y;
    this.lastPointerX = x;
    this.lastPointerY = y;
    this.lastDispatchedX = x;
    this.lastDispatchedY = y;
    this.lastModifiers = modifiers;
    this.host._captureDragPointer();
    if (this.thresholdValue <= 0.0) {
      this.beginDrag(x, y, modifiers);
    }
  }

  handlePointerMove(x: f32, y: f32, modifiers: u32 = 0): void {
    if (!this.pointerDownValue) {
      return;
    }
    this.lastPointerX = x;
    this.lastPointerY = y;
    this.lastModifiers = modifiers;
    if (!this.dragStartedValue) {
      if (!this.hasExceededThreshold(x - this.startX, y - this.startY)) {
        return;
      }
      this.beginDrag(x, y, modifiers);
    }
    this.emitDelta(x, y, modifiers);
  }

  handlePointerUp(x: f32, y: f32, modifiers: u32 = 0): void {
    if (!this.pointerDownValue) {
      return;
    }
    this.lastPointerX = x;
    this.lastPointerY = y;
    this.lastModifiers = modifiers;
    if (this.dragStartedValue) {
      this.emitDelta(x, y, modifiers);
      this.dragging.value = false;
      this.completed.value = new DragCompletedEvent(
        x,
        y,
        x - this.startX,
        y - this.startY,
        modifiers,
        false,
      );
    }
    this.pointerDownValue = false;
    this.dragStartedValue = false;
    this.host._releaseDragPointer();
  }

  cancel(): void {
    if (!this.pointerDownValue) {
      return;
    }
    if (this.dragStartedValue) {
      this.dragging.value = false;
      this.completed.value = new DragCompletedEvent(
        this.lastPointerX,
        this.lastPointerY,
        this.lastPointerX - this.startX,
        this.lastPointerY - this.startY,
        this.lastModifiers,
        true,
      );
    }
    this.pointerDownValue = false;
    this.dragStartedValue = false;
    this.host._releaseDragPointer();
  }

  private beginDrag(x: f32, y: f32, modifiers: u32): void {
    if (this.dragStartedValue) {
      return;
    }
    this.dragStartedValue = true;
    this.lastDispatchedX = this.startX;
    this.lastDispatchedY = this.startY;
    this.dragging.value = true;
    this.started.value = new DragStartedEvent(x, y, modifiers);
  }

  private emitDelta(x: f32, y: f32, modifiers: u32): void {
    if (x == this.lastDispatchedX && y == this.lastDispatchedY) {
      return;
    }
    const deltaX = x - this.lastDispatchedX;
    const deltaY = y - this.lastDispatchedY;
    this.lastDispatchedX = x;
    this.lastDispatchedY = y;
    this.delta.value = new DragDeltaEvent(
      x,
      y,
      deltaX,
      deltaY,
      x - this.startX,
      y - this.startY,
      modifiers,
    );
  }

  private hasExceededThreshold(totalDeltaX: f32, totalDeltaY: f32): bool {
    if (this.thresholdValue <= 0.0) {
      return true;
    }
    return ((totalDeltaX * totalDeltaX) + (totalDeltaY * totalDeltaY)) >= (this.thresholdValue * this.thresholdValue);
  }
}
