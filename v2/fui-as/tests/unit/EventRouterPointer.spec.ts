import { EventRouter } from "../../src/core/EventRouter";
import { PointerEventType } from "../../src/core/ffi";
import { GestureEventArgs, GestureEventKind, GestureEventPhase, GestureIntent, LongPressEventArgs, LongPressGesture, PointerClickEventArgs, PointerEventArgs, PointerType } from "../../src/core/Node";
import { TextInput } from "../../src/controls";
import { FlexBox, Text } from "../../src/nodes";
import { CALL_SELECT_WORD_AT, findCall, getCallArg, resetCalls, setNodeBounds } from "./FfiTestImports";

let clickCount: i32 = 0;
let lastClickCount: i32 = 0;
let doubleClickCount: i32 = 0;
let tripleClickCount: i32 = 0;
let pointerClickOrder: i32 = 0;
let specializedSawHandled: bool = false;
let legacyDownCount: i32 = 0;
let legacyMoveCount: i32 = 0;
let ownerCount: i32 = 0;
let lastEventType: PointerEventType = PointerEventType.Down;
let lastLocalX: f32 = 0.0;
let lastLocalY: f32 = 0.0;
let lastSceneX: f32 = 0.0;
let lastSceneY: f32 = 0.0;
let lastPointerId: i32 = 0;
let lastPointerType: PointerType = PointerType.Unknown;
let lastButton: i32 = 0;
let lastButtons: u32 = 0;
let lastModifiers: u32 = 0;
let lastPressure: f32 = 0.0;
let lastWidth: f32 = 0.0;
let lastHeight: f32 = 0.0;
let childPointerOrder: i32 = 0;
let parentPointerOrder: i32 = 0;
let childPointerHandles: bool = false;
let parentLegacyClickCount: i32 = 0;
let gestureCount: i32 = 0;
let lastGesturePhase: GestureEventPhase = GestureEventPhase.Begin;
let lastGestureKind: GestureEventKind = GestureEventKind.None;
let lastGestureLocalX: f32 = 0.0;
let lastGestureLocalY: f32 = 0.0;
let lastGestureSceneX: f32 = 0.0;
let lastGestureSceneY: f32 = 0.0;
let lastGestureDeltaX: f32 = 0.0;
let lastGestureDeltaY: f32 = 0.0;
let lastGestureScale: f32 = 1.0;
let childGestureOrder: i32 = 0;
let parentGestureOrder: i32 = 0;
let childGestureHandles: bool = false;
let longPressCount: i32 = 0;
let childLongPressOrder: i32 = 0;
let parentLongPressOrder: i32 = 0;
let childLongPressHandles: bool = false;
let lastLongPressLocalX: f32 = 0.0;
let lastLongPressLocalY: f32 = 0.0;
let lastLongPressSceneX: f32 = 0.0;
let lastLongPressSceneY: f32 = 0.0;
let lastLongPressPointerId: i32 = 0;
let lastLongPressPointerType: PointerType = PointerType.Unknown;
let lastLongPressModifiers: u32 = 0;
let lastLongPressDurationMs: i32 = 0;

class PointerOwner {
  count: i32 = 0;
  lastPointerId: i32 = 0;
}

class GestureOwner {
  count: i32 = 0;
  lastScale: f32 = 0.0;
}

class LongPressOwner {
  count: i32 = 0;
  lastDurationMs: i32 = 0;
}

class CapturingNode extends FlexBox {
  captureNow(): void {
    this.capturePointer();
  }
}

function makeHandle(index: u32, generation: u32): u64 {
  return (<u64>generation << 32) | <u64>index;
}

function handleClick(event: PointerClickEventArgs): void {
  clickCount += 1;
  lastClickCount = event.clickCount;
}

function handleOrderedClick(event: PointerClickEventArgs): void {
  clickCount += 1;
  pointerClickOrder = pointerClickOrder * 10 + 1;
  event.handled = true;
}

function handleDoubleClick(event: PointerClickEventArgs): void {
  doubleClickCount += 1;
  pointerClickOrder = pointerClickOrder * 10 + 2;
  specializedSawHandled = event.handled;
}

function handleTripleClick(event: PointerClickEventArgs): void {
  tripleClickCount += 1;
  pointerClickOrder = pointerClickOrder * 10 + 3;
  specializedSawHandled = event.handled;
}

function handleLegacyDown(_event: PointerEventArgs): void {
  legacyDownCount += 1;
}

function handleLegacyMove(_event: PointerEventArgs): void {
  legacyMoveCount += 1;
}

function handlePointerEvent(event: PointerEventArgs): void {
  lastEventType = event.eventType;
  lastLocalX = event.x;
  lastLocalY = event.y;
  lastSceneX = event.sceneX;
  lastSceneY = event.sceneY;
  lastPointerId = event.pointerId;
  lastPointerType = event.pointerType;
  lastButton = event.button;
  lastButtons = event.buttons;
  lastModifiers = event.modifiers;
  lastPressure = event.pressure;
  lastWidth = event.width;
  lastHeight = event.height;
}

function handlePointerMoveCounting(event: PointerEventArgs): void {
  legacyMoveCount += 1;
  handlePointerEvent(event);
}

function handleChildPointerEvent(event: PointerEventArgs): void {
  childPointerOrder = childPointerOrder == 0 ? 1 : childPointerOrder;
  if (childPointerHandles) {
    event.handled = true;
  }
}

function handleParentPointerEvent(_event: PointerEventArgs): void {
  parentPointerOrder = childPointerOrder == 1 ? 2 : 1;
}

function handleParentLegacyClick(_event: PointerClickEventArgs): void {
  parentLegacyClickCount += 1;
}

function handleGestureEvent(event: GestureEventArgs): void {
  gestureCount += 1;
  lastGesturePhase = event.phase;
  lastGestureKind = event.kind;
  lastGestureLocalX = event.x;
  lastGestureLocalY = event.y;
  lastGestureSceneX = event.sceneX;
  lastGestureSceneY = event.sceneY;
  lastGestureDeltaX = event.deltaX;
  lastGestureDeltaY = event.deltaY;
  lastGestureScale = event.scale;
}

function handleChildGestureEvent(event: GestureEventArgs): void {
  childGestureOrder = childGestureOrder == 0 ? 1 : childGestureOrder;
  lastGestureLocalX = event.x;
  lastGestureLocalY = event.y;
  if (childGestureHandles) {
    event.handled = true;
  }
}

function handleParentGestureEvent(event: GestureEventArgs): void {
  parentGestureOrder = childGestureOrder == 1 ? 2 : 1;
  lastGestureLocalX = event.x;
  lastGestureLocalY = event.y;
}

function handleLongPressEvent(event: LongPressEventArgs): void {
  longPressCount += 1;
  lastLongPressLocalX = event.x;
  lastLongPressLocalY = event.y;
  lastLongPressSceneX = event.sceneX;
  lastLongPressSceneY = event.sceneY;
  lastLongPressPointerId = event.pointerId;
  lastLongPressPointerType = event.pointerType;
  lastLongPressModifiers = event.modifiers;
  lastLongPressDurationMs = event.durationMs;
}

function handleChildLongPressEvent(event: LongPressEventArgs): void {
  childLongPressOrder = childLongPressOrder == 0 ? 1 : childLongPressOrder;
  lastLongPressLocalX = event.x;
  lastLongPressLocalY = event.y;
  if (childLongPressHandles) {
    event.handled = true;
  }
}

function handleParentLongPressEvent(event: LongPressEventArgs): void {
  parentLongPressOrder = childLongPressOrder == 1 ? 2 : 1;
  lastLongPressLocalX = event.x;
  lastLongPressLocalY = event.y;
}

function resetPointerState(): void {
  clickCount = 0;
  lastClickCount = 0;
  doubleClickCount = 0;
  tripleClickCount = 0;
  pointerClickOrder = 0;
  specializedSawHandled = false;
  legacyDownCount = 0;
  legacyMoveCount = 0;
  ownerCount = 0;
  lastEventType = PointerEventType.Down;
  lastLocalX = 0.0;
  lastLocalY = 0.0;
  lastSceneX = 0.0;
  lastSceneY = 0.0;
  lastPointerId = 0;
  lastPointerType = PointerType.Unknown;
  lastButton = 0;
  lastButtons = 0;
  lastModifiers = 0;
  lastPressure = 0.0;
  lastWidth = 0.0;
  lastHeight = 0.0;
  childPointerOrder = 0;
  parentPointerOrder = 0;
  childPointerHandles = false;
  parentLegacyClickCount = 0;
  gestureCount = 0;
  lastGesturePhase = GestureEventPhase.Begin;
  lastGestureKind = GestureEventKind.None;
  lastGestureLocalX = 0.0;
  lastGestureLocalY = 0.0;
  lastGestureSceneX = 0.0;
  lastGestureSceneY = 0.0;
  lastGestureDeltaX = 0.0;
  lastGestureDeltaY = 0.0;
  lastGestureScale = 1.0;
  childGestureOrder = 0;
  parentGestureOrder = 0;
  childGestureHandles = false;
  longPressCount = 0;
  childLongPressOrder = 0;
  parentLongPressOrder = 0;
  childLongPressHandles = false;
  lastLongPressLocalX = 0.0;
  lastLongPressLocalY = 0.0;
  lastLongPressSceneX = 0.0;
  lastLongPressSceneY = 0.0;
  lastLongPressPointerId = 0;
  lastLongPressPointerType = PointerType.Unknown;
  lastLongPressModifiers = 0;
  lastLongPressDurationMs = 0;
}

describe("EventRouterPointer", () => {
  it("dispatches pointer events to the registered node", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox().onPointerClick(handleClick);
    const handle = makeHandle(7, 1);

    EventRouter.register(handle, node);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0);

    expect<i32>(clickCount).toBe(0);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0);

    expect<i32>(clickCount).toBe(1);
    expect<i32>(lastClickCount).toBe(1);
  });

  it("passes click count to click callbacks", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox().onPointerClick(handleClick);
    const handle = makeHandle(70, 1);

    EventRouter.register(handle, node);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 1, 0.0, 0.0, 0.0, 2);

    expect<i32>(clickCount).toBe(0);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 0, 0.0, 0.0, 0.0, 2);

    expect<i32>(clickCount).toBe(1);
    expect<i32>(lastClickCount).toBe(2);
  });

  it("fires the ordinary pointer click callback for every click count", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox().onPointerClick(handleClick);
    const handle = makeHandle(71, 1);
    EventRouter.register(handle, node);

    for (let count: i32 = 1; count <= 4; count += 1) {
      EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 1, 0.0, 0.0, 0.0, count);
      EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 0, 0.0, 0.0, 0.0, count);
    }

    expect<i32>(clickCount).toBe(4);
    expect<i32>(lastClickCount).toBe(4);
  });

  it("fires exact pointer multi-click callbacks after ordinary click on the same node", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox()
      .onPointerClick(handleOrderedClick)
      .onPointerDoubleClick(handleDoubleClick)
      .onPointerTripleClick(handleTripleClick);
    const handle = makeHandle(72, 1);
    EventRouter.register(handle, node);

    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 1, 0.0, 0.0, 0.0, 2);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 0, 0.0, 0.0, 0.0, 2);

    expect<i32>(clickCount).toBe(1);
    expect<i32>(doubleClickCount).toBe(1);
    expect<i32>(tripleClickCount).toBe(0);
    expect<i32>(pointerClickOrder).toBe(12);
    expect<bool>(specializedSawHandled).toBe(true);

    pointerClickOrder = 0;
    specializedSawHandled = false;
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 1, 0.0, 0.0, 0.0, 3);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 0, 0.0, 0.0, 0.0, 3);

    expect<i32>(clickCount).toBe(2);
    expect<i32>(doubleClickCount).toBe(1);
    expect<i32>(tripleClickCount).toBe(1);
    expect<i32>(pointerClickOrder).toBe(13);
    expect<bool>(specializedSawHandled).toBe(true);
  });

  it("recognizes specialized pointer click handlers without an ordinary click handler", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new Text("target")
      .onPointerDoubleClick(handleDoubleClick)
      .onPointerTripleClick(handleTripleClick);
    const handle = makeHandle(73, 1);
    EventRouter.register(handle, node);

    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 1, 0.0, 0.0, 0.0, 2);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 0, 0.0, 0.0, 0.0, 2);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 1, 0.0, 0.0, 0.0, 3);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 0, 0.0, 0.0, 0.0, 3);

    expect<i32>(doubleClickCount).toBe(1);
    expect<i32>(tripleClickCount).toBe(1);
  });

  it("routes structured pointer args and preserves legacy callbacks", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox()
      .onPointerDown(handleLegacyDown)
      .onPointerMove(handlePointerMoveCounting);
    const handle = makeHandle(8, 1);
    EventRouter.register(handle, node);
    setNodeBounds(handle, 10.0, 20.0, 100.0, 100.0);

    EventRouter.dispatchPointerEvent(
      handle,
      PointerEventType.Down,
      30.0,
      45.0,
      3,
      42,
      PointerType.Pen,
      1,
      5,
      0.625,
      12.0,
      14.0,
    );
    EventRouter.dispatchPointerEvent(
      handle,
      PointerEventType.Move,
      34.0,
      48.0,
      3,
      42,
      PointerType.Pen,
      -1,
      5,
      0.75,
      12.0,
      14.0,
    );

    expect<i32>(legacyDownCount).toBe(1);
    expect<i32>(legacyMoveCount).toBe(1);
    expect<PointerEventType>(lastEventType).toBe(PointerEventType.Move);
    expect<f32>(lastLocalX).toBe(24.0);
    expect<f32>(lastLocalY).toBe(28.0);
    expect<f32>(lastSceneX).toBe(34.0);
    expect<f32>(lastSceneY).toBe(48.0);
    expect<i32>(lastPointerId).toBe(42);
    expect<PointerType>(lastPointerType).toBe(PointerType.Pen);
    expect<i32>(lastButton).toBe(-1);
    expect<u32>(lastButtons).toBe(5);
    expect<u32>(lastModifiers).toBe(3);
    expect<f32>(lastPressure).toBe(0.75);
    expect<f32>(lastWidth).toBe(12.0);
    expect<f32>(lastHeight).toBe(14.0);
  });

  it("supports owner-bound structured pointer callbacks", () => {
    EventRouter.reset();

    const owner = new PointerOwner();
    const node = new FlexBox()
      .onPointerUpWith<PointerOwner>(owner, (target: PointerOwner, event: PointerEventArgs): void => {
        target.count += 1;
        target.lastPointerId = event.pointerId;
      });
    const handle = makeHandle(9, 1);
    EventRouter.register(handle, node);

    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 2.0, 3.0, 0, 77, PointerType.Mouse);

    expect<i32>(owner.count).toBe(1);
    expect<i32>(owner.lastPointerId).toBe(77);
  });

  it("bubbles structured pointer events to ancestors without firing ancestor legacy click handlers", () => {
    EventRouter.reset();
    resetPointerState();

    const child = new FlexBox();
    child.onPointerDown(handleChildPointerEvent);
    const parent = new FlexBox();
    parent.onPointerClick(handleParentLegacyClick)
      .onPointerDown(handleParentPointerEvent);
    parent.child(child);
    const parentHandle = makeHandle(12, 1);
    const childHandle = makeHandle(13, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);

    EventRouter.dispatchPointerEvent(childHandle, PointerEventType.Down, 20.0, 30.0, 0, 12, PointerType.Mouse);

    expect<i32>(childPointerOrder).toBe(1);
    expect<i32>(parentPointerOrder).toBe(2);
    expect<i32>(parentLegacyClickCount).toBe(0);
  });

  it("fires ancestor click on pointer up when a text child leaves the event unhandled", () => {
    EventRouter.reset();
    resetPointerState();

    const text = new Text("child text");
    const parent = new FlexBox();
    parent.onPointerClick(handleParentLegacyClick);
    parent.child(text);
    const parentHandle = makeHandle(17, 1);
    const textHandle = makeHandle(18, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(textHandle, text);

    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 20.0, 30.0, 0, 12, PointerType.Mouse);
    expect<i32>(parentLegacyClickCount).toBe(0);

    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Up, 20.0, 30.0, 0, 12, PointerType.Mouse);

    expect<i32>(parentLegacyClickCount).toBe(1);
  });

  it("fires click on pointer up even when the up button metadata is unset", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox().onPointerClick(handleClick);
    const handle = makeHandle(19, 1);
    EventRouter.register(handle, node);

    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 20.0, 30.0, 0, 12, PointerType.Touch, 0, 1);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 20.0, 30.0, 0, 12, PointerType.Touch, -1, 0);

    expect<i32>(clickCount).toBe(1);
  });

  it("fires touch click when both down and up button metadata are unset", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox().onPointerClick(handleClick);
    const handle = makeHandle(20, 1);
    EventRouter.register(handle, node);

    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 20.0, 30.0, 0, 12, PointerType.Touch, -1, 1);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 20.0, 30.0, 0, 12, PointerType.Touch, -1, 0);

    expect<i32>(clickCount).toBe(1);
  });

  it("stops structured pointer bubbling when the child marks the event handled", () => {
    EventRouter.reset();
    resetPointerState();

    childPointerHandles = true;
    const child = new FlexBox();
    child.onPointerDown(handleChildPointerEvent);
    const parent = new FlexBox();
    parent.onPointerDown(handleParentPointerEvent);
    parent.child(child);
    const parentHandle = makeHandle(14, 1);
    const childHandle = makeHandle(15, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);

    const handled = EventRouter.dispatchPointerEvent(childHandle, PointerEventType.Down, 20.0, 30.0, 0, 12, PointerType.Mouse);

    expect<i32>(childPointerOrder).toBe(1);
    expect<i32>(parentPointerOrder).toBe(0);
    expect<bool>(handled).toBe(true);
  });

  it("does not fire legacy click for secondary pointer buttons", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox()
      .onPointerClick(handleClick)
      .onPointerDown(handlePointerEvent);
    const handle = makeHandle(16, 1);
    EventRouter.register(handle, node);

    const handled = EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 20.0, 30.0, 0, 12, PointerType.Mouse, 2, 2);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 20.0, 30.0, 0, 12, PointerType.Mouse, 2, 0);

    expect<bool>(handled).toBe(false);
    expect<i32>(clickCount).toBe(0);
    expect<i32>(lastButton).toBe(2);
  });

  it("resolves the nearest gesture owner and dispatches local gesture coordinates", () => {
    EventRouter.reset();
    resetPointerState();

    const child = new FlexBox();
    const parent = new FlexBox();
    parent.panGesture(handleGestureEvent);
    parent.pinchGesture(handleGestureEvent);
    parent.child(child);
    const parentHandle = makeHandle(17, 1);
    const childHandle = makeHandle(18, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);
    setNodeBounds(parentHandle, 10.0, 20.0, 200.0, 100.0);

    expect<u64>(EventRouter.resolveGestureOwner(childHandle)).toBe(parentHandle);
    expect<GestureIntent>(EventRouter.getGestureIntent(parentHandle)).toBe(GestureIntent.PanAndPinch);

    const handled = EventRouter.dispatchGestureEvent(parentHandle, GestureEventPhase.Update, GestureEventKind.Pinch, 40.0, 55.0, 3.0, -4.0, 1.25, 2);

    expect<bool>(handled).toBe(false);
    expect<i32>(gestureCount).toBe(1);
    expect<GestureEventPhase>(lastGesturePhase).toBe(GestureEventPhase.Update);
    expect<GestureEventKind>(lastGestureKind).toBe(GestureEventKind.Pinch);
    expect<f32>(lastGestureLocalX).toBe(30.0);
    expect<f32>(lastGestureLocalY).toBe(35.0);
    expect<f32>(lastGestureSceneX).toBe(40.0);
    expect<f32>(lastGestureSceneY).toBe(55.0);
    expect<f32>(lastGestureDeltaX).toBe(3.0);
    expect<f32>(lastGestureDeltaY).toBe(-4.0);
    expect<f32>(lastGestureScale).toBe(1.25);
  });

  it("supports pan gesture recognizer callbacks and exposes pan intent", () => {
    EventRouter.reset();
    resetPointerState();

    const node = new FlexBox()
      .panGesture(handleGestureEvent);
    const handle = makeHandle(24, 1);
    EventRouter.register(handle, node);

    expect<GestureIntent>(EventRouter.getGestureIntent(handle)).toBe(GestureIntent.Pan);

    const handled = EventRouter.dispatchGestureEvent(handle, GestureEventPhase.Update, GestureEventKind.Pan, 20.0, 30.0, 6.0, 0.0, 1.0, 2);

    expect<bool>(handled).toBe(false);
    expect<i32>(gestureCount).toBe(1);
    expect<GestureEventKind>(lastGestureKind).toBe(GestureEventKind.Pan);
    expect<f32>(lastGestureDeltaX).toBe(6.0);
  });

  it("supports owner-bound pinch gesture callbacks and filters non-pinch events", () => {
    EventRouter.reset();

    const owner = new GestureOwner();
    const node = new FlexBox()
      .pinchGestureWith<GestureOwner>(owner, (target: GestureOwner, event: GestureEventArgs): void => {
        target.count += 1;
        target.lastScale = event.scale;
      });
    const handle = makeHandle(25, 1);
    EventRouter.register(handle, node);

    expect<GestureIntent>(EventRouter.getGestureIntent(handle)).toBe(GestureIntent.Pinch);

    EventRouter.dispatchGestureEvent(handle, GestureEventPhase.Update, GestureEventKind.Pan, 10.0, 12.0, 4.0, 0.0, 1.0, 2);
    EventRouter.dispatchGestureEvent(handle, GestureEventPhase.Update, GestureEventKind.Pinch, 10.0, 12.0, 0.0, 0.0, 1.4, 2);

    expect<i32>(owner.count).toBe(1);
    expect<f32>(owner.lastScale).toBe(1.4);
  });

  it("bubbles gesture events to ancestors when the child leaves the event unhandled", () => {
    EventRouter.reset();
    resetPointerState();

    const child = new FlexBox();
    child.panGesture(handleChildGestureEvent);
    const parent = new FlexBox();
    parent.panGesture(handleParentGestureEvent);
    parent.child(child);
    const parentHandle = makeHandle(20, 1);
    const childHandle = makeHandle(21, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);
    setNodeBounds(parentHandle, 10.0, 20.0, 200.0, 100.0);
    setNodeBounds(childHandle, 30.0, 45.0, 80.0, 40.0);

    expect<u64>(EventRouter.resolveGestureOwner(childHandle)).toBe(childHandle);

    const handled = EventRouter.dispatchGestureEvent(childHandle, GestureEventPhase.Update, GestureEventKind.Pan, 50.0, 70.0, 4.0, 5.0, 1.0, 2);

    expect<bool>(handled).toBe(false);
    expect<i32>(childGestureOrder).toBe(1);
    expect<i32>(parentGestureOrder).toBe(2);
    expect<f32>(lastGestureLocalX).toBe(40.0);
    expect<f32>(lastGestureLocalY).toBe(50.0);
  });

  it("stops gesture bubbling when the child marks the event handled", () => {
    EventRouter.reset();
    resetPointerState();

    childGestureHandles = true;
    const child = new FlexBox();
    child.pinchGesture(handleChildGestureEvent);
    const parent = new FlexBox();
    parent.pinchGesture(handleParentGestureEvent);
    parent.child(child);
    const parentHandle = makeHandle(22, 1);
    const childHandle = makeHandle(23, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);

    const handled = EventRouter.dispatchGestureEvent(childHandle, GestureEventPhase.Update, GestureEventKind.Pinch, 10.0, 12.0, 0.0, 0.0, 0.9, 2);

    expect<bool>(handled).toBe(true);
    expect<i32>(childGestureOrder).toBe(1);
    expect<i32>(parentGestureOrder).toBe(0);
  });

  it("resolves nested gesture recognizers to child first, then parent fallback", () => {
    EventRouter.reset();
    resetPointerState();

    const child = new FlexBox();
    child.panGesture(handleChildGestureEvent);
    const parent = new FlexBox();
    parent.panGesture(handleParentGestureEvent);
    parent.child(child);
    const parentHandle = makeHandle(31, 1);
    const childHandle = makeHandle(32, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);

    expect<u64>(EventRouter.resolveGestureOwner(childHandle)).toBe(childHandle);

    child.panGesture(null);
    expect<u64>(EventRouter.resolveGestureOwner(childHandle)).toBe(parentHandle);

    child.panGesture(handleChildGestureEvent);
    child.enabled(false);
    expect<u64>(EventRouter.resolveGestureOwner(childHandle)).toBe(parentHandle);
  });

  it("nested gesture handlers compose child handled and parent handled states", () => {
    EventRouter.reset();
    resetPointerState();

    const child = new FlexBox();
    child.panGesture(handleChildGestureEvent);
    const parent = new FlexBox();
    parent.panGesture(handleParentGestureEvent);
    parent.child(child);
    const parentHandle = makeHandle(33, 1);
    const childHandle = makeHandle(34, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);

    let handled = EventRouter.dispatchGestureEvent(childHandle, GestureEventPhase.Update, GestureEventKind.Pan, 12.0, 14.0, 2.0, 0.0, 1.0, 2);

    expect<bool>(handled).toBe(false);
    expect<i32>(childGestureOrder).toBe(1);
    expect<i32>(parentGestureOrder).toBe(2);

    resetPointerState();
    childGestureHandles = true;
    handled = EventRouter.dispatchGestureEvent(childHandle, GestureEventPhase.Update, GestureEventKind.Pan, 12.0, 14.0, 2.0, 0.0, 1.0, 2);

    expect<bool>(handled).toBe(true);
    expect<i32>(childGestureOrder).toBe(1);
    expect<i32>(parentGestureOrder).toBe(0);
  });

  it("resolves the nearest long press owner and dispatches local long press coordinates", () => {
    EventRouter.reset();
    resetPointerState();

    const child = new FlexBox();
    const parent = new FlexBox();
    parent.longPressGesture(handleLongPressEvent);
    parent.child(child);
    const parentHandle = makeHandle(26, 1);
    const childHandle = makeHandle(27, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);
    setNodeBounds(parentHandle, 10.0, 20.0, 200.0, 100.0);

    expect<u64>(EventRouter.resolveLongPressOwner(childHandle)).toBe(parentHandle);

    const handled = EventRouter.dispatchLongPressEvent(parentHandle, 44.0, 58.0, 77, PointerType.Touch, 3, 500);

    expect<bool>(handled).toBe(false);
    expect<i32>(longPressCount).toBe(1);
    expect<f32>(lastLongPressLocalX).toBe(34.0);
    expect<f32>(lastLongPressLocalY).toBe(38.0);
    expect<f32>(lastLongPressSceneX).toBe(44.0);
    expect<f32>(lastLongPressSceneY).toBe(58.0);
    expect<i32>(lastLongPressPointerId).toBe(77);
    expect<PointerType>(lastLongPressPointerType).toBe(PointerType.Touch);
    expect<u32>(lastLongPressModifiers).toBe(3);
    expect<i32>(lastLongPressDurationMs).toBe(500);
  });

  it("supports owner-bound long press callbacks", () => {
    EventRouter.reset();

    const owner = new LongPressOwner();
    const node = new FlexBox()
      .longPressGestureWith<LongPressOwner>(owner, (target: LongPressOwner, event: LongPressEventArgs): void => {
        target.count += 1;
        target.lastDurationMs = event.durationMs;
      });
    const handle = makeHandle(28, 1);
    EventRouter.register(handle, node);

    EventRouter.dispatchLongPressEvent(handle, 10.0, 12.0, 4, PointerType.Pen, 0, 650);

    expect<i32>(owner.count).toBe(1);
    expect<i32>(owner.lastDurationMs).toBe(650);
  });

  it("supports configurable long press recognizers", () => {
    EventRouter.reset();

    const owner = new LongPressOwner();
    const node = new FlexBox()
      .longPressRecognizer(
        LongPressGesture.create()
          .minimumDuration(650)
          .movementTolerance(14.0)
          .onRecognizedWith<LongPressOwner>(owner, (target: LongPressOwner, event: LongPressEventArgs): void => {
            target.count += 1;
            target.lastDurationMs = event.durationMs;
          }),
      );
    const handle = makeHandle(37, 1);
    EventRouter.register(handle, node);

    expect<i32>(EventRouter.getLongPressMinimumDurationMs(handle)).toBe(650);
    expect<f32>(EventRouter.getLongPressMovementTolerance(handle)).toBe(14.0);

    EventRouter.dispatchLongPressEvent(handle, 10.0, 12.0, 4, PointerType.Pen, 0, 650);

    expect<i32>(owner.count).toBe(1);
    expect<i32>(owner.lastDurationMs).toBe(650);

    node.longPressRecognizer(null);

    expect<u64>(EventRouter.resolveLongPressOwner(handle)).toBe(<u64>0);
    expect<i32>(EventRouter.getLongPressMinimumDurationMs(handle)).toBe(500);
    expect<f32>(EventRouter.getLongPressMovementTolerance(handle)).toBe(10.0);
  });

  it("bubbles long press events until handled", () => {
    EventRouter.reset();
    resetPointerState();

    const child = new FlexBox();
    child.longPressGesture(handleChildLongPressEvent);
    const parent = new FlexBox();
    parent.longPressGesture(handleParentLongPressEvent);
    parent.child(child);
    const parentHandle = makeHandle(29, 1);
    const childHandle = makeHandle(30, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);

    let handled = EventRouter.dispatchLongPressEvent(childHandle, 10.0, 12.0, 4, PointerType.Touch, 0, 500);

    expect<bool>(handled).toBe(false);
    expect<i32>(childLongPressOrder).toBe(1);
    expect<i32>(parentLongPressOrder).toBe(2);

    resetPointerState();
    childLongPressHandles = true;
    handled = EventRouter.dispatchLongPressEvent(childHandle, 10.0, 12.0, 4, PointerType.Touch, 0, 500);

    expect<bool>(handled).toBe(true);
    expect<i32>(childLongPressOrder).toBe(1);
    expect<i32>(parentLongPressOrder).toBe(0);
  });

  it("resolves nested long press recognizers to child first, then parent fallback", () => {
    EventRouter.reset();

    const child = new FlexBox();
    child.longPressGesture(handleChildLongPressEvent);
    const parent = new FlexBox();
    parent.longPressGesture(handleParentLongPressEvent);
    parent.child(child);
    const parentHandle = makeHandle(35, 1);
    const childHandle = makeHandle(36, 1);
    EventRouter.register(parentHandle, parent);
    EventRouter.register(childHandle, child);

    expect<u64>(EventRouter.resolveLongPressOwner(childHandle)).toBe(childHandle);

    child.longPressGesture(null);
    expect<u64>(EventRouter.resolveLongPressOwner(childHandle)).toBe(parentHandle);

    child.longPressGesture(handleChildLongPressEvent);
    child.enabled(false);
    expect<u64>(EventRouter.resolveLongPressOwner(childHandle)).toBe(parentHandle);
  });

  it("resolves selectable text as a built-in long press owner", () => {
    EventRouter.reset();

    const text = new Text("touch selectable text");
    const handle = text.build();

    expect<u64>(EventRouter.resolveLongPressOwner(handle)).toBe(handle);
  });

  it("resolves editable text as a built-in long press owner", () => {
    EventRouter.reset();

    const text = new Text("touch editable text").editable();
    const handle = text.build();

    expect<u64>(EventRouter.resolveLongPressOwner(handle)).toBe(handle);
  });

  it("resolves a TextInput shell to its internal editable text for built-in long press", () => {
    EventRouter.reset();

    const input = new TextInput("touch editable shell");
    const shellHandle = input.build();
    const editorHandle = input.editorNode.builtHandle;

    expect<bool>(input.isEditableText).toBe(false);
    expect<bool>(input.editorNode.isEditableText).toBe(true);
    expect<u64>(EventRouter.resolveLongPressOwner(shellHandle)).toBe(editorHandle);
  });

  it("selects the pressed word for touch long press on selectable text", () => {
    EventRouter.reset();
    resetCalls();

    const text = new Text("touch selectable text");
    const handle = text.build();

    const handled = EventRouter.dispatchLongPressEvent(handle, 42.0, 18.0, 9, PointerType.Touch, 0, 500);
    const callIndex = findCall(CALL_SELECT_WORD_AT);

    expect<bool>(handled).toBe(true);
    expect<bool>(callIndex >= 0).toBe(true);
    expect<f64>(getCallArg(callIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(callIndex, 1)).toBe(42.0);
    expect<f64>(getCallArg(callIndex, 2)).toBe(18.0);
  });

  it("selects the pressed word for touch long press on editable text", () => {
    EventRouter.reset();
    resetCalls();

    const text = new Text("touch editable text").editable();
    const handle = text.build();

    const handled = EventRouter.dispatchLongPressEvent(handle, 42.0, 18.0, 9, PointerType.Touch, 0, 500);
    const callIndex = findCall(CALL_SELECT_WORD_AT);

    expect<bool>(handled).toBe(true);
    expect<bool>(callIndex >= 0).toBe(true);
    expect<f64>(getCallArg(callIndex, 0)).toBe(<f64>handle);
  });

  it("handles mouse long press without running built-in word selection", () => {
    EventRouter.reset();
    resetCalls();

    const text = new Text("touch selectable text");
    const handle = text.build();

    const handled = EventRouter.dispatchLongPressEvent(handle, 42.0, 18.0, 9, PointerType.Mouse, 0, 500);

    expect<bool>(handled).toBe(true);
    expect<i32>(findCall(CALL_SELECT_WORD_AT)).toBe(-1);
  });

  it("routes cancel to the captured node, clears capture, and does not fire click", () => {
    EventRouter.reset();
    resetPointerState();

    const captured = new CapturingNode();
    captured.onPointerClick(handleClick)
      .onPointerCancel(handlePointerEvent);
    const other = new FlexBox();
    const capturedHandle = makeHandle(10, 1);
    const otherHandle = makeHandle(11, 1);
    EventRouter.register(capturedHandle, captured);
    EventRouter.register(otherHandle, other);

    captured.captureNow();
    EventRouter.dispatchPointerEvent(otherHandle, PointerEventType.Cancel, 80.0, 90.0, 0, 24, PointerType.Touch);
    EventRouter.dispatchPointerEvent(otherHandle, PointerEventType.Move, 82.0, 92.0, 0, 24, PointerType.Touch);

    expect<i32>(clickCount).toBe(0);
    expect<PointerEventType>(lastEventType).toBe(PointerEventType.Cancel);
    expect<i32>(lastPointerId).toBe(24);
    expect<i32>(legacyMoveCount).toBe(0);
  });
});
