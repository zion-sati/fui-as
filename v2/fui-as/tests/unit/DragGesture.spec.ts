import { DragCompletedEvent, DragDeltaEvent, DragGesture, DragGestureHost, DragStartedEvent, FlexBox } from "../../src/Fui";

class DragTestNode extends FlexBox implements DragGestureHost {
  readonly gesture!: DragGesture;
  startCount: i32 = 0;
  deltaCount: i32 = 0;
  completedCount: i32 = 0;
  lastStarted: DragStartedEvent = new DragStartedEvent();
  lastDelta: DragDeltaEvent = new DragDeltaEvent();
  lastCompleted: DragCompletedEvent = new DragCompletedEvent();

  constructor(threshold: f32) {
    super();
    this.requireInteractive();
    this.gesture = new DragGesture(this).threshold(threshold);
    this.gesture.started.bind(this, (node: DragTestNode, event: DragStartedEvent): void => {
      node.startCount += 1;
      node.lastStarted = event;
    });
    this.gesture.delta.bind(this, (node: DragTestNode, event: DragDeltaEvent): void => {
      node.deltaCount += 1;
      node.lastDelta = event;
    });
    this.gesture.completed.bind(this, (node: DragTestNode, event: DragCompletedEvent): void => {
      node.completedCount += 1;
      node.lastCompleted = event;
    });
  }

  _captureDragPointer(): void {
    this.capturePointer();
  }

  _releaseDragPointer(): void {
    this.releasePointer();
  }

  protected _onEffectiveEnabledChanged(_isEnabled: bool): void {
    if (!this.isEnabled) {
      this.gesture.cancel();
    }
  }
}

describe("DragGesture", () => {
  it("only starts once the threshold is crossed", () => {
    const node = new DragTestNode(4.0);

    node.gesture.handlePointerDown(10.0, 10.0, 0);
    node.gesture.handlePointerMove(12.0, 12.0, 0);
    expect<i32>(node.startCount).toBe(0);
    expect<i32>(node.deltaCount).toBe(0);
    expect<bool>(node.gesture.isDragging).toBe(false);

    node.gesture.handlePointerMove(15.0, 10.0, 1);
    expect<i32>(node.startCount).toBe(1);
    expect<i32>(node.deltaCount).toBe(1);
    expect<bool>(node.gesture.isDragging).toBe(true);
    expect<f32>(node.lastStarted.x).toBe(15.0);
    expect<f32>(node.lastDelta.totalDeltaX).toBe(5.0);
    expect<u32>(node.lastDelta.modifiers).toBe(1);

    node.gesture.handlePointerUp(18.0, 10.0, 1);
    expect<i32>(node.deltaCount).toBe(2);
    expect<i32>(node.completedCount).toBe(1);
    expect<bool>(node.gesture.isDragging).toBe(false);
    expect<f32>(node.lastCompleted.totalDeltaX).toBe(8.0);
    expect<bool>(node.lastCompleted.cancelled).toBe(false);
  });

  it("does not emit completed when the pointer never becomes a drag", () => {
    const node = new DragTestNode(5.0);

    node.gesture.handlePointerDown(10.0, 10.0, 0);
    node.gesture.handlePointerMove(13.0, 10.0, 0);
    node.gesture.handlePointerUp(13.0, 10.0, 0);

    expect<i32>(node.startCount).toBe(0);
    expect<i32>(node.deltaCount).toBe(0);
    expect<i32>(node.completedCount).toBe(0);
    expect<bool>(node.gesture.isDragging).toBe(false);
  });

  it("waits for long press before starting a coarse-pointer drag", () => {
    const node = new DragTestNode(4.0);

    node.gesture.handlePointerDown(10.0, 10.0, 0, true);
    node.gesture.handlePointerMove(30.0, 30.0, 0);
    expect<i32>(node.startCount).toBe(0);

    expect<bool>(node.gesture.handleLongPress(30.0, 30.0, 1)).toBe(true);
    expect<i32>(node.startCount).toBe(1);
    expect<bool>(node.gesture.isDragging).toBe(true);

    node.gesture.handlePointerUp(40.0, 35.0, 1);
    expect<i32>(node.completedCount).toBe(1);
    expect<bool>(node.lastCompleted.cancelled).toBe(false);
  });

  it("emits a cancelled completion when the owner disables itself mid-drag", () => {
    const node = new DragTestNode(0.0);

    node.gesture.handlePointerDown(4.0, 6.0, 0);
    expect<i32>(node.startCount).toBe(1);
    expect<bool>(node.gesture.isDragging).toBe(true);

    node.enabled(false);

    expect<i32>(node.completedCount).toBe(1);
    expect<bool>(node.gesture.isDragging).toBe(false);
    expect<bool>(node.lastCompleted.cancelled).toBe(true);
    expect<f32>(node.lastCompleted.x).toBe(4.0);
    expect<f32>(node.lastCompleted.y).toBe(6.0);
  });
});
